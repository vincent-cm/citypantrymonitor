import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyLoadDirective } from './lazy-load.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [LazyLoadDirective],
  exports: [LazyLoadDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LazyLoadModule {}
