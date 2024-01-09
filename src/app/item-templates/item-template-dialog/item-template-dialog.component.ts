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
import { IItemTemplate } from 'src/app/interfaces';
import { FirebaseService } from 'src/app/services/firebase.service';
import { DeleteConfirmationDialogComponent } from 'src/app/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { filter } from 'rxjs';

interface IDialogData {
  type: 'Add' | 'Edit',
  item?: IItemTemplate
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
  itemTemplateForm = new FormGroup({
    category: new FormControl<string>(null, Validators.required),
    pricePerUnit: new FormControl<number>(1, Validators.required),
    unitCount: new FormControl<number>(24, Validators.required),
    hooks: new FormControl<number>(0, Validators.required),
    color: new FormControl<string>(null),
    description: new FormControl<string>(null),
  })

  constructor(public dialogRef: MatDialogRef<ItemTemplateDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IDialogData,
              private _firebaseService: FirebaseService,
              private _dialog: MatDialog) {}

  ngOnInit(): void {
    if (this.data.item) {
      this.itemTemplateForm.patchValue(this.data.item);
    }
  }

  async save() {
    if (this.data?.item) await this._firebaseService.updateItem('ItemTemplates', this.data.item.id, this.itemTemplateForm.value);
    else await this._firebaseService.createItem('ItemTemplates', this.itemTemplateForm.value);
    this.dialogRef.close();
  }

  async delete() {
    this._dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        itemType: 'Item Template'
      }
    }).afterClosed().pipe(
      filter(r => r)
    ).subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this._firebaseService.deleteItem('ItemTemplates', this.data?.item.id);
        this.dialogRef.close();
      }
    })
  }

}
