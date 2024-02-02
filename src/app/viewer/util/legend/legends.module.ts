import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ColorScaleLegendComponent } from './color-scale-legend.component';
import { ColorLegendComponent } from './color-legend/color-legend.component';
import { ColorLegendRoundComponent } from './color-legend-round.component';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// import { ColorPickerModule } from 'ngx-color-picker';
import { CircleComponent } from './color-legend/circle.component';
import { SquareComponent } from './color-legend/square.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    // ColorPickerModule
  ],
  declarations: [
    ColorScaleLegendComponent,
    ColorLegendComponent,
    ColorLegendRoundComponent,
    SquareComponent,
    CircleComponent
  ],
  exports: [
    ColorScaleLegendComponent,
    ColorLegendComponent,
    ColorLegendRoundComponent
  ],
  providers: [ ]
})
export class LegendsModule { }
