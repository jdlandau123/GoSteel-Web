import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IItem } from 'src/app/interfaces';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
}  from '@angular/forms';
import { Observable, map, tap } from 'rxjs';
import { FirebaseService } from '../../services/firebase.service';
import { IPanel } from '../../orders/order-detail/order-detail.component';

interface IDialogData {
  panel: IPanel,
  packageIndex: number
}

@Component({
  selector: 'app-select-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './select-item-dialog.component.html',
  styleUrls: ['./select-item-dialog.component.css']
})
export class SelectItemDialogComponent implements OnInit {
  itemForm = new FormGroup({
    item: new FormControl<IItem>(null, Validators.required),
    color: new FormControl<string>(null),
    description: new FormControl<string>(null),
    category: new FormControl<string>(null)
  });
  itemTypes: Observable<IItem[]>;
  itemCategories = [
    'nautical', 'mountains', 'men', 'women', 'spiritual', 'other'
  ];
  colors = [
    'silver', 'gold', 'black', 'white', 'mixed'
  ];

  constructor(public dialogRef: MatDialogRef<SelectItemDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IDialogData,
              private _firebaseService: FirebaseService) {
  }

  ngOnInit(): void {
    this.itemTypes = this._firebaseService.query<IItem>('Items');
    this.itemForm.patchValue(this.data.panel.packages[this.data.packageIndex]);
    this.itemTypes.pipe(
      map((items: IItem[]) => items.filter(i => i.id === this.data.panel?.packages[this.data.packageIndex]?.item?.id)[0]),
      tap((item: IItem) => this.itemForm.controls.item.setValue(item))
    ).subscribe();
  }

  compareFn(i1: IItem, i2: IItem): boolean {
      return i1 && i2 ? i1.id === i2.id : i1 === i2;
  }
}
