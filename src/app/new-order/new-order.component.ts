import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { TitleService } from '../services/title.service';
import { NewOrderService, IPanel } from '../services/new-order.service';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { BehaviorSubject } from 'rxjs';

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
export class NewOrderComponent {
  orderForm = new FormGroup({
    firstName: new FormControl<string>(null),
    lastName: new FormControl<string>(null),
    email: new FormControl(null, Validators.email),
    phone: new FormControl(null, Validators.pattern('[- +()0-9]{7,}')),
  })

  constructor(private _titleService: TitleService, public newOrderService: NewOrderService) {
    this._titleService.title.set('New Order');
  }

  numPackagesChange(event: MatButtonToggleChange, panel: IPanel) {
    panel.numPackages.next(Number(event.value))
  }

  setPackage(packageIndex: number, panel: IPanel) {
    panel.packages[packageIndex] = {
      id: null,
      category: 'Category 1',
      pricePerUnit: 1,
      unitCount: 20,
      hooks: 0,
      color: 'black',
      description: 'test'
    }
  }

  save() {
    console.log('save clicked');
    this.newOrderService.resetOrderPanels();
  }

}
