import { identifierModuleUrl } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { Mesh, Scene } from 'three';
import { SubsetConfig } from 'web-ifc-three/IFC/BaseDefinitions';
import { IFCManager } from 'web-ifc-three/IFC/components/IFCManager';
import { IFCModel } from 'web-ifc-three/IFC/components/IFCModel';
import { ThreeJsService } from './three.service';

@Injectable({
  providedIn: 'root'
})
export class IfcGeometryService {
  
  constructor(    
    private _3s: ThreeJsService,
  ) {  }

  // create new Subset of id
  public createNewSubSet(ifcManager: IFCManager, model: IFCModel, modelID: number = 0, id: number, removePrevious: boolean = true) {
    console.log(id)

    // Creates subset
    let subset: Mesh = ifcManager.createSubset({
    modelID: modelID,
    ids: [id],
    scene: model,
    removePrevious: true
    })
    console.log(subset)
    subset = subset.clone()
    // Check if mesh! subset is defined as void | Mesh<any, Material | Material[]>
    if (subset instanceof Mesh) {

      console.log(id.toString())
        // set express ID as name
        subset.name = id.toString();

        return subset
    } else {return undefined}
  }

  // Create new subset for a group of elements
  public extractMeshOfElements(ifcManager: IFCManager, scene: Scene, modelID: number, expressIDs: number[], name: string): Promise<Mesh>{

    return new Promise((resolve, reject) => {

        const config: SubsetConfig = {
          scene,
          modelID,
          ids: expressIDs,
          removePrevious: true,
          customID: name
        }

        // console.log([ifcManager, scene, modelID, expressIDs, name])

        // Create subset to extract geometry
        const subset = ifcManager.createSubset(config);
        const mesh = subset.clone();
        mesh.name = name;

        this._3s.cleanMesh(mesh);
        this._3s.removeUnusedMaterials(mesh);

        resolve(mesh);
    });

}


  // Basically a missing feature from https://github.com/IFCjs/web-ifc-three/blob/main/web-ifc-three/src/IFC/components/subsets/SubsetManager.ts
  public removeAllSubsets(ifcManager: IFCManager){
      
    const subsets = ifcManager.subsets["subsets"];

    if(subsets == undefined) return;

    Object.keys(subsets).forEach(key => {

        // Skip default --> In clash-detection, remove all!
        // if(key.indexOf("DEFAULT") != -1) return;

        // Get subset
        const subset = subsets[key];

        // Remove it
        if (subset.mesh.parent) subset.mesh.removeFromParent();
        subset.mesh.geometry.attributes = {};
        subset.mesh.geometry.index = null;
        subset.mesh.geometry.dispose();
        // @ts-ignore
        subset.mesh.geometry = null;
        delete ifcManager.subsets["subsets"][key];
    })
  }

  public async getVolume(id: string, ifcManager: IFCManager, modelID: number = 0) {
    // get all property sets and their values (also of referenced elements)
    const pSets = await this.getPropertySets(parseInt(id), ifcManager, modelID, true)
    // console.log(pSets)
    // To DO: find out a smoother way to only get the properties of the desired pSet and not of all
    /*e.g.
    console.log(dimensions)
    console.log(dimensions.expressID)
    const dimensionsRec = await ifcManager.getItemProperties(dimensions.expressID, modelID, true) --> results in error!
    console.log(dimensionsRec)
    */

    const dimensions = pSets.filter((pSet:any) => pSet.Name.value == "Dimensions")[0];
    if (dimensions == undefined) {
      console.log("the element has no propertyset 'Dimensions'");
      return undefined;
    } else {
      const volumeProp = dimensions.HasProperties.filter((prop:any) => prop.Name.value == "Volume")[0];
      if (volumeProp == undefined) {
        console.log("the element has no property 'Volume'");
        return undefined;
      } else {
        // console.log(volumeProp)
        const volumeValue = volumeProp.NominalValue.value
        // console.log(volumeValue)
        return volumeValue
      }
    }
    
  }

  private async getPropertySets(expressID: number, ifcManager: IFCManager, modelID: number = 0, recursive: boolean = false) {
    const propertySets: any = await ifcManager.getPropertySets(modelID, expressID, recursive);
    return propertySets;
}

}


  
  
