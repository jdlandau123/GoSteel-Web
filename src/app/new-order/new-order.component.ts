import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../services/title.service';
import { IItemTemplate } from '../interfaces';
import { BehaviorSubject } from 'rxjs';
import { SelectItemDialogComponent } from './select-item-dialog/select-item-dialog.component';
import { FirebaseService } from '../services/firebase.service';

interface IPanel {
  panelNumber: number;
  numPackages: BehaviorSubject<number>;
  packages: IItemTemplate[];
}

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.css']
})
export class NewOrderComponent implements OnInit {
  orderForm = new FormGroup({
    firstName: new FormControl<string>(null),
    lastName: new FormControl<string>(null),
    email: new FormControl(null, Validators.email),
    phone: new FormControl(null, Validators.pattern('[- +()0-9]{7,}')),
  })
  panels: IPanel[] = [];
  itemTemplates: BehaviorSubject<IItemTemplate[]> = new BehaviorSubject<IItemTemplate[]>([]);

  constructor(private _titleService: TitleService, private _firebaseService: FirebaseService, public dialog: MatDialog) {
    this._titleService.title.set('New Order');
    this.addPanel();
  }

  ngOnInit(): void {
    this._firebaseService.query<IItemTemplate>('ItemTemplates').subscribe((i: IItemTemplate[]) => {
      this.itemTemplates.next(i)
    });
  }

  addPanel() {
    const pNum = this.panels.length === 0 ? 1 : Math.max(...this.panels.map((p: any) => p.panelNumber)) + 1;
    const p = {
      panelNumber: pNum,
      numPackages: new BehaviorSubject<number>(24),
      packages: Array(24)
    };
    p.numPackages.subscribe(num => p.packages = Array(num));
    this.panels.push(p);
  }

  resetOrderPanels() {
    this.panels = [];
    this.addPanel();
  }

  numPackagesChange(event: MatButtonToggleChange, panel: IPanel) {
    panel.numPackages.next(Number(event.value))
  }

  setPackage(packageIndex: number, panel: IPanel) {
    this.dialog.open(SelectItemDialogComponent, {
      width: '500px',
      data: {
        itemTemplates: this.itemTemplates.value
      }
    }).afterClosed().subscribe((selectedItem: IItemTemplate) => {
      panel.packages[packageIndex] = selectedItem;
    });
  }

  deletePanel(panel: IPanel) {
    const panelsFiltered = this.panels.filter(p => p !== panel);
    panelsFiltered.forEach((p, i) => {
      p.panelNumber = i + 1;
    })
    this.panels = panelsFiltered;
  }

  save() {
    console.log('save clicked');
    this.resetOrderPanels();
  }

}
