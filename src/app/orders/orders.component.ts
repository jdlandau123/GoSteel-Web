import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../material.module';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../services/title.service';
import { FirebaseService } from '../services/firebase.service';
import { LoadingService } from '../services/loading.service';
import { BehaviorSubject, filter, forkJoin } from 'rxjs';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { OrderDialogComponent } from './order-dialog/order-dialog.component';
import { ICustomer, IOrder, IOrderPanel } from '../interfaces';
import { Timestamp, where, orderBy } from 'firebase/firestore';

export interface ITableRow {
  id: string;
  customerId: string;
  showId: string;
  dateCreated: Timestamp;
  datePaid: Timestamp;
  dateCompleted: Timestamp;
  totalPrice: number;
  notes: string;
  standColor: string;
  customer: {
    id: string;
    firstName: string;
    lastName:string;
    email: string;
    phone: string;
    workPhone: string;
    companyName: string;
    businessType: string;
  }
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: BehaviorSubject<IOrder[]> = new BehaviorSubject<IOrder[]>([]);
  tableColumns = ['name', 'date', 'price', 'delete'];
  tableRows: BehaviorSubject<ITableRow[]> = new BehaviorSubject<ITableRow[]>([]);

  constructor(private _titleService: TitleService, private _firebaseService: FirebaseService,
              public loadingService: LoadingService, public dialog: MatDialog) {
    this._titleService.title.set('Orders');
  }

  ngOnInit(): void {
    this.buildTableRows();
  }

  buildTableRows() {
    forkJoin({
      orders: this._firebaseService.query<IOrder>('Orders'),
      customers: this._firebaseService.query<ICustomer>('Customers')
    }).subscribe((data: {orders: IOrder[], customers: ICustomer[]}) => {
      const res = [];
      for (let order of data.orders) {
        const customer = data.customers.find(c => c.id === order.customerId);
        res.push({customer, ...order});
      }
      this.tableRows.next(res);
    });
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

  openOrder(tableRow: ITableRow) {
    this.dialog.open(OrderDialogComponent, {
      data: { tableRow }
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
        // this.buildTableRows();
        // faster to do this on the front end and skip rebuilding the whole data source
        this.tableRows.next(this.tableRows.value.filter(r => r.id !== order.id));
      }
    });
  }

}
