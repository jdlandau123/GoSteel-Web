import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../../material.module';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { TitleService } from '../../services/title.service';
import { FirebaseService } from '../../services/firebase.service';
import { LoadingService } from '../../services/loading.service';
import { IAddress, ICustomer, IOrder } from '../../interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import { where } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css']
})
export class CustomerDetailComponent implements OnInit {
  @Input() id: string;
  customer: BehaviorSubject<ICustomer> = new BehaviorSubject<ICustomer>(null);
  customerForm = new FormGroup({
    id: new FormControl<string>(null),
    firstName: new FormControl<string>(null),
    lastName: new FormControl<string>(null),
    email: new FormControl<string>(null, Validators.email),
    phone: new FormControl<string>(null, Validators.pattern('[- +()0-9]{7,}')),
    workPhone: new FormControl<string>(null, Validators.pattern('[- +()0-9]{7,}')),
    companyName: new FormControl<string>(null),
    businessType: new FormControl<string>(null)
  });
  shippingAddressForm = new FormGroup({
    id: new FormControl<string>(null),
    streetAddress: new FormControl<string>(null),
    city: new FormControl<string>(null),
    state: new FormControl<string>(null),
    zip: new FormControl<number>(null),
    type: new FormControl<string>('shipping')
  });
  billingAddressForm = new FormGroup({
    id: new FormControl<string>(null),
    streetAddress: new FormControl<string>(null),
    city: new FormControl<string>(null),
    state: new FormControl<string>(null),
    zip: new FormControl<number>(null),
    type: new FormControl<string>('billing')
  });
  orders: Observable<IOrder[]>;
  addresses: BehaviorSubject<IAddress[]> = new BehaviorSubject<IAddress[]>([]);
  usStateNames = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
    'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
    'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  constructor(private _titleService: TitleService, private _firebaseService: FirebaseService,
              public loadingService: LoadingService, private _snackBar: MatSnackBar) {
    this._titleService.title.set('Customer Details');
  }

  async ngOnInit() {
    const customer: ICustomer = await this._firebaseService.getItem('Customers', this.id) as ICustomer;
    this.customer.next(customer);
    this.customer.subscribe((customer: ICustomer) => {
      this.customerForm.patchValue({id: this.id, ...customer});
    });
    const queryWhere = where('customerId', '==', this.id);
    this._firebaseService.query<IAddress>('Addresses', queryWhere).subscribe((addresses: IAddress[]) => {
      this.addresses.next(addresses);
    });
    this.orders = this._firebaseService.query<IOrder>('Orders', queryWhere);
    this.addresses.subscribe((addresses: IAddress[]) => {
      for (let address of addresses) {
        if (address.type === 'shipping') this.shippingAddressForm.patchValue(address);
        if (address.type === 'billing') this.billingAddressForm.patchValue(address);
      }
    });
  }

  async updateAddress(addressType: 'shipping' | 'billing') {
    let form: FormGroup;
    let msg: string;
    if (addressType === 'shipping') {
      form = this.shippingAddressForm;
      msg = 'Shipping Address Updated';
    } else if (addressType === 'billing') {
      form = this.billingAddressForm;
      msg = 'Billing Address Updated';
    }

    if (form.value.id) {
      await this._firebaseService.updateItem('Addresses', form.value.id, form.value);
      // const newAddress: IAddress = await this._firebaseService.getItem('Addresses', this.id) as IAddress;
      // const addressesFiltered = this.addresses.value.filter((a: IAddress) => a.type !== 'shipping');
      // this.addresses.next([newAddress, ...addressesFiltered]);
    } else {
      const obj = {customerId: this.id, ...form.value}
      await this._firebaseService.createItem('Addresses', obj);
    }
    this._snackBar.open(msg);
  }

  async saveForm(formSource: 'customer' | 'shipping' | 'billing') {
    if (formSource === 'customer') {
      await this._firebaseService.updateItem('Customers', this.customerForm.value.id, this.customerForm.value);
      // const customer: ICustomer = await this._firebaseService.getItem('Customers', this.id) as ICustomer;
      // this.customer.next(customer);
      this._snackBar.open('Customer Updated');
    } else {
      this.updateAddress(formSource);
    }
  }

}
