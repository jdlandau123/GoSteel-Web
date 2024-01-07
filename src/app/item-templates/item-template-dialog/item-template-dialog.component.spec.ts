import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemTemplateDialogComponent } from './item-template-dialog.component';

describe('ItemTemplateDialogComponent', () => {
  let component: ItemTemplateDialogComponent;
  let fixture: ComponentFixture<ItemTemplateDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ItemTemplateDialogComponent]
    });
    fixture = TestBed.createComponent(ItemTemplateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
