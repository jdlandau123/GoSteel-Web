import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../material.module';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../services/title.service';
import { FirebaseService } from '../services/firebase.service';
import { LoadingService } from '../services/loading.service';
import { BehaviorSubject, filter, debounceTime } from 'rxjs';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { OrderDialogComponent } from './order-dialog/order-dialog.component';
import { IOrder, IOrderPanel } from '../interfaces';
import { Timestamp, where, orderBy, or, and } from 'firebase/firestore';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: BehaviorSubject<IOrder[]> = new BehaviorSubject<IOrder[]>([]);
  tableColumns = ['name', 'date', 'price', 'delete'];
  // searchInput = new FormControl(null);
  
  constructor(private _titleService: TitleService, private _firebaseService: FirebaseService,
              public loadingService: LoadingService, public dialog: MatDialog) {
    this._titleService.title.set('Orders');
  }

  ngOnInit(): void {
    // this.searchInput.valueChanges.pipe(
    //   debounceTime(500)
    // ).subscribe(search => {
    //   const w = or(   
    //     where('lastName', '>=', search),
    //     where('lastName', '<=', search + "\uf8ff"),
    //     where('email', '==', search),
    //     where('phone', '==', search)
    //   );
    //   this._firebaseService.query<IOrder>('Orders', w).subscribe(o => this.orders.next(o));
    // })
    this._firebaseService.query<IOrder>('Orders').subscribe(o => this.orders.next(o));
  }

  timestampToDate(timestamp: Timestamp): Date {
    if (!timestamp) return null;
    return new Date(timestamp.seconds * 1000);
  }

  sortTable(event: any) {
    let field;
    switch (event.active) {
      case 'name': field = 'lastName'; break;
      case 'date': field = 'dateCreated'; break;
      case 'price': field = 'totalPrice'; break;
      default: break;
    }
    const ordering = event.direction === 'desc' ? orderBy(field, 'desc') : orderBy(field);
    this._firebaseService.query<IOrder>('Orders', null, ordering).subscribe(o => this.orders.next(o));
  }

  openOrder(order: IOrder) {
    this.dialog.open(OrderDialogComponent, {
      data: {
        order
      }
    });
  }

  deleteOrder(order: IOrder) {
    this.dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        itemType: 'Order'
      }
    }).afterClosed().pipe(
      filter(r => r)
    ).subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this._firebaseService.deleteItem('Orders', order.id);
        this._firebaseService.query<IOrderPanel>('OrderPanels', where('orderId', '==', order.id)).subscribe(panels => {
          panels.forEach(panel => {
            this._firebaseService.deleteItem('OrderPanels', panel.id);
          })
        })
        this._firebaseService.query<IOrder>('Orders').subscribe(o => this.orders.next(o));
      }
    });
  }

}
