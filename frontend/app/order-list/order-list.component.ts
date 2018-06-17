/*
I expect the core requirement is to build a user-friendly data loading experience.
Usually, we create a pagination data table for doing such
But, it is considered not a good practice for both usability and backend performance

i.e., user may not want to use following navigator to browse data:

<first page 1 ><prev>......[345], [current page 346], [347].....<next><end page 2000>

because personally, I do not care about what page I am reading and how long exactly the data is.
And lively querying a large data set from the different servers merely output its length is nearly impossible for
the modern NoSQL.

What I suggest to do is to create a render queue, as drawn below:
Pages not in the viewport (-+ offset) will be removed from the DOM
to save the render performance of browsers

|||||||||removed from DOM||||||||||lazyLoaded to DOM||||||||||||||||||removed from DOM|||||||||||||||||
                                   [in the viewport]

A lazyloaded, smooth scrolling with cancellable + debouncing data loading is presented.

1) We need to know if there is `nextPage` in the last response.
2) If the `nextPage` is true, we create a `loading dom` element appending to the original rows to increase the scrollHeight.
The purpose here is to let user scroll down to trigger the new API call.
3) We set a default `debounceTimeOut` as if user scrolls up to make the `loading dom` onto our viewport,
the timeout starts.
4) If the `loading dom` is scroll back down within the timeout, 1500ms, the attempted API call will be cancelled.
But if the loading dom still in our viewport or within an offset (not implemented), the API call will be fired.

To optimise the UI rendering memory usage, I created a queue that remove old data from the top if we considered
the DOM added are too many to perform on mobile devices.

*/

import {
  Component,
  OnInit,
  AfterViewInit,
  AfterContentInit,
  ViewChild,
  ElementRef,
  OnChanges,
  ChangeDetectorRef,
  NgZone,
  OnDestroy,
  ApplicationRef
} from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import {
  switchMap,
  debounceTime,
  startWith,
  sampleTime,
  share,
  filter,
  tap,
  take,
  map,
  mergeMap,
  catchError
} from 'rxjs/operators';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/first';
import { OrderListService } from '../services/order-list.service';
import { Order } from '../model/order.model';
import {
  distanceInMiBetweenEarthCoordinates,
  isInArray
} from '../utility/tools';
import { pageQueueLimit, ordersPerPage } from '../utility/resource';
declare var componentHandler: any;

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent
  implements OnInit, AfterViewInit, OnChanges, AfterContentInit, OnDestroy {
  public orders: Order[] = [];
  public isLoading = false;
  public currentPage = 1;
  public hasMoreDown = false;
  public hasMoreUp = false;
  public fixHeight = window.innerHeight - 200;
  public cdr: ChangeDetectorRef;
  public viewedPages = [];

  @ViewChild('scrollTarget') scrollTarget: ElementRef;
  @ViewChild('scrollDownElement') scrollDownElement: ElementRef;
  @ViewChild('scrollUpElement') scrollUpElement: ElementRef;
  // not using
  public orderPropertyTypeList;
  constructor(
    private orderListService: OrderListService,
    public appRef: ApplicationRef
  ) {
    this.orderPropertyTypeList = Object.create({});

    const order = new Order();
    // to get an attribute type list for rendering UI
    Object.keys(order).forEach(
      el =>
        (this.orderPropertyTypeList[el] = Object.prototype.toString.call(
          order[el]
        ))
    );

    console.log(this.orderPropertyTypeList);
    // TODO: hard coding template html is not good, I leave it for future task.
    // I created an Order model that can be used to dynamically build the table columns
    // `orderPropertyTypeList` contains each property type which can be rendered into html using different UI components
    // the form/table item may be unknown to front end developers
    // through this way we can extend the order model at any time
    // basically maintainance of some particular part at one side (backend <-> designer) is always better than
    // involve everyone
  }

  async loadList(direction) {
    this.isLoading = true;
    if (direction === 'down') {
      this.currentPage = Math.max(...this.viewedPages) + 1;
      const result = await this.getOrderList(this.currentPage);
      if (result.error === 0) {
        this.hasMoreDown = result.result.nextPage;
        this.orders = [
          ...this.orders,
          ...(result.result &&
            result.result.items &&
            result.result.items.map(el => {
              return {
                ...el,
                distanceLeft: distanceInMiBetweenEarthCoordinates(
                  el.deliveryLocation.lat,
                  el.deliveryLocation.long,
                  el.currentLocation.lat,
                  el.currentLocation.long
                ),
                totalDistance: distanceInMiBetweenEarthCoordinates(
                  el.deliveryLocation.lat,
                  el.deliveryLocation.long,
                  el.vendorLocation.lat,
                  el.vendorLocation.long
                )
              };
            }))
        ];

        this.checkQueue(this.currentPage, direction);
        if (Math.min(...this.viewedPages) > 1) {
          this.hasMoreUp = true;
        } else {
          this.hasMoreUp = false;
        }
        console.log(this.orders);
        // TODO: as the listener runs outside angular, I need to call tick() each time of variable changes
        // Good practice is to extract the lazy load into a shared module, then add getOrderList as
        // event listener to the lazy load directive
        // But due to time limit this code becomes cumbersome...
        this.appRef.tick();

        this.isLoading = false;
      } else {
        // TODO: notice user data failed
        this.isLoading = false;
      }
    } else if (direction === 'up') {
      this.currentPage = Math.min(...this.viewedPages) - 1;
      const result = await this.getOrderList(this.currentPage);
      if (result.error === 0) {
        this.orders = [
          ...(result.result &&
            result.result.items &&
            result.result.items.map(el => {
              return {
                ...el,
                distanceLeft: distanceInMiBetweenEarthCoordinates(
                  el.deliveryLocation.lat,
                  el.deliveryLocation.long,
                  el.currentLocation.lat,
                  el.currentLocation.long
                ),
                totalDistance: distanceInMiBetweenEarthCoordinates(
                  el.deliveryLocation.lat,
                  el.deliveryLocation.long,
                  el.vendorLocation.lat,
                  el.vendorLocation.long
                )
              };
            })),
          ...this.orders
        ];

        this.checkQueue(this.currentPage, direction);
        if (Math.min(...this.viewedPages) > 1) {
          this.hasMoreUp = true;
        } else {
          this.hasMoreUp = false;
        }
        console.log(this.orders);
        // TODO: as the listener runs outside angular, I need to call tick() each time of variable changes
        // Good practice is to extract the lazy load into a shared module, then add getOrderList as
        // event listener to the lazy load directive
        // But due to time limit this code becomes cumbersome...
        this.appRef.tick();

        this.isLoading = false;
      } else {
        // TODO: notice user data failed
        this.isLoading = false;
      }
    }
  }

  async getOrderList(page) {
    // TODO: error handler
    const resOrders = await this.orderListService
      .getOrders(page)
      .first()
      .toPromise();
    return resOrders;
  }
  async ngOnInit() {
    window.onresize = event => {
      this.fixHeight = window.innerHeight - 200;
    };
    this.isLoading = true;

    const result = await this.getOrderList(this.currentPage);

    if (result.error === 0) {
      this.hasMoreDown = result.result.nextPage;
      this.orders = [
        ...this.orders,
        ...(result.result &&
          result.result.items &&
          result.result.items.map(el => {
            return {
              ...el,
              distanceLeft: distanceInMiBetweenEarthCoordinates(
                el.deliveryLocation.lat,
                el.deliveryLocation.long,
                el.currentLocation.lat,
                el.currentLocation.long
              ),
              totalDistance: distanceInMiBetweenEarthCoordinates(
                el.deliveryLocation.lat,
                el.deliveryLocation.long,
                el.vendorLocation.lat,
                el.vendorLocation.long
              )
            };
          }))
      ];

      this.checkQueue(this.currentPage, 'down');
      console.log(this.orders);
      // TODO: as the listener runs outside angular, I need to call tick() each time of variable changes
      // Good practice is to extract the lazy load into a shared module, then add getOrderList as
      // event listener to the lazy load directive
      // But due to time limit this code becomes cumbersome...
      this.appRef.tick();

      this.isLoading = false;
    } else {
      // TODO: notice user data failed
      this.isLoading = false;
    }
  }

  ngOnChanges(): void {
    this.cdr.detectChanges();
    // useless here only for eliminates any 'value changed after detection' for any @Input parameters
  }

  ngAfterViewInit() {
    // re-render the MDL element after view change
    // [ref]https://stackoverflow.com/questions/31296803/rerendering-mdl-drawer-menu-makes-drawer-button-disappear
    componentHandler.upgradeDom();
  }

  ngOnDestroy() {}

  ngAfterContentInit() {}

  public checkQueue(page, direction) {
    if (direction === 'down') {
      // enqueue
      this.viewedPages = [...this.viewedPages, page];
      // check if queue is full
      if (this.viewedPages.length <= pageQueueLimit) {
        console.log('Q_' + JSON.stringify(this.viewedPages));
        return;
      }
      // dequeue
      this.viewedPages.splice(0, 1);
      console.log('Q_' + JSON.stringify(this.viewedPages));
      this.orders.splice(0, ordersPerPage);
    } else if (direction === 'up') {
      // enqueue
      this.viewedPages = [page, ...this.viewedPages];
      // check if queue is full
      if (this.viewedPages.length <= pageQueueLimit) {
        console.log('Q_' + JSON.stringify(this.viewedPages));
        return;
      }
      // dequeue
      this.viewedPages = this.viewedPages.slice(0, this.viewedPages.length - 1);
      console.log('Q_' + JSON.stringify(this.viewedPages));

      this.orders = this.orders.splice(0, this.orders.length - ordersPerPage);
      this.hasMoreDown = true;
      this.appRef.tick();
    }
  }
}
