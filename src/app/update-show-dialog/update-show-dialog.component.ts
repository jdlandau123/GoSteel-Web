import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-update-show-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './update-show-dialog.component.html',
  styleUrls: ['./update-show-dialog.component.css']
})
export class UpdateShowDialogComponent {
  showForm = new FormGroup({
    name: new FormControl<string>(null, Validators.required),
    startDate: new FormControl<Date>(new Date(), Validators.required)
  });

  constructor(public dialogRef: MatDialogRef<UpdateShowDialogComponent>,
              private _firebaseService: FirebaseService) { }

  async save() {
    await this._firebaseService.createItem('Shows', this.showForm.value);
    this.dialogRef.close(this.showForm.value);
  }
}
