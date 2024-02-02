import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { IItem } from 'src/app/interfaces';
import { FirebaseService } from 'src/app/services/firebase.service';
import { DeleteConfirmationDialogComponent } from 'src/app/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { filter } from 'rxjs';

interface IDialogData {
  type: 'Add' | 'Edit',
  item?: IItem
}

@Component({
  selector: 'app-item-template-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './item-template-dialog.component.html',
  styleUrls: ['./item-template-dialog.component.css']
})
export class ItemTemplateDialogComponent implements OnInit {
  itemForm = new FormGroup({
    id: new FormControl<string>(null),
    name: new FormControl<string>(null, Validators.required),
    pricePerUnit: new FormControl<number>(1, Validators.required),
  });

  constructor(public dialogRef: MatDialogRef<ItemTemplateDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IDialogData,
              private _firebaseService: FirebaseService,
              private _dialog: MatDialog) {}

  ngOnInit(): void {
    if (this.data.item) {
      this.itemForm.patchValue(this.data.item);
    }
  }

  async save() {
    if (this.itemForm.value.id) {
      await this._firebaseService.updateItem('Items', this.data.item.id, this.itemForm.value);
    } else {
      delete this.itemForm.value.id; // this stops firebase from creating a duplicate
      await this._firebaseService.createItem('Items', this.itemForm.value);
    }
    this.dialogRef.close();
  }

  async delete() {
    this._dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        itemType: 'Item'
      }
    }).afterClosed().pipe(
      filter(r => r)
    ).subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this._firebaseService.deleteItem('Items', this.data?.item.id);
        this.dialogRef.close();
      }
    })
  }

}
