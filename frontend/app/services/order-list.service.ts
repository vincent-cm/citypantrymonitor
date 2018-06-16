import { Inject, Injectable, Optional } from '@angular/core';
import { Http, Response } from '@angular/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import { BASE_PATH } from '../variable';
import { Configuration } from '../configuration';

@Injectable()
export class OrderListService {
  protected basePath = '';
  public configuration = new Configuration();

  constructor(protected http: Http, @Optional() configuration: Configuration) {
    if (configuration) {
      this.configuration = configuration;
      this.basePath = configuration.basePath || this.basePath;
    }
  }

  public getOrders(page?: number): Observable<Result> {
    const queryParameters = new URLSearchParams();

    if (page === null || page === undefined || page <= 0) {
      page = 1;
    }
    queryParameters.set('page', page.toString());
    return this.http
      .get(`${this.basePath}/orders`, {
        params: queryParameters
      })
      .catch(error => Observable.throw(error.message || error))
      .map((response: Response) => response.json());
  }
}

export interface Result {
  result?: any;
  message?: string;
  error?: number;
}
