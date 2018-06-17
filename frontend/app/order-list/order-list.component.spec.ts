import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { OrderListComponent } from './order-list.component';
import { SpinKitModule } from '../spin-kit/spin-kit.module';
import { ApiModule } from '../api.module';
import { LazyLoadModule } from '../lazy-load/lazy-load.module';
import { OrderListService } from '../services/order-list.service';
import {
  Http,
  ConnectionBackend,
  RequestOptions,
  HttpModule
} from '@angular/http';
describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [OrderListComponent],
      imports: [SpinKitModule, LazyLoadModule],
      providers: [
        {
          provide: OrderListService,
          useClass: OrderListServiceMock
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain an order table', () => {
    const table = fixture.debugElement.query(By.css('table'));

    expect(table).toBeTruthy();
  });
});

class OrderListServiceMock {}
