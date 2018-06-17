import {
  OnInit,
  AfterViewInit,
  AfterContentInit,
  ViewChild,
  ElementRef,
  OnChanges,
  ChangeDetectorRef,
  NgZone,
  OnDestroy,
  Directive,
  EventEmitter,
  Input,
  Output,
  SimpleChanges
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
import { scrollEventTimeout, debounceTimeOut } from '../utility/resource';

interface LazyLoadProps {
  scrollTarget: any;
}

@Directive({
  selector: '[appLazyLoad]'
})
export class LazyLoadDirective
  implements AfterContentInit, OnChanges, OnDestroy {
  @Input() scrollTarget: any;
  @Output() onLoad: EventEmitter<boolean> = new EventEmitter();
  private propertyChanges$: ReplaySubject<LazyLoadProps>;
  private elementRef: ElementRef;
  private ngZone: NgZone;
  private scrollSubscription;

  constructor(el: ElementRef, ngZone: NgZone) {
    this.elementRef = el;
    this.ngZone = ngZone;
    this.propertyChanges$ = new ReplaySubject();
  }

  ngOnChanges(changes?: SimpleChanges) {
    this.propertyChanges$.next({
      scrollTarget: this.scrollTarget
    });
  }

  ngAfterContentInit() {
    if (typeof window === 'undefined') {
      return null;
    }

    // to prevent scrollDownElement not ready when list initiates
    this.ngZone.runOutsideAngular(() => {
      let scrollObservable: Observable<Event>;
      scrollObservable = getScrollListener(this.scrollTarget);

      this.scrollSubscription = this.propertyChanges$
        .debounceTime(10)
        // switch the stream to subscribe once the element comes to the viewport
        .switchMap(props =>
          scrollObservable.pipe(
            lazyLoad(this.elementRef.nativeElement, props.scrollTarget)
          )
        )
        .debounceTime(debounceTimeOut)
        .subscribe(success => this.onLoad.emit(success));
    });
  }

  ngOnDestroy() {
    [this.scrollSubscription]
      .filter(subscription => subscription && !subscription.isUnsubscribed)
      .forEach(subscription => subscription.unsubscribe());
  }
}
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
    return scrollObservable.filter(() => isVisible(el, target)).map(() => true);
  };
}

export function isVisible(element: HTMLElement, scrollContainer?: HTMLElement) {
  const elementBounds = Rect.fromElement(element);
  if (elementBounds === Rect.empty) {
    return false;
  }
  const windowBounds = Rect.fromWindow(window);

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
