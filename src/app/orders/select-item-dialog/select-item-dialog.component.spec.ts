import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectItemDialogComponent } from './select-item-dialog.component';

describe('SelectItemDialogComponent', () => {
  let component: SelectItemDialogComponent;
  let fixture: ComponentFixture<SelectItemDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SelectItemDialogComponent]
    });
    fixture = TestBed.createComponent(SelectItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
