import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IItemTemplate } from '../interfaces';

export interface IPanel {
  panelNumber: number;
  numPackages: BehaviorSubject<number>;
  packages: IItemTemplate[];
}

@Injectable({
  providedIn: 'root'
})
export class NewOrderService {
  panels: IPanel[] = [];

  constructor() {
    this.addPanel();
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

}
