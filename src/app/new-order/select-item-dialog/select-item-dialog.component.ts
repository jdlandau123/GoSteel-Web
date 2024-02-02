import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatDialogRef } from '@angular/material/dialog';
import { IItem } from 'src/app/interfaces';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
}  from '@angular/forms';
import { Observable } from 'rxjs';
import { FirebaseService } from '../../services/firebase.service';

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
              private _firebaseService: FirebaseService) {
  }

  ngOnInit(): void {
    this.itemTypes = this._firebaseService.query<IItem>('Items');
  }

}
