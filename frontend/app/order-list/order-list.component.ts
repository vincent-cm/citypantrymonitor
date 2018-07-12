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
import { distanceInMiBetweenEarthCoordinates } from '../utility/tools';
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
      this.appRef.tick();

      this.isLoading = false;
    } else {
      // TODO: notice user data failed
      this.isLoading = false;
    }
  }

  trackById(index, item) {
    return item.id;
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

  // TODO: need to abstract, and enqueue()/dequeue()/getQueue()
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

      this.orders = this.orders.slice(0, this.orders.length - ordersPerPage);
      this.hasMoreDown = true;
      this.appRef.tick();
    }
  }
}
