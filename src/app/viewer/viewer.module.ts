import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewerComponent } from './viewer.component';
import { ValidationComponent } from './validation/validation.component';


import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {MatExpansionModule} from '@angular/material/expansion';



@NgModule({
  declarations: [
    ViewerComponent,
    ValidationComponent
  ],
  imports: [
    CommonModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
  ],
  exports: [
    ViewerComponent
  ],
})
export class ViewerModule { }
