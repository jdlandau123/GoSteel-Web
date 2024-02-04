import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { OrdersComponent } from './orders/orders.component';
import { ItemTemplatesComponent } from './item-templates/item-templates.component';
import { FirebaseService } from './services/firebase.service';
import { OrderDetailComponent } from './orders/order-detail/order-detail.component';
import { CustomersComponent } from './customers/customers.component';

function allowRoute() {
    const firebaseService = inject(FirebaseService);
    const router = inject(Router)
    if (firebaseService.isLoggedIn()) {
        return true;
    } else {
        router.navigateByUrl('login');
        return false;
    }
}

export const routes: Routes = [
    { component: LoginComponent, path: 'login' },
    { component: OrdersComponent, path: '', canActivate: [allowRoute] },
    { component: OrdersComponent, path: 'orders', canActivate: [allowRoute] },
    { component: OrderDetailComponent, path: 'orders/:id', canActivate: [allowRoute] },
    { component: OrderDetailComponent, path: 'orders/new', canActivate: [allowRoute] },
    { component: ItemTemplatesComponent, path: 'items', canActivate: [allowRoute] },
    { component: CustomersComponent, path: 'customers', canActivate: [allowRoute] },
];
