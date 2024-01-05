import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { FirebaseService } from '../services/firebase.service';
import { TitleService } from '../services/title.service';
import { IItemTemplate } from '../interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-item-templates',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
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

  constructor(private _firebaseService: FirebaseService, private _titleService: TitleService) {
    this._titleService.title.set('Item Templates');
  }

  ngOnInit(): void {
    // this.itemTemplates = this._firebaseService.query('ItemTemplates');
  }

}
