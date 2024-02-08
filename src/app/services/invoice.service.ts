import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { IOrder, ICustomer, IOrderPanel, IAddress, IItemTemplate } from '../interfaces';
import { where } from 'firebase/firestore';
import { forkJoin, from, switchMap, of, lastValueFrom } from 'rxjs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

@Injectable()
export class InvoiceService {
  constructor(private _firebaseService: FirebaseService) { }

  async createInvoice(orderId: string) {
    const data: any = await lastValueFrom(from(this._firebaseService.getItem('Orders', orderId)).pipe(
      switchMap(order => forkJoin({
        order: of(order),
        customer: from(this._firebaseService.getItem('Customers', order['customerId'])),
        addresses: this._firebaseService.query<IAddress>('Addresses', where('customerId', '==', order['customerId'])),
        panels: this._firebaseService.query<IOrderPanel>('OrderPanels', where('orderId', '==', orderId))
      }))
    ));
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    let lineHeight = 15;
    let marginLeft = 15;

    const shippingAddress = data.addresses.filter((a: IAddress) => a.type === 'shipping')[0];

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
        [this.createBillToString(data.customer), this.createShipToString(shippingAddress), this.createOrderInfoString(data.order)],
      ],
    })

    lineHeight += 15;

    const body: any[] = [];
    let itemCount = 1;
    let totalUnitCount = 0;
    let subTotalPrice = 0;
    for (let i=0; i<data.panels.length; i++) {
      for (let ip=0; ip<data.panels[i].packages.length; ip++) {
        const p = data.panels[i].packages[ip];
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

    const docName = `GoSteel_Order_${orderId}_Invoice.pdf`;
    // doc.save(docName); // saves to downloads folder and opens in new tab
    await this._firebaseService.uploadDocument(`invoices/${docName}`, doc.output('blob'));
    await this._firebaseService.updateItem('Orders', orderId, {hasInvoice: true});
  }

  createBillToString(customer: ICustomer): string {
    const company = customer?.companyName ? customer?.companyName : '';
    const phone = customer?.phone ? customer?.phone : '';
    const email = customer?.email ? customer?.email : '';
    return `Company: ${company}\nName: ${customer?.firstName} ${customer?.lastName}\nPhone: ${phone}\nEmail: ${email}`;
  }

  createShipToString(address: IAddress): string {
    if (!address) return '';
    return `${address.streetAddress}\n${address?.city} ${address?.state}, ${address?.zip}`;
  }

  createOrderInfoString(order: IOrder): string {
    const date = order.dateCreated ? order.dateCreated.toDate().toLocaleDateString() : '';
    const shippingDate = order?.dateShipped ? order?.dateShipped?.toDate().toLocaleDateString() : '';
    return `Date: ${date}\nShipping Date: ${shippingDate}`;
  }

  createItemDescriptionString(p: IItemTemplate): string {
    const desc = p?.description ? p.description : '';
    const color = p?.color ? p.color : '';
    const category = p?.category ? p.category : '';
    return `Item: ${p.item.name}\nColor: ${color}\nCategory: ${category}\nDescription: ${desc}`;
  }
}
