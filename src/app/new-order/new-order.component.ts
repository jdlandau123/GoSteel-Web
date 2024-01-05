import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.css']
})
export class NewOrderComponent {
  constructor(private _titleService: TitleService) {
    this._titleService.title.set('New Order');
  }
}
