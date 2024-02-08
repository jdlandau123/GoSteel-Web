import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TitleService } from '../services/title.service';
import { FirebaseService } from '../services/firebase.service';
import { LoadingService } from '../services/loading.service';
import { Observable, BehaviorSubject, startWith, map } from 'rxjs';
import { ICustomer } from '../interfaces';
import { MaterialModule } from '../material.module';
import { orderBy } from 'firebase/firestore';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  customers: BehaviorSubject<ICustomer[]> = new BehaviorSubject<ICustomer[]>([]);
  tableColumns = ['firstName', 'lastName', 'companyName'];
  search = new FormControl<string>('');
  filteredCustomers: Observable<ICustomer[]>;
  tableDatasource: MatTableDataSource<ICustomer>;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private _titleService: TitleService, private _firebaseService: FirebaseService,
              public loadingService: LoadingService) {
    this._titleService.title.set('Customers');
    this.tableDatasource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.loadingService.isLoading.set(true);
    this._firebaseService.query<ICustomer>('Customers', null, orderBy('lastName')).subscribe((customers: ICustomer[]) => {
      this.customers.next(customers);
      this.search.setValue('');
      this.loadingService.isLoading.set(false);
    });

    this.filteredCustomers = this.search.valueChanges.pipe(
      startWith(''),
      map((text: string) => text.toString().toLowerCase()),
      map((searchText: string) => this.customers.value.filter((c: ICustomer) => {
        return c?.firstName?.toLowerCase().includes(searchText)
          || c?.lastName?.toLowerCase().includes(searchText)
          || c?.companyName?.toLowerCase().includes(searchText)
      }))
    );

    this.filteredCustomers.subscribe(customers => this.tableDatasource.data = customers);
  }

  ngAfterViewInit(): void {
    this.tableDatasource.paginator = this.paginator;
  }

}
