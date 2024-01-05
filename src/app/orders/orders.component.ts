import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent {
  constructor(private _titleService: TitleService) {
    this._titleService.title.set('Orders');
  }

}
