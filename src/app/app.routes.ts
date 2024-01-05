import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { NewOrderComponent } from './new-order/new-order.component';
import { OrdersComponent } from './orders/orders.component';
import { ItemTemplatesComponent } from './item-templates/item-templates.component';
import { FirebaseService } from './services/firebase.service';

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
    { component: NewOrderComponent, path: 'new-order', canActivate: [allowRoute] },
    { component: ItemTemplatesComponent, path: 'item-templates', canActivate: [allowRoute] },
];
