import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinKitComponent } from './spin-kit.component';

@NgModule({
  imports: [CommonModule],
  declarations: [SpinKitComponent],
  exports: [SpinKitComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SpinKitModule {}
