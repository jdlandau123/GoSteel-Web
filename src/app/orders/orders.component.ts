import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../material.module';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../services/title.service';
import { FirebaseService } from '../services/firebase.service';
import { LoadingService } from '../services/loading.service';
import { BehaviorSubject, Observable, filter, forkJoin, startWith, map, tap } from 'rxjs';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { ICustomer, IOrder, IOrderPanel } from '../interfaces';
import { Timestamp, where, orderBy } from 'firebase/firestore';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

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
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, AfterViewInit {
  tableColumns = ['name', 'date', 'price', 'delete'];
  tableRows: BehaviorSubject<ITableRow[]> = new BehaviorSubject<ITableRow[]>([]);
  searchInput = new FormControl<string>('');
  filteredTableRows: Observable<ITableRow[]>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  tableDatasource: MatTableDataSource<ITableRow>;

  constructor(private _titleService: TitleService, private _firebaseService: FirebaseService,
              public loadingService: LoadingService, public dialog: MatDialog) {
    this._titleService.title.set('GoSteel Gift Orders');
    this.tableDatasource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.buildTableRows();

    this.filteredTableRows = this.searchInput.valueChanges.pipe(
      startWith(''),
      map((text: string) => text.toString().toLowerCase()),
      map((searchText: string) => this.tableRows.value.filter((r: ITableRow) => {
        return r?.customer?.firstName?.toLowerCase().includes(searchText)
          || r?.customer?.lastName?.toLowerCase().includes(searchText)
          || r?.customer?.email?.toLowerCase().includes(searchText)
          || r?.customer?.phone?.toLowerCase().includes(searchText)
          || r?.customer?.workPhone?.toLowerCase().includes(searchText)
          || r?.customer?.companyName?.toLowerCase().includes(searchText)
      }))
    );

    this.filteredTableRows.subscribe(rows => this.tableDatasource.data = rows);
  }

  ngAfterViewInit(): void {
    this.tableDatasource.paginator = this.paginator;
  }

  buildTableRows() {
    forkJoin({
      orders: this._firebaseService.query<IOrder>('Orders', null, orderBy('dateCreated', 'desc')),
      customers: this._firebaseService.query<ICustomer>('Customers')
    }).subscribe((data: {orders: IOrder[], customers: ICustomer[]}) => {
      const res = [];
      for (let order of data.orders) {
        const customer = data.customers.find(c => c.id === order.customerId);
        res.push({customer, ...order});
      }
      this.tableRows.next(res);
      this.searchInput.setValue('');
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
        this.searchInput.setValue('');
      }
    });
  }

}
