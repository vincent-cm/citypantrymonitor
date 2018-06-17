import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpErrorInterceptor } from './utility/httpInterceptor';
import { ModuleWithProviders } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRouterModule } from './app.router';
import { HomepageComponent } from './homepage/homepage.component';
import { OrderListComponent } from './order-list/order-list.component';
import { OrderListService } from './services/order-list.service';
import { environment } from '../environments/environment';
import { ApiModule } from './api.module';
import { Configuration } from './configuration';
import { SpinKitModule } from './spin-kit/spin-kit.module';
import { LazyLoadModule } from './lazy-load/lazy-load.module';

// to consider a production ready configurable service
// create a injectable param for any service, starting below:

const configurationParam = {
  // looking server.ts `content-type`, here turn off credential bind
  withCredentials: false,
  basePath: environment.apiUrl
};

export function configurationFactory() {
  return new Configuration(configurationParam);
}

@NgModule({
  declarations: [AppComponent, HomepageComponent, OrderListComponent],
  imports: [
    BrowserModule,
    AppRouterModule,
    HttpModule,
    BrowserAnimationsModule,
    ApiModule.forRoot(configurationFactory),
    SpinKitModule,
    LazyLoadModule
  ],
  providers: [
    OrderListService,
    // to intercept any connection/server problem
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
