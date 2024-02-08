import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../material.module';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../services/title.service';
import { FirebaseService } from '../services/firebase.service';
import { LoadingService } from '../services/loading.service';
import { BehaviorSubject, Observable, forkJoin, startWith, map } from 'rxjs';
import { ICustomer, IOrder } from '../interfaces';
import { Timestamp, orderBy } from 'firebase/firestore';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../services/invoice.service';

export interface ITableRow {
  id: string;
  customerId: string;
  showId: string;
  dateCreated: Timestamp;
  datePaid: Timestamp;
  dateShipped: Timestamp;
  totalPrice: number;
  notes: string;
  standColor: string;
  hasInvoice: boolean;
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
  tableColumns = ['select', 'name', 'date', 'hasInvoice'];
  tableRows: BehaviorSubject<ITableRow[]> = new BehaviorSubject<ITableRow[]>([]);
  searchInput = new FormControl<string>('');
  filteredTableRows: Observable<ITableRow[]>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  tableDatasource: MatTableDataSource<ITableRow>;
  selection = new SelectionModel<ITableRow>(true, []);
  invoiceService: InvoiceService;

  constructor(private _titleService: TitleService, private _firebaseService: FirebaseService,
              public loadingService: LoadingService, public dialog: MatDialog, private _snackBar: MatSnackBar) {
    this._titleService.title.set('GoSteel Gift Orders');
    this.invoiceService = new InvoiceService(this._firebaseService);
    this.tableDatasource = new MatTableDataSource();
  }

  ngOnInit(): void {
    if (window.innerWidth > 1000) this.tableColumns.splice(-1, 0,'price');

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
      customers: this._firebaseService.query<ICustomer>('Customers'),
    }).pipe(
      map(data => {
        const res = [];
        for (let order of data.orders) {
          const customer = data.customers.find(c => c.id === order.customerId);
          res.push({customer, ...order});
        }
        return res
      })
    ).subscribe((rows: ITableRow[]) => {
      this.tableRows.next(rows);
      this.searchInput.setValue('');
    })
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.tableDatasource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.tableDatasource.data);
  }

  generateInvoices() {
    for (let row of this.selection.selected) {
      this.invoiceService.createInvoice(row.id);
    }
    this._snackBar.open('Generating Invoices');
    this.buildTableRows();
    this.selection = new SelectionModel<ITableRow>(true, []);
  }

}

