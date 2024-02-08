import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { MatDialog } from '@angular/material/dialog';
import { ItemTemplateDialogComponent } from './item-template-dialog/item-template-dialog.component';
import { FirebaseService } from '../services/firebase.service';
import { TitleService } from '../services/title.service';
import { LoadingService } from '../services/loading.service';
import { IItem } from '../interfaces';
import { Observable, tap } from 'rxjs';

@Component({
  selector: 'app-item-templates',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule
  ],
  templateUrl: './item-templates.component.html',
  styleUrls: ['./item-templates.component.css']
})
export class ItemTemplatesComponent implements OnInit {
  items: Observable<IItem[]>;

  constructor(private _firebaseService: FirebaseService, private _titleService: TitleService,
              public loadingService: LoadingService, public dialog: MatDialog) {
    this._titleService.title.set('Items');
  }

  ngOnInit(): void {
    this.loadingService.isLoading.set(true);
    this.items = this._firebaseService.query('Items').pipe(
      tap((_: any) => this.loadingService.isLoading.set(false))
    );
  }

  openDialog(type: 'Add' | 'Edit', item: IItem = null) {
    this.dialog.open(ItemTemplateDialogComponent, {
      data: {
        type,
        item
      }
    }).afterClosed().subscribe(result => {
      if (result !== 'cancelled') {
        this.items = this._firebaseService.query('Items');
      }
    });
  }

}
