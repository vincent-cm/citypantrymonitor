import { TestBed, inject } from '@angular/core/testing';

import { OrderListService } from './order-list.service';
import { Http, HttpModule, XHRBackend, ResponseOptions } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { mockResponse } from './fake-data';

describe('OrderListService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: XHRBackend, useClass: MockBackend },
        OrderListService
      ]
    });
  });

  it('should be created and response correct', inject(
    [OrderListService, XHRBackend],
    (service: OrderListService, mockBackend) => {
      expect(service).toBeTruthy();

      mockBackend.connections.subscribe(connection => {
        connection.mockRespond(
          new Response(
            new ResponseOptions({
              body: JSON.stringify(mockResponse)
            })
          )
        );
      });

      service.getOrders(1).subscribe(data => {
        expect(data.error).toEqual(0);
        expect(data.result.items.length).toEqual(100);
      });
    }
  ));
});
