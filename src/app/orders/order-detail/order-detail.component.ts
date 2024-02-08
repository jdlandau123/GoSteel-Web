import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MaterialModule } from '../../material.module';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { TitleService } from '../../services/title.service';
import { IAddress, ICustomer, IItemTemplate, IOrder, IOrderPanel, IShow } from '../../interfaces';
import { BehaviorSubject, Observable, filter, map, startWith, tap } from 'rxjs';
import { SelectItemDialogComponent } from '../select-item-dialog/select-item-dialog.component';
import { FirebaseService } from '../../services/firebase.service';
import { LoadingService } from '../../services/loading.service';
import { where, orderBy } from 'firebase/firestore';
import { UpdateShowDialogComponent } from '../../update-show-dialog/update-show-dialog.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeleteConfirmationDialogComponent } from '../../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { InvoiceService} from '../../services/invoice.service';

export interface IPanel {
  id?: string;
  panelNumber: number;
  numPackages: BehaviorSubject<number>;
  packages: IItemTemplate[];
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  @Input() id: string;

  isNewOrder = false;
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
  orderForm = new FormGroup({
    standColor: new FormControl<string>(null),
    dateCreated: new FormControl<Date>(new Date()),
    datePaid: new FormControl<Date>(null),
    dateShipped: new FormControl<Date>(null),
    totalPrice: new FormControl<number>(0, Validators.required),
    notes: new FormControl<string>(null),
    hasInvoice: new FormControl<boolean>(false)
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
  panels: IPanel[] = [];
  currentShow: BehaviorSubject<IShow> = new BehaviorSubject<IShow>(null);
  billingAddressSameAsShipping = false;
  usStateNames = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
    'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
    'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];
  standColors = [
    'black', 'wood'
  ];
  customers: BehaviorSubject<ICustomer[]> = new BehaviorSubject<ICustomer[]>([]);
  filteredCustomers: Observable<ICustomer[]>;
  customerSearch = new FormControl<string>('');
  isDesktop = false;
  invoiceService: InvoiceService

  constructor(private _titleService: TitleService, private _firebaseService: FirebaseService,
              public dialog: MatDialog, private _router: Router, public loadingService: LoadingService,
              private _snackbar: MatSnackBar, private _route: ActivatedRoute) {
    this.invoiceService = new InvoiceService(this._firebaseService);
  }

  async ngOnInit() {
    this.isDesktop = window.innerWidth > 1000;

    this._route.paramMap.pipe(
      map((params: ParamMap) => params.get('id')),
      tap((id: string) => {
        if (id === 'new') {
          this._titleService.title.set('New Order');
          this.isNewOrder = true;
          this.resetOrderPanels();
          for (let form of [this.orderForm, this.customerForm, this.billingAddressForm, this.shippingAddressForm]) {
            form.reset();
          }
          this.orderForm.patchValue({dateCreated: new Date(), hasInvoice: false});
          this.shippingAddressForm.controls.type.setValue('shipping');
          this.billingAddressForm.controls.type.setValue('billing');
        } else {
          this._titleService.title.set('Review Order');
          this.isNewOrder = false;
        }
      })
    ).subscribe();

    if (this.id === 'new') {
      this._firebaseService.query<IShow>('Shows', null, orderBy('startDate', 'desc')).subscribe((shows: IShow[]) => {
        this.currentShow.next(shows[0]);
      });
      this._firebaseService.query<ICustomer>('Customers').subscribe(customers => this.customers.next(customers));
    } else {
      this.loadingService.isLoading.set(true);
      const order = await this._firebaseService.getItem('Orders', this.id);
      order['datePaid'] = order['datePaid']?.toDate();
      order['dateShipped'] = order['dateShipped']?.toDate();
      this.orderForm.patchValue(order);
      const show = await this._firebaseService.getItem('Shows', order['showId']);
      this.currentShow.next(show as IShow);
      this._firebaseService.query<IOrderPanel>('OrderPanels', where('orderId', '==', this.id)).subscribe((orderPanels: IOrderPanel[]) => {
        for (let i=0; i<orderPanels.length; i++) {
          const p: IPanel = {
            id: orderPanels[i].id,
            panelNumber: i + 1,
            numPackages: new BehaviorSubject(orderPanels[i]?.packages?.length),
            packages: orderPanels[i].packages
          };
          this.panels.push(p);
        }
        this.loadingService.isLoading.set(false);
      });
    }

    this.filteredCustomers = this.customerSearch.valueChanges.pipe(
      startWith(''),
      map((input: string) => input.toString().toLowerCase()),
      map((searchText: string) => this.customers.value.filter((c: ICustomer) => {
        return c?.firstName?.toLowerCase()?.includes(searchText) || c?.lastName?.toLowerCase()?.includes(searchText)
          || c?.email?.toLowerCase()?.includes(searchText) || c?.phone?.includes(searchText)
          || c?.workPhone?.includes(searchText) || c?.companyName?.includes(searchText);
      }))
    );
  }

  autocompleteDisplayFn(customer: ICustomer): string {
    return customer ? `${customer?.firstName} ${customer?.lastName}` : '';
  }

  setFormDisabled(form: FormGroup, disable: boolean) {
    if (disable) {
      Object.keys(form.controls).forEach((controlName: string) => {
        form.get(controlName).disable();
      });
    } else {
      Object.keys(form.controls).forEach((controlName: string) => {
        form.get(controlName).enable();
      });
    }
  }

  onAutocompleteSelect(event: any) {
    this.customerForm.patchValue(event.option.value);
    this.setFormDisabled(this.customerForm, true);
    const addressWhere = where('customerId', '==', event.option.value.id);
    this._firebaseService.query<IAddress>('Addresses', addressWhere).subscribe((addresses: IAddress[]) => {
      for (let address of addresses) {
        if (address.type === 'shipping' && !this.shippingAddressForm.value.streetAddress) {
          this.shippingAddressForm.patchValue(address);
          this.setFormDisabled(this.shippingAddressForm, true);
        }
        if (address.type === 'billing' && !this.billingAddressForm.value.streetAddress) {
          this.billingAddressForm.patchValue(address);
          this.setFormDisabled(this.billingAddressForm, true);
        }
      }
    });
  }

  clearAutocomplete(inputEl: any) {
    this.customerSearch.setValue('');
    this.customerForm.reset();
    this.setFormDisabled(this.customerForm, false);
    inputEl.options.forEach((o: any) => o.deselect());
    this.setFormDisabled(this.shippingAddressForm, false);
    this.setFormDisabled(this.billingAddressForm, false);
    this.shippingAddressForm.reset();
    this.billingAddressForm.reset();
  }

  openShowDialog() {
    this.dialog.open(UpdateShowDialogComponent).afterClosed().pipe(
      filter(r => r !== null)
    ).subscribe(newShow => this.currentShow.next(newShow));
  }

  handleBillingAddressCheckbox(event: MatCheckboxChange) {
    this.billingAddressSameAsShipping = event.checked;
    if (event.checked) {
      this.billingAddressForm.patchValue(this.shippingAddressForm.value);
      this.setFormDisabled(this.billingAddressForm, true);
    } else {
      this.billingAddressForm.reset();
      this.setFormDisabled(this.billingAddressForm, false);
    }
  }

  addPanel() {
    const pNum = this.panels.length === 0 ? 1 : Math.max(...this.panels.map((p: any) => p.panelNumber)) + 1;
    const p = {
      panelNumber: pNum,
      numPackages: new BehaviorSubject<number>(1),
      packages: Array(1)
    };
    p.numPackages.subscribe(num => p.packages = Array(num));
    this.panels.push(p);
  }

  resetOrderPanels() {
    this.panels = [];
    this.addPanel();
  }

  setPackageHeight(panel: IPanel): string {
    const baseHeight = this.isDesktop ? 600 : 300;
    return panel.numPackages.value === 1 ? `${baseHeight}px` :  `${baseHeight/2}px`;
  }

  numPackagesChange(event: MatButtonToggleChange, panel: IPanel) {
    panel.numPackages.next(Number(event.value))
  }

  setPackage(packageIndex: number, panel: IPanel) {
    this.dialog.open(SelectItemDialogComponent, {
      data: { panel, packageIndex }
    }).afterClosed().subscribe((selectedItem: IItemTemplate) => {
      panel.packages[packageIndex] = selectedItem;
    });
  }

  isPanelFull(panel: IPanel): boolean {
    return panel.packages.some(p => p === null);
  }

  deletePanel(panel: IPanel) {
    const panelsFiltered = this.panels.filter(p => p !== panel);
    panelsFiltered.forEach((p, i) => {
      p.panelNumber = i + 1;
    })
    this.panels = panelsFiltered;
  }

  deleteOrder() {
    this.dialog.open(DeleteConfirmationDialogComponent, {
      data: {
        itemType: 'Order'
      }
    }).afterClosed().pipe(
      filter(r => r)
    ).subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this._firebaseService.deleteItem('Orders', this.id);
        this._firebaseService.query<IOrderPanel>('OrderPanels', where('orderId', '==', this.id)).subscribe(panels => {
          panels.forEach(panel => {
            this._firebaseService.deleteItem('OrderPanels', panel.id);
          })
        })
        this._router.navigateByUrl('/orders');
      }
    });
  }

  calculateOrderTotal(): number {
    let total = 0;
    this.panels.forEach(panel => {
      panel.packages.forEach(p => {
        const unitCount = panel.numPackages.value === 1 ? 144 : 72;
        const pVal = p.item.pricePerUnit * unitCount;
        total += pVal;
      })
    })
    return total;
  }

  async save() {
    this.loadingService.isLoading.set(true);
    if (this.id && !this.isNewOrder) {
      this.orderForm.patchValue({ totalPrice: this.calculateOrderTotal() });
      if (!this.orderForm.value.datePaid) this.orderForm.controls.datePaid.setValue(null);
      if (!this.orderForm.value.dateShipped) this.orderForm.controls.dateShipped.setValue(null);
      await this._firebaseService.updateItem('Orders', this.id, this.orderForm.value);
      this.panels.forEach(panel => {
        panel.packages.map(p => p.unitCount = panel.numPackages.value === 1 ? 144 : 72);
        const panelObj = {
          orderId: this.id,
          packages: panel.packages
        }
        this._firebaseService.updateItem('OrderPanels', panel.id, panelObj);
      })
      this.loadingService.isLoading.set(false);
      this._router.navigateByUrl('/orders');
      return;
    }
    let customerId = this.customerForm.value.id;
    try {
      if (!this.customerForm.value.id) { // only existing customers will have an id
        delete this.customerForm.value.id;
        const customer = await this._firebaseService.createItem('Customers', this.customerForm.value);
        customerId = customer.id;
      }
      if (!this.shippingAddressForm.value.id && this.shippingAddressForm.value.streetAddress) {
        delete this.shippingAddressForm.value.id;
        await this._firebaseService.createItem('Addresses', {
          customerId: customerId,
          ...this.shippingAddressForm.value
        });
      }
      if (!this.billingAddressForm.value.id && this.billingAddressForm.value.streetAddress) {
        delete this.billingAddressForm.value.id;
        await this._firebaseService.createItem('Addresses', {
          customerId: customerId,
          ...this.billingAddressForm.value
        });
      }
      this.orderForm.patchValue({totalPrice: this.calculateOrderTotal(), hasInvoice: false});
      const createdOrder = await this._firebaseService.createItem('Orders', {
        showId: this.currentShow.value.id,
        customerId: customerId,
        ...this.orderForm.value
      });
      this.panels.forEach(panel => {
        panel.packages.map(p => p.unitCount = panel.numPackages.value === 1 ? 144 : 72);
        const panelObj = {
          orderId: createdOrder.id,
          packages: panel.packages
        }
        this._firebaseService.createItem('OrderPanels', panelObj);
      })
      this.loadingService.isLoading.set(false);
      this._router.navigateByUrl('/orders');
    } catch (error) {
      console.log(error);
      this._snackbar.open('Error saving order, please try again later');
    }
  }

  createInvoice() {
    this.invoiceService.createInvoice(this.id);
    this.orderForm.controls.hasInvoice.setValue(true);
  }

  downloadInvoice() {
    this._firebaseService.getInvoice(this.id);
  }

}
