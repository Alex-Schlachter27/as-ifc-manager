import { ElementRef, Injectable } from '@angular/core';
import { ModelLoaderService } from './model-loader.service';
import { ApiService } from './ifc-api.service';

import * as THREE from "three";
import * as OBC from "openbim-components";
import { Observable } from 'rxjs';



export interface UiSettings {
  icon: string,
  tooltip: string,
  ui?: OBC.Button,
  clickAction?: any,
}

@Injectable({
    providedIn: 'root'
})
export class ToolbarButtonService {

    constructor(
      private _modelLoader: ModelLoaderService,
      private _apiService: ApiService
    ){

    }

    addCustomUiToToolbar(toolbar: OBC.Toolbar, settings: UiSettings, viewer: OBC.Components) {
      const uiElement = new OBC.Button(viewer);
      uiElement.materialIcon = settings.icon;
      uiElement.tooltip = settings.tooltip;

      toolbar.addChild(uiElement);
      uiElement.onClick.add(() => {
        if(settings.clickAction) {
          settings.clickAction(this._apiService);
        } else {
          alert('I\'ve been clicked!');
        }
      });

    }

    uploadModelButton(toolbar: OBC.Toolbar, viewer: OBC.Components, ifcUploadInput: ElementRef) {
      const uiElement = new OBC.Button(viewer);
      uiElement.materialIcon = "upload";
      uiElement.tooltip = "Upload Model (own)";

      toolbar.addChild(uiElement);
      uiElement.onClick.add(() => {
        ifcUploadInput.nativeElement.click();
      });
    }

    uploadIDSlButton(toolbar: OBC.Toolbar, viewer: OBC.Components, idsUploadInput: ElementRef) {
      const uiElement = new OBC.Button(viewer);
      uiElement.materialIcon = "upload";
      uiElement.tooltip = "Upload IDS";

      toolbar.addChild(uiElement);
      uiElement.onClick.add(() => {
        idsUploadInput.nativeElement.click();
      });
    }

    addProductButton(toolbar: OBC.Toolbar, ifcFile: File, viewer: OBC.Components) {
      const uiElement = new OBC.Button(viewer);
      uiElement.materialIcon = "category";
      uiElement.tooltip = "Get IFC Products";

      toolbar.addChild(uiElement);
      uiElement.onClick.add(() => {

        this._apiService.getIfcProducts(ifcFile)
          .subscribe((data: any) => {
            console.log(data)
        });
      });
    }
}
