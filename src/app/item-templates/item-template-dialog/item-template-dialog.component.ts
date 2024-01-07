import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { IItemTemplate } from 'src/app/interfaces';
import { FirebaseService } from 'src/app/services/firebase.service';

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
              private _firebaseService: FirebaseService) {}

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
    await this._firebaseService.deleteItem('ItemTemplates', this.data?.item.id);
    this.dialogRef.close();
  }
}
