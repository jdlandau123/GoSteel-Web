import { Routes } from '@angular/router';
import { NewOrderComponent } from './new-order/new-order.component';
import { OrdersComponent } from './orders/orders.component';
import { ItemTemplatesComponent } from './item-templates/item-templates.component';

export const routes: Routes = [
    { component: OrdersComponent, path: '' },
    { component: OrdersComponent, path: 'orders' },
    { component: NewOrderComponent, path: 'new-order' },
    { component: ItemTemplatesComponent, path: 'item-templates' },
];
