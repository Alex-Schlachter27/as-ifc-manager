import { Injectable } from "@angular/core";

import * as THREE from "three";
import * as OBC from "openbim-components";
import {
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree
} from 'three-mesh-bvh';
import { BehaviorSubject, filter, from, map, Observable } from "rxjs";
import { GlobalIdMatch, IDMap, ModelFileType } from "./models";
// import { IFCImportService } from "./import-export/ifc-import.service";
// import { GlTFImportService } from "./import-export/gltf-import.service";

export interface LoadingStatus {
    fileLoad: number,
    fileProcessing: number,
    result?: IFCModel
}

const IFCSPACE = 3856911033;
const IFCOPENINGELEMENT = 3588315303;

@Injectable({
    providedIn: 'root'
})
export class ModelLoaderService {

    // public models: IFCModel[] = [];
    public ifcLoader = new OBC.FragmentIfcLoader(viewer)
    public ifc = this.ifcLoader.ifcManager;

    public globalCoordinationMatrix?: number[]; //Matrix4;

    public modelsLoaded$ = new BehaviorSubject<number>(0);

    private expressToGlobalId: any[] = []; // Object that maintains idMap between expressID and GlobalId for all loaded models (modelID = index in array)
    private globalToExpressId: any[] = []; // Object that maintains idMap between expressID and GlobalId for all loaded models (modelID = index in array)

    constructor(
        private _ifcLoader: IFCImportService,
        private _gltfLoader: GlTFImportService
    ) {

        this.ifc.setWasmPath('assets/ifcjs/');


        // Sets up optimized picking
        this.ifc.setupThreeMeshBVH(
            computeBoundsTree,
            disposeBoundsTree,
            acceleratedRaycast
        );

        const settings: LoaderSettings = {
            COORDINATE_TO_ORIGIN: true,
            USE_FAST_BOOLS: true
        }

        this.ifc.parser.setupOptionalCategories({
            [IFCSPACE]: true,
            [IFCOPENINGELEMENT]: false
        })

        this.ifc.applyWebIfcConfig(settings);
    }

    public useWebWorkers(use: boolean, ifcJSDir: string = "assets/ifcjs/"){
        if(use){
            this.ifc.useWebWorkers(true, ifcJSDir + "IFCWorker.js");
            this.ifc.setWasmPath('./');
        }else{
            this.ifc.useWebWorkers(false, ifcJSDir);
            this.ifc.setWasmPath(ifcJSDir);
        }
    }

    public getIFCManager(){
        return this.ifc;
    }

    public getGlobalIdFromMap(modelID: number, expressID: number){
        let globalID;
        if(this.expressToGlobalId[modelID]) {
            globalID = this.expressToGlobalId[modelID][expressID]
        }

        return globalID;
    }

    loadModel(file: File, fileType: ModelFileType = ModelFileType.IFC, expressIdToGlobalIdMap?: any): Observable<LoadingStatus> {

        const modelID: number = this.models.length;

        // Start behavior subjects to track progress
        const fileLoading$ = new BehaviorSubject<LoadingStatus>({ fileLoad: 0, fileProcessing: 0 });

        if(fileType == ModelFileType.IFC){
            this._ifcLoader.loadModel(file, this.ifcLoader, fileLoading$, this.models);
        }

        else if(fileType == ModelFileType.glTF){
            this._gltfLoader.loadModel(this.ifcLoader.ifcManager, file, fileLoading$, modelID);
            if(expressIdToGlobalIdMap != undefined){
                // Set id maps
                this.expressToGlobalId[modelID] = expressIdToGlobalIdMap;
                this.globalToExpressId[modelID] = this.swapExpressIdToGlobalIdMap(expressIdToGlobalIdMap);
            }
        }

        let model: any;
        fileLoading$.subscribe({
            next: (status) => {
                if(status.result) model = status.result;
            },
            complete: async () => {

                // Apply first model matrix as global matrix, to later on move the elements again to the original coordinates (IFC only)
                if(this.models.length == 0 && fileType == ModelFileType.IFC) {
                    this.globalCoordinationMatrix = await this.ifc.ifcAPI.GetCoordinationMatrix(model.modelID);
                    await this.setCoordinationMatrixFromFirst(0);
                }

                // Add to array of models
                this.models.push(model);

                // Build id map if the model is an IFC
                if(fileType == ModelFileType.IFC){
                    await this.getIDMaps(this.models.length-1);
                }

                this.modelsLoaded$.next(this.models.length);

            }
        })

        // Return observable that tracks the upload progress
        return fileLoading$.asObservable();

    }

    public getModelsLoaded(): Observable<number>{
        return this.modelsLoaded$.asObservable().pipe(
            filter((no: number) => no > 0)
        );
    }

    public getModels() {
        return this.models;
    }

    async setCoordinationMatrixFromFirst(modelID: number) {
        const matrixArr = await this.ifc.ifcAPI.GetCoordinationMatrix(modelID);
        const matrix = new Matrix4().fromArray(matrixArr) as any;
        this.ifc.setupCoordinationMatrix(matrix);
    }

    public getAllIdsInModel(modelID: number = 0): number[]{
        const model = this.models[modelID];
        const arr: number[] = Array.from(model.geometry.attributes["expressID"].array);
        return [...new Set(arr)];
    }

    // Builds map between expressID and globalID and returns existing one if it already exists
    public async getIDMaps(modelID: number = 0): Promise<IDMap>{

        if(this.expressToGlobalId[modelID] == undefined){
            console.time("Built expressID to GlobalId map");

            let expressGlobal: any = {};
            let globalExpress: any = {};

            // Get all ids in model
            const expressIDs = this.getAllIdsInModel(modelID);

            // Get all properties in parallel (tested and twice as fast as waiting individually)
            let promises = [];
            for (let i = 0; i < expressIDs.length; i++) {
                promises.push(this.ifc.getItemProperties(modelID, expressIDs[i], false));
            }

            // Once all properties arrived, get GlobalId and append to map
            const properties = await Promise.all(promises);
            for (let i = 0; i < expressIDs.length; i++) {
                const globalId = properties[i].GlobalId.value;
                expressGlobal[expressIDs[i]] = globalId;
                globalExpress[globalId] = expressIDs[i];
            }

            this.expressToGlobalId[modelID] = expressGlobal;
            this.globalToExpressId[modelID] = globalExpress;

            console.timeEnd("Built expressID to GlobalId map");
        }

        return {
            expressToGlobalId: this.expressToGlobalId[modelID],
            globalToExpressId: this.globalToExpressId[modelID]
        };
    }

    public async globalIdsToExpressIDs(globalIds: string[]): Promise<GlobalIdMatch[]>{

        // Make copy of globalIds array
        const ids = JSON.parse(JSON.stringify(globalIds));

        let arr = [];
        // Loop over models
        for (let modelID = 0; modelID < this.models.length; modelID++) {

            // Get idMaps for model
            const idMaps = await this.getIDMaps(modelID);

            // Find expressIDs that match the provided globalIDs
            let expressIDs = [];

            // Loop over globalIds in model
            const modelGlobalIds = Object.keys(idMaps.globalToExpressId);
            for (let i = 0; i < modelGlobalIds.length; i++) {
                const investigatedGlobalId = modelGlobalIds[i];

                // If there is a match in the globalIds array, add the corresponding expressID to the list and remove globalId from list og globalIds
                const idx = ids.indexOf(investigatedGlobalId);
                if(idx != -1){
                    if(expressIDs.indexOf(investigatedGlobalId) == -1){
                        expressIDs.push(idMaps.globalToExpressId[investigatedGlobalId]);
                        ids.splice(idx, 1);
                    }
                }
            }

            // Add matches to result array
            if(expressIDs.length){
                arr.push({modelID, expressIDs});
            }

        }

        if(ids.length){
            console.log("Unmatched globalIDs: " + ids.join(", "));
        }

        return arr;

    }

    async getGlobalId(elementID: number, modelID: number = 0): Promise<string>{

        // First check if it exists in id maps
        const idMaps = await this.getIDMaps(modelID);

        if(idMaps && idMaps.expressToGlobalId){
            const globalId = idMaps.expressToGlobalId[elementID];
            if(globalId && globalId != undefined) return globalId;
        }

        const properties = await this.ifc.getItemProperties(modelID, elementID);
        return properties.GlobalId.value;
    }

    private swapExpressIdToGlobalIdMap(json: any){
        var ret: any = {};
        for(var key in json){
          ret[json[key]] = parseInt(key);
        }
        return ret;
    }

}
