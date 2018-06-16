import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/retry';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor() {}
  public showError(codeOrMsg: string) {
    codeOrMsg
      ? (codeOrMsg = ': ' + codeOrMsg.slice(0, 19) + '... ')
      : (codeOrMsg = '');
    // TODO sent a UI warning including codeOrMsg
  }
  public intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next
      .handle(request)
      .retry(3)
      .catch((err: HttpErrorResponse) => {
        if (err.error instanceof Error) {
          this.showError(err.error.message);
        } else {
          this.showError(err.status.toString() + ' ' + err.error);
        }
        return Observable.empty<HttpEvent<any>>();
      });
  }
}
