import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ViewerComponent } from './viewer/viewer.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { ViewerModule } from './viewer/viewer.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    MatButtonModule,
    MatIconModule,
    ViewerModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
