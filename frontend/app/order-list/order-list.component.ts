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
Pages not in the viewport -+ offset will be removed from the DOM
to save the render performance of browsers

|||||||||removed from DOM||||||||||lazyLoaded to DOM||||||||||||||||||removed from DOM|||||||||||||||||
                                   [in the viewport]

A lazyloaded, smooth scrolling with cancellable + debouncing data loading is presented.

1) We need to know if there is `nextPage` in the last response.
2) If the `nextPage` is true, we create a `loading dom` element appending to the original rows to increase the scrollHeight.
The purpose here is to let user know it can be scrolled down.
3) We set a default `debouncingTimeOut` as if user scrolls up to make the loading dom onto our viewport,
the timeout starts.
4) If the loading dom is scroll back down within the timeout, the attempted API call will be cancelled.
But if the loading dom still in our viewport or within a `lazyLoadOffset`, the API call will be fired.

Future improvements:

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

import { OrderListService } from '../services/order-list.service';
import { Order } from '../model/order.model';
import { distanceInMiBetweenEarthCoordinates } from '../utility/tools';
import { scrollEventTimeout, debounceTimeOut } from '../utility/resource';
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
  public hasMore = true;
  public orderPropertyTypeList;
  public fixHeight = window.innerHeight - 200;
  public cdr: ChangeDetectorRef;
  public elementRef: ElementRef;
  public ngZone: NgZone;
  private scrollSubscription;
  @ViewChild('scrollTarget') scrollTarget: ElementRef;
  @ViewChild('scrollElement') scrollElement: ElementRef;
  constructor(
    private orderListService: OrderListService,
    el: ElementRef,
    ngZone: NgZone,
    public appRef: ApplicationRef
  ) {
    this.elementRef = el;
    this.ngZone = ngZone;
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

  async getOrderList(page) {
    this.isLoading = true;
    this.orderListService.getOrders(page).subscribe(
      resOrders => {
        if (resOrders.error === 0) {
          this.hasMore = resOrders.result.nextPage;
          this.orders = [
            ...this.orders,
            ...(resOrders.result &&
              resOrders.result.items &&
              resOrders.result.items.map(el => {
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
          console.log(this.orders);
          //TODO: as the listener runs outside angular, I need to call tick() each time of UI changes
          // Good practice is extract the whole lazy load into a module, then add getOrderList as
          // event listener, assign an event emitter @output to the lazy load directive
          // But due to time limit this code becomes cumbersome...
          this.appRef.tick();

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
  async ngOnInit() {
    await this.getOrderList(this.currentPage);
    if (this.hasMore) {
      this.getLazyLoadControl();
    }
    window.onresize = event => {
      this.fixHeight = window.innerHeight - 200;
    };
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

  ngOnDestroy() {
    [this.scrollSubscription]
      .filter(subscription => subscription && !subscription.isUnsubscribed)
      .forEach(subscription => subscription.unsubscribe());
  }

  ngAfterContentInit() {}

  // Scroll to load event listener
  // TODO: Need to seperate below code as a shared module

  public getLazyLoadControl() {
    if (typeof window === 'undefined') {
      return null;
    }

    this.ngZone.runOutsideAngular(() => {
      let scrollObservable: Observable<Event>;
      scrollObservable = getScrollListener(this.scrollTarget.nativeElement);

      this.scrollSubscription = Observable.of('Started')
        // switch the stream to determine if the element comes to the viewport
        .switchMap(stream =>
          scrollObservable.pipe(
            lazyLoad(
              this.scrollElement.nativeElement,
              this.scrollTarget.nativeElement
            )
          )
        )
        .debounceTime(debounceTimeOut)
        .subscribe(success => {
          this.currentPage = this.currentPage + 1;
          return this.getOrderList(this.currentPage);
        });
    });
  }
}

// TODO: to make extendable (generic) event listener across application

export const getScrollListener = (scrollTarget): Observable<any> => {
  const scrollListeners = new WeakMap<any, Observable<any>>();
  if (!scrollTarget || typeof scrollTarget.addEventListener !== 'function') {
    return Observable.empty();
  }
  if (scrollListeners.has(scrollTarget)) {
    return scrollListeners.get(scrollTarget);
  }
  const srollEvent = Observable.create(observer => {
    const eventName = 'scroll';
    const handler = event => observer.next(event);
    const options = { passive: true, capture: false };

    // TODO: not tested if compatible to IE11 :: addEventListener ::
    scrollTarget.addEventListener(eventName, handler, options);
    return () => scrollTarget.removeEventListener(eventName, handler, options);
  });

  // Pipe scroll event every 100ms
  const listener = srollEvent
    .sampleTime(scrollEventTimeout)
    .share()
    .startWith('');
  scrollListeners.set(scrollTarget, listener);
  return listener;
};

export function lazyLoad(el, target) {
  return (scrollObservable: Observable<Event>) => {
    return (
      scrollObservable
        .filter(() => isVisible(el, target))
        // .take(1)
        .map(() => true)
    );
  };
}

export function isVisible(element: HTMLElement, scrollContainer?: HTMLElement) {
  const elementBounds = Rect.fromElement(element);
  if (elementBounds === Rect.empty) {
    return false;
  }
  const windowBounds = Rect.fromWindow(window);
  elementBounds.inflate(0);

  if (scrollContainer) {
    const scrollContainerBounds = Rect.fromElement(scrollContainer);
    const intersection = scrollContainerBounds.getIntersectionWith(
      windowBounds
    );
    return elementBounds.intersectsWith(intersection);
  } else {
    return elementBounds.intersectsWith(windowBounds);
  }
}

export class Rect {
  static empty: Rect = new Rect(0, 0, 0, 0);

  left: number;
  top: number;
  right: number;
  bottom: number;

  constructor(left: number, top: number, right: number, bottom: number) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  static fromElement(element: HTMLElement): Rect {
    const { left, top, right, bottom } = element.getBoundingClientRect();

    if (left === 0 && top === 0 && right === 0 && bottom === 0) {
      return Rect.empty;
    } else {
      return new Rect(left, top, right, bottom);
    }
  }

  static fromWindow(_window: Window): Rect {
    return new Rect(0, 0, _window.innerWidth, _window.innerHeight);
  }

  inflate(inflateBy: number) {
    this.left -= inflateBy;
    this.top -= inflateBy;
    this.right += inflateBy;
    this.bottom += inflateBy;
  }

  intersectsWith(rect: Rect): boolean {
    return (
      rect.left < this.right &&
      this.left < rect.right &&
      rect.top < this.bottom &&
      this.top < rect.bottom
    );
  }

  getIntersectionWith(rect: Rect): Rect {
    const left = Math.max(this.left, rect.left);
    const top = Math.max(this.top, rect.top);
    const right = Math.min(this.right, rect.right);
    const bottom = Math.min(this.bottom, rect.bottom);

    if (right >= left && bottom >= top) {
      return new Rect(left, top, right, bottom);
    } else {
      return Rect.empty;
    }
  }
}
