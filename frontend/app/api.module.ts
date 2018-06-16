import {
  NgModule,
  ModuleWithProviders,
  SkipSelf,
  Optional
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { OrderListService } from './services/order-list.service';
import { Configuration } from './configuration';
@NgModule({
  imports: [CommonModule, HttpModule],
  declarations: [],
  exports: [],
  providers: [OrderListService]
})
export class ApiModule {
  public static forRoot(
    configurationFactory: () => Configuration
  ): ModuleWithProviders {
    return {
      ngModule: ApiModule,
      providers: [{ provide: Configuration, useFactory: configurationFactory }]
    };
  }

  constructor(
    @Optional()
    @SkipSelf()
    parentModule: ApiModule
  ) {
    if (parentModule) {
      throw new Error('Do not import ApiModule more than once!');
    }
  }
}
