import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ItemTemplateDialogComponent } from './item-template-dialog/item-template-dialog.component';
import { FirebaseService } from '../services/firebase.service';
import { TitleService } from '../services/title.service';
import { LoadingService } from '../services/loading.service';
import { IItemTemplate } from '../interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-item-templates',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './item-templates.component.html',
  styleUrls: ['./item-templates.component.css']
})
export class ItemTemplatesComponent implements OnInit {
  itemTemplates: Observable<IItemTemplate[]>;
  itemTemplateForm = new FormGroup({
    category: new FormControl<string>(null),
    pricePerUnit: new FormControl<number>(null),
    unitCount: new FormControl<number>(null),
    hooks: new FormControl<number>(null),
    color: new FormControl<string>(null),
    description: new FormControl<string>(null)
  });

  constructor(private _firebaseService: FirebaseService, private _titleService: TitleService,
              public loadingService: LoadingService, public dialog: MatDialog) {
    this._titleService.title.set('Item Templates');
  }

  ngOnInit(): void {
    this.itemTemplates = this._firebaseService.query('ItemTemplates');
  }

  openDialog(type: 'Add' | 'Edit', item: IItemTemplate = null) {
    this.dialog.open(ItemTemplateDialogComponent, {
      data: {
        type,
        item
      }
    }).afterClosed().subscribe(() => {
      this.itemTemplates = this._firebaseService.query('ItemTemplates');
    });
  }

}
