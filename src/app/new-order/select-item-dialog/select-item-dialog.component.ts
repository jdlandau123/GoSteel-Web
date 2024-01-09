import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IItemTemplate } from 'src/app/interfaces';

interface IDialogData {
  itemTemplates: IItemTemplate[];
}

@Component({
  selector: 'app-select-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule
  ],
  templateUrl: './select-item-dialog.component.html',
  styleUrls: ['./select-item-dialog.component.css']
})
export class SelectItemDialogComponent {
  constructor(public dialogRef: MatDialogRef<SelectItemDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IDialogData) {
  }

}
