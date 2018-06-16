import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { OrderListComponent } from './order-list/order-list.component';

const appRoutes: Routes = [
  {
    path: 'orders',
    component: OrderListComponent
  },
  {
    path: '',
    component: HomepageComponent
  },
  {
    path: '**',
    component: HomepageComponent
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes),
  ],
  exports: [
    RouterModule
  ]
})
export class AppRouterModule {}
