import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IOrder } from 'src/app/interfaces';
import { Timestamp } from 'firebase/firestore';

interface IDialogData {
  order: IOrder
}

@Component({
  selector: 'app-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule
  ],
  templateUrl: './order-dialog.component.html',
  styleUrls: ['./order-dialog.component.css']
})
export class OrderDialogComponent {
  constructor(public dialogRef: MatDialogRef<OrderDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IDialogData) {
  }

  timestampToDate(timestamp: Timestamp): Date {
    if (!timestamp) return null;
    return new Date(timestamp.seconds * 1000);
  }

}
