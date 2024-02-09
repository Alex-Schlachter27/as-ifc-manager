import { Injectable } from "@angular/core";

import * as THREE from "three";
import * as OBC from "openbim-components";
import {
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree
} from 'three-mesh-bvh';
import { BehaviorSubject, filter, from, map, Observable } from "rxjs";
import { GlobalIdMatch, IDMap, ModelFileType } from "../viewer/models";
import { StateService } from "./state.service";
import { FragmentsGroup } from "bim-fragment";
import { IFCImportService } from "./ifc-import.service";

export interface LoadingStatus {
  fileLoad: number,
  fileProcessing: number,
  result?: FragmentsGroup
}

const IFCSPACE = 3856911033;
const IFCOPENINGELEMENT = 3588315303;

@Injectable({
    providedIn: 'root'
})
export class ModelLoaderService {

    public models: FragmentsGroup[] = [];
    public ifcLoader?: OBC.FragmentIfcLoader;
    public fragmentManager?: OBC.FragmentManager;

    public globalCoordinationMatrix?: number[]; //Matrix4;

    public modelsLoaded$ = new BehaviorSubject<number>(0);

    private expressToGlobalId: any[] = []; // Object that maintains idMap between expressID and GlobalId for all loaded models (modelID = index in array)
    private globalToExpressId: any[] = []; // Object that maintains idMap between expressID and GlobalId for all loaded models (modelID = index in array)

    constructor(
        private _ifcLoader: IFCImportService,
        // private _gltfLoader: GlTFImportService
        private stateService: StateService,
    ) { }

    initIfcLoader(viewer: OBC.Components) {
      this.ifcLoader = new OBC.FragmentIfcLoader(viewer);

      // this.ifcLoader.settings.wasm = {
      //   path: "https://unpkg.com/web-ifc@0.0.43/",
      //   absolute: true
      // };
      this.ifcLoader.settings.wasm = {
        path: "assets/ifcjs/",
        absolute: true
      };

      this.ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
      this.ifcLoader.settings.webIfc.OPTIMIZE_PROFILES = true;

      return this.ifcLoader
    }

    initFragmentManager(viewer: OBC.Components){
      this.fragmentManager = new OBC.FragmentManager(viewer);
      return this.fragmentManager
    }


    public getIfcLoader(){
      return this.ifcLoader;
    }

    public initiateLoadingProcesses(propertiesProcessor: OBC.IfcPropertiesProcessor, highlighterComponent: OBC.FragmentHighlighter, fragmentClassifier: OBC.FragmentClassifier) {
      // Move to main page again!
      if(!this.ifcLoader) return;
      if(!this.fragmentManager) return;

      this.ifcLoader.onIfcLoaded.add(model => {
        console.log(model)
        this.stateService.setModelCount(this.fragmentManager!.groups.length);

        highlighterComponent.update()
        highlighterComponent.outlineEnabled = true;

        try {
          // fragmentClassifier.byStorey(model)
          fragmentClassifier.byEntity(model)
          // // const tree = await createModelTree()
          // await classificationsWindow.slots.content.dispose(true)
          // classificationsWindow.addChild(tree)

          propertiesProcessor.process(model)
          highlighterComponent.events["select"].onHighlight.add((fragmentMap) => {
            // const fragmentID = Object.keys(selection)[0]
            // const expressID = Number([...selection[fragmentID]][0])
            const expressID = [...Object.values(fragmentMap)[0]][0]
            propertiesProcessor.renderProperties(model, Number(expressID))
          })
        } catch (error) {
          alert(error)
        }
      })
    }

    public getGlobalIdFromMap(modelID: number, expressID: number){
        let globalID;
        if(this.expressToGlobalId[modelID]) {
            globalID = this.expressToGlobalId[modelID][expressID]
        }

        return globalID;
    }

    async loadModelSimple(file: File, ifcLoader: OBC.FragmentIfcLoader) {

      const modelID: number = this.models.length;

      let model: FragmentsGroup;

      const data = await file.arrayBuffer();
      const buffer = new Uint8Array(data);
      model = await ifcLoader.load(buffer, file.name);

      // Add to array of models
      this.models.push(model);

      return model
  }

    // loadModelWithProgress(file: File, fileType: ModelFileType = ModelFileType.IFC, expressIdToGlobalIdMap?: any): Observable<LoadingStatus> {

    //     const modelID: number = this.models.length;

    //     // Start behavior subjects to track progress
    //     const fileLoading$ = new BehaviorSubject<LoadingStatus>({ fileLoad: 0, fileProcessing: 0 });

    //     if(fileType == ModelFileType.IFC){
    //         this._ifcLoader.loadModel(file, this.ifcLoader, fileLoading$, this.models);
    //     }

    //     let model: any;
    //     fileLoading$.subscribe({
    //         next: (status) => {
    //             if(status.result) model = status.result;
    //         },
    //         complete: async () => {

    //             // Apply first model matrix as global matrix, to later on move the elements again to the original coordinates (IFC only)
    //             if(this.models.length == 0 && fileType == ModelFileType.IFC) {
    //                 this.globalCoordinationMatrix = await this.ifc.ifcAPI.GetCoordinationMatrix(model.modelID);
    //                 await this.setCoordinationMatrixFromFirst(0);
    //             }

    //             // Add to array of models
    //             this.models.push(model);

    //             // Build id map if the model is an IFC
    //             if(fileType == ModelFileType.IFC){
    //                 await this.getIDMaps(this.models.length-1);
    //             }

    //             this.modelsLoaded$.next(this.models.length);

    //         }
    //     })

    //     // Return observable that tracks the upload progress
    //     return fileLoading$.asObservable();

    // }

    // public getModelsLoaded(): Observable<number>{
    //     return this.modelsLoaded$.asObservable().pipe(
    //         filter((no: number) => no > 0)
    //     );
    // }

    public getModels() {
        return this.models;
    }

    // async setCoordinationMatrixFromFirst(modelID: number) {
    //     const matrixArr = await this.ifc.ifcAPI.GetCoordinationMatrix(modelID);
    //     const matrix = new Matrix4().fromArray(matrixArr) as any;
    //     this.ifc.setupCoordinationMatrix(matrix);
    // }

    public getAllIdsInModel(modelID: number = 0): number[]{
        const model = this.models[modelID];
        // const arr: number[] = Array.from(model.children.geometry.attributes["expressID"].array);
        // return [...new Set(arr)];
        return [1]
    }

    // Builds map between expressID and globalID and returns existing one if it already exists
    // public async getIDMaps(modelID: number = 0): Promise<IDMap>{

    //     if(this.expressToGlobalId[modelID] == undefined){
    //         console.time("Built expressID to GlobalId map");

    //         let expressGlobal: any = {};
    //         let globalExpress: any = {};

    //         // Get all ids in model
    //         const expressIDs = this.getAllIdsInModel(modelID);

    //         // Get all properties in parallel (tested and twice as fast as waiting individually)
    //         let promises = [];
    //         for (let i = 0; i < expressIDs.length; i++) {
    //             promises.push(this.ifc.getItemProperties(modelID, expressIDs[i], false));
    //         }

    //         // Once all properties arrived, get GlobalId and append to map
    //         const properties = await Promise.all(promises);
    //         for (let i = 0; i < expressIDs.length; i++) {
    //             const globalId = properties[i].GlobalId.value;
    //             expressGlobal[expressIDs[i]] = globalId;
    //             globalExpress[globalId] = expressIDs[i];
    //         }

    //         this.expressToGlobalId[modelID] = expressGlobal;
    //         this.globalToExpressId[modelID] = globalExpress;

    //         console.timeEnd("Built expressID to GlobalId map");
    //     }

    //     return {
    //         expressToGlobalId: this.expressToGlobalId[modelID],
    //         globalToExpressId: this.globalToExpressId[modelID]
    //     };
    // }

    // public async globalIdsToExpressIDs(globalIds: string[]): Promise<GlobalIdMatch[]>{

    //     // Make copy of globalIds array
    //     const ids = JSON.parse(JSON.stringify(globalIds));

    //     let arr = [];
    //     // Loop over models
    //     for (let modelID = 0; modelID < this.models.length; modelID++) {

    //         // Get idMaps for model
    //         const idMaps = await this.getIDMaps(modelID);

    //         // Find expressIDs that match the provided globalIDs
    //         let expressIDs = [];

    //         // Loop over globalIds in model
    //         const modelGlobalIds = Object.keys(idMaps.globalToExpressId);
    //         for (let i = 0; i < modelGlobalIds.length; i++) {
    //             const investigatedGlobalId = modelGlobalIds[i];

    //             // If there is a match in the globalIds array, add the corresponding expressID to the list and remove globalId from list og globalIds
    //             const idx = ids.indexOf(investigatedGlobalId);
    //             if(idx != -1){
    //                 if(expressIDs.indexOf(investigatedGlobalId) == -1){
    //                     expressIDs.push(idMaps.globalToExpressId[investigatedGlobalId]);
    //                     ids.splice(idx, 1);
    //                 }
    //             }
    //         }

    //         // Add matches to result array
    //         if(expressIDs.length){
    //             arr.push({modelID, expressIDs});
    //         }

    //     }

    //     if(ids.length){
    //         console.log("Unmatched globalIDs: " + ids.join(", "));
    //     }

    //     return arr;

    // }

    // async getGlobalId(elementID: number, modelID: number = 0): Promise<string>{

    //     // First check if it exists in id maps
    //     const idMaps = await this.getIDMaps(modelID);

    //     if(idMaps && idMaps.expressToGlobalId){
    //         const globalId = idMaps.expressToGlobalId[elementID];
    //         if(globalId && globalId != undefined) return globalId;
    //     }

    //     const properties = await this.ifc.getItemProperties(modelID, elementID);
    //     return properties.GlobalId.value;
    // }

    // private swapExpressIdToGlobalIdMap(json: any){
    //     var ret: any = {};
    //     for(var key in json){
    //       ret[json[key]] = parseInt(key);
    //     }
    //     return ret;
    // }

}
