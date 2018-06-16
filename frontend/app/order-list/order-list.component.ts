/*
I expect the core requirement is to build a user-friendly data loading experience.
Usually, we create a pagination data table for doing such
But, it is considered not a good practice for both usability and backend performance

i.e., user may not want to use following navigator to browse data:

<first page 1 ><prev>......[345], [current page 346], [347].....<next><end page 2000>

because personally, I do not care about what page I am reading and how long exactly the data is.
And lively querying a large data set from the different servers only output its length is nearly impossible for
the modern NoSQL.

Instead, a lazyloaded, smooth scrolling with cancellable + debouncing data loading is presented.

1) We need to know if there is `nextPage` in the very recent response.
2) If the `nextPage` is true, we create a fake dom element appending to the original rows to increase the scrollHeight.
The purpose here is to let user know it can be scrolled down.
The length of fake dom, we call it can be configured by global settings, I set it 3 times of page length, 300.
3) We set a default `debouncingTimeOut` as if user scrolls up to make the fake dom onto our viewport,
the timeout starts.
4) If the fake dom is scroll back down within the timeout, the attempted API call will be cancelled.
But if the fake dom still in our viewport or within a `lazyLoadOffset`, the API call will be fired.

Future improvements:

*/

import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnChanges,
  ChangeDetectorRef
} from '@angular/core';
import { OrderListService } from '../services/order-list.service';
import { Order } from '../model/order.model';
import * as $ from 'jquery';
import { distanceInMiBetweenEarthCoordinates } from '../utility/tools';
declare var componentHandler: any;

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, AfterViewInit, OnChanges {
  public orders: Order[] = [];
  public isLoading = false;
  public currentPage = 1;
  public hasMore: boolean = true;
  public orderPropertyTypeList;
  public fixHeight = window.innerHeight - 200;
  private cdr: ChangeDetectorRef;

  @ViewChild('tableScrollable') tableScrollable: ElementRef;
  constructor(private orderListService: OrderListService, el: ElementRef) {
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
  }

  getOrderList(page) {
    this.isLoading = true;
    this.orderListService.getOrders(page).subscribe(
      resOrders => {
        if (resOrders.error === 0) {
          this.hasMore = resOrders.result.nextPage;
          this.orders = resOrders.result && resOrders.result.items;

          this.orders.forEach(el => {
            el.distanceLeft = distanceInMiBetweenEarthCoordinates(
              el.deliveryLocation.lat,
              el.deliveryLocation.long,
              el.currentLocation.lat,
              el.currentLocation.long
            );
            el.totalDistance = distanceInMiBetweenEarthCoordinates(
              el.deliveryLocation.lat,
              el.deliveryLocation.long,
              el.vendorLocation.lat,
              el.vendorLocation.long
            );
          });

          this.isLoading = false;
        } else {
          // TODO: notice user data failed
          this.isLoading = false;
        }
      },
      err => {
        // TODO: handle(error)
        this.isLoading = false;
      }
    );
  }
  ngOnInit() {
    this.getOrderList(this.currentPage);
    window.onresize = event => {
      this.fixHeight = window.innerHeight - 200;
    };
  }

  ngOnChanges(): void {
    this.cdr.detectChanges();
  }

  ngAfterViewInit() {
    // re-render the MDL element after view change
    // [ref]https://stackoverflow.com/questions/31296803/rerendering-mdl-drawer-menu-makes-drawer-button-disappear
    componentHandler.upgradeDom();
  }
}
