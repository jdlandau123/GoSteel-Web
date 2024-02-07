import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../material.module';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../services/title.service';
import { FirebaseService } from '../services/firebase.service';
import { LoadingService } from '../services/loading.service';
import { BehaviorSubject, Observable, filter, forkJoin, startWith, map } from 'rxjs';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { IAddress, ICustomer, IItemTemplate, IOrder, IOrderPanel } from '../interfaces';
import { Timestamp, where, orderBy } from 'firebase/firestore';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
  },
  addresses: IAddress[]
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
  // tableColumns = ['select', 'name', 'date', 'price', 'delete'];
  tableColumns = ['select', 'name', 'date', 'price'];
  tableRows: BehaviorSubject<ITableRow[]> = new BehaviorSubject<ITableRow[]>([]);
  searchInput = new FormControl<string>('');
  filteredTableRows: Observable<ITableRow[]>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  tableDatasource: MatTableDataSource<ITableRow>;
  selection = new SelectionModel<ITableRow>(true, []);

  constructor(private _titleService: TitleService, private _firebaseService: FirebaseService,
              public loadingService: LoadingService, public dialog: MatDialog, private _snackBar: MatSnackBar) {
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
      customers: this._firebaseService.query<ICustomer>('Customers'),
      addresses: this._firebaseService.query<IAddress>('Addresses')
    }).subscribe((data: {orders: IOrder[], customers: ICustomer[], addresses: IAddress[]}) => {
      const res = [];
      for (let order of data.orders) {
        const customer = data.customers.find(c => c.id === order.customerId);
        const addresses = data.addresses.filter(a => a.customerId === customer.id);
        res.push({customer, addresses, ...order});
      }
      console.log(res);
      this.tableRows.next(res);
      this.searchInput.setValue('');
    });
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

  generateInvoices() {
    for (let row of this.selection.selected) {
      this.createInvoice(row);
    }
    this._snackBar.open('Generating Invoices...');
  }

  createInvoice(row: ITableRow) {
    this._firebaseService.query<IOrderPanel>('OrderPanels', where('orderId', '==', row.id)).subscribe((panels: IOrderPanel[]) => {
      const doc = new jsPDF() as any;
      const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
      let lineHeight = 15;
      let marginLeft = 15;

      // header section
      doc.setFontSize(8);
      doc.text('GoSteel Inc.', marginLeft, lineHeight);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal', 'bold');
      doc.text('Order', pageWidth/2, lineHeight, {align: 'center'});
      doc.setFontSize(8);
      lineHeight += 10;
      doc.text('GoSteel', pageWidth/2, lineHeight, {align: 'center'});
      lineHeight += 5;
      doc.text('14NE 1st Street Miami FL 33132', pageWidth/2, lineHeight, {align: 'center'});
      lineHeight += 5;
      doc.text('Main: 305-373-3332, Cell: 305-988-2922, Gift: 786-452-1950', pageWidth/2, lineHeight, {align: 'center'});
      lineHeight += 5;
      doc.setFont('helvetica', 'normal', 'normal');
      lineHeight += 5;

      // order info table
      doc.autoTable({
        theme: 'plain',
        styles: {
          lineWidth: 0.25,
          lineColor: 'black',
          minCellWidth: 50,
          halign: 'center'
        },
        bodyStyles: {
          halign: 'left'
        },
        margin: {top: lineHeight},
        head: [['Bill To', 'Ship To', '']],
        body: [
          [this.createBillToString(row), this.createShipToString(row), this.createOrderInfoString(row)],
        ],
      })

      lineHeight += 15;

      const body: any[] = [];
      let itemCount = 1;
      let totalUnitCount = 0;
      let subTotalPrice = 0;
      for (let i=0; i<panels.length; i++) {
        for (let ip=0; ip<panels[i].packages.length; ip++) {
          const p = panels[i].packages[ip];
          const itemPrice = p.unitCount * p.item.pricePerUnit;
          const row: any[] = [
            itemCount,
            this.createItemDescriptionString(p),
            p.unitCount,
            `$${p.item.pricePerUnit}`,
            `$${itemPrice}`
          ];
          body.push(row);
          itemCount++;
          totalUnitCount += p.unitCount;
          subTotalPrice += itemPrice;
        }
      }
      body.push([]);
      body.push(['Subtotal', null, totalUnitCount, null, `$${subTotalPrice}`]);
      body.push(['Shipping', null, null, null, '-shipping price-']);
      body.push(['TOTAL', null, null, null, '-total price-']);

      doc.autoTable({
        theme: 'plain',
        styles: {
          lineWidth: 0.25,
          lineColor: 'black',
          minCellWidth: 10,
          halign: 'center'
        },
        bodyStyles: {
          halign: 'left'
        },
        margin: {top: lineHeight},
        head: [['No.', 'Desc.', 'Units', 'Unit Price', 'Total']],
        body
      })

      lineHeight = doc.autoTable.previous.finalY + 15;
      doc.setFontSize(10);

      // footer text
      doc.text('Mail Check Order To:', marginLeft, lineHeight);
      lineHeight += 5;
      doc.text('GOSTEEL INC.', marginLeft, lineHeight);
      lineHeight += 5;
      doc.text('33 SW 2nd Ave #602 (Box #25)', marginLeft, lineHeight);
      lineHeight += 5;
      doc.text('Miami FL, 33130', marginLeft, lineHeight);
      lineHeight += 5;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal', 'bold');
      doc.text('THANK YOU', pageWidth/2, lineHeight, {align: 'center'});

      // doc.save(`GoSteel_Order_${row.id}_Invoice.pdf`); // saves to downloads folder and opens in new tab
      this._firebaseService.uploadDocument(`invoices/GoSteel_Order_${row.id}_Invoice.pdf`, doc.output('blob'));
    });
  }

  createBillToString(row: ITableRow): string {
    const company = row?.customer?.companyName ? row?.customer?.companyName : '';
    const phone = row?.customer?.phone ? row?.customer?.phone : '';
    const email = row?.customer?.email ? row?.customer?.email : '';
    return `Company: ${company}\nName: ${row?.customer?.firstName} ${row?.customer?.lastName}\nPhone: ${phone}\nEmail: ${email}`;
  }

  createShipToString(row: ITableRow): string {
    const shippingAddress = row?.addresses?.filter(a => a.type === 'shipping')[0];
    return shippingAddress ? `${shippingAddress.streetAddress}\n${shippingAddress.city} ${shippingAddress.state}, ${shippingAddress.zip}` : '';
  }

  createOrderInfoString(row: ITableRow): string {
    const date = row.dateCreated ? row.dateCreated.toDate().toLocaleDateString() : '';
    const shippingDate = row?.dateCompleted ? row?.dateCompleted?.toDate().toLocaleDateString() : '';
    return `Date: ${date}\nShipping Date: ${shippingDate}`;
  }

  createItemDescriptionString(p: IItemTemplate): string {
    const desc = p?.description ? p.description : '';
    const color = p?.color ? p.color : '';
    const category = p?.category ? p.category : '';
    return `Item: ${p.item.name}\nColor: ${color}\nCategory: ${category}\nDescription: ${desc}`;
  }

}

