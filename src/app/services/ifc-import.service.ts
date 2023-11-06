import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import * as OBC from "openbim-components";
import { LoadingStatus } from './model-loader.service';

@Injectable({providedIn: 'root'})
export class IFCImportService {

    constructor() { }

    // loadModel(file: File, ifcLoader: OBC.FragmentIfcLoader, fileLoading$: BehaviorSubject<LoadingStatus>, modelsArray: any[]): void{

    // }


    // loadModel(file: File, ifcLoader: OBC.FragmentIfcLoader, fileLoading$: BehaviorSubject<LoadingStatus>, modelsArray: any[]): void{

    //     const fileURL = URL.createObjectURL(file);

    //     let fileLoad = 0;
    //     let fileProcessing = 0;

    //     ifcLoader.load()
    //     ifcLoader.(event => {
    //         const fileProcessing = Math.floor((event.loaded * 100) / event.total);
    //         console.log("Processed " + fileProcessing + " %");
    //         fileLoading$.next({ fileLoad, fileProcessing });
    //     });

    //     // Apply origin to first model
    //     from(ifcLoader.ifcManager.applyWebIfcConfig({
    //         COORDINATE_TO_ORIGIN: modelsArray.length == 0,
    //         USE_FAST_BOOLS: true
    //       })).subscribe(() => {

    //         // Start loading the model
    //         from(ifcLoader.loadAsync(fileURL, (xhr) => {
    //             let percentage = (xhr.loaded / xhr.total) * 100;
    //             fileLoad = Math.floor(percentage * 100) / 100;
    //             console.log("Loaded " + fileLoad + " %");
    //             fileLoading$.next({ fileLoad, fileProcessing });
    //         })).subscribe(async (model: any) => {

    //             // set model name
    //             model.name = file.name;

    //             // Update progress to finsihed
    //             fileLoading$.next({ fileLoad: 100, fileProcessing: 100, result: model });
    //             console.log("Processed 100 %");

    //             fileLoading$.complete();

    //         }, err => fileLoading$.error(err));;

    //     })


    // }

}
