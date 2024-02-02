import { Injectable } from '@angular/core';
// import { BufferAttribute, Material, Mesh, Scene, Vector3 } from 'three';
import * as THREE from "three";
import { CSG } from 'three-csg-ts';
// import { SubsetConfig } from 'web-ifc-three/IFC/BaseDefinitions';
// import { IFCManager } from 'web-ifc-three/IFC/components/IFCManager';
// import { IFCModel } from 'web-ifc-three/IFC/components/IFCModel';
import { IfcGeometryService } from './ifc-geometry.service';
import { ThreeJsService } from './three.service';
import { IntersectionResults } from './models';

@Injectable({
  providedIn: 'root'
})
export class ClashDetectionService {

  public loadedSubsets: string[] = [];            // List of customIDs of subsets that are loaded in the scene
  public loadedSubsetMaterials: THREE.Material[] = [];  // List of materials of subsets that are loaded in the scene
  public loadedSubsetExpressIDs: any[] = [];      // List of expressIDs of subsets that are loaded in the scene

  constructor(
    private _3s: ThreeJsService,
    private _gos: IfcGeometryService,
  ) {  }


//   public extractMeshOfElements(ifcManager: IFCManager, scene: THREE.Scene, modelID: number, expressIDs: number[], name: string): Promise<THREE.Mesh>{

//     return new Promise((resolve, reject) => {

//       // If subset already exists, use existing!
//       // let subsetExists = false;
//       // let foundSubset;
//       // const subsets = ifcManager.subsets["subsets"];
//       // !environment.production && console.log(subsets);

//       // if(subsets && Object.keys(subsets).length > 0) {
//       //   for(let key of Object.keys(subsets)) {
//       //     let subset = subsets[key];
//       //     let ids = Array.from(subset.ids.values())
//       //     console.log(ids)
//       //     if(ids.includes(name))
//       //       subsetExists = true;
//       //       foundSubset = subset;
//       //   }
//       // }
//       // !environment.production && console.log(subsetExists);

//       // if(subsetExists) {
//       //   resolve(foundSubset.mesh);
//       // } else {
//         // Create new subset if not already exists
//         const config: SubsetConfig = {
//           scene,
//           modelID,
//           ids: expressIDs,
//           removePrevious: true,
//           customID: name
//         }

//         // Create subset to extract geometry
//         const subset = ifcManager.createSubset(config);
//         // console.log(subset)
//         const mesh = subset.clone();
//         mesh.name = name;

//         this._3s.cleanMesh(mesh);
//         this._3s.removeUnusedMaterials(mesh);

//         resolve(mesh);
//       // }
//     });

// }


  // async getIntersecting(ifcManager: IFCManager, scene: Scene, elementsToCheck: ClashDetectionInput, targetElements: ClashDetectionInput, checkIndividualElements: boolean = true, addSplitElementGeoemtries:boolean = true, addElementGeoemtries: boolean = false, addTargetGeometries: boolean = false): Promise<IntersectionResults>{

  //   // Get timing
  //   const timeBefore = Date.now();

  //   const elementIDs = elementsToCheck.elementIDs;
  //   const modelID = elementsToCheck.modelID;
  //   // console.log(model, elementIDs, modelID)

  //   const targetModelID = targetElements.modelID;
  //   const targetIDs = targetElements.elementIDs;
  //   // console.log(targetModelID, targetIDs)


  //   // RESULTS
  //   let all = [];
  //   let single = [];
  //   let multiple = [];
  //   let intersectionCount = 0;

  //   if(checkIndividualElements == true) {
  //     // First create target geometries and put them in an array to loop over later
  //     let targetArray = [];
  //     // Loop over each target, get geometry as subset and save in locArray
  //     for (let i = 0; i < targetIDs.length; i++) {
  //       let targetID = targetIDs[i];
  //       // console.log([targetID, ifcManager, scene, modelID])
  //       // Create new subset for each element with id = target id
  //       // const mesh = await this.extractMeshOfElements(ifcManager, scene, targetModelID, [parseInt(targetID)], targetID);
  //       const mesh = await this._gos.extractMeshOfElements(ifcManager, scene, targetModelID, [parseInt(targetID)], targetID);
  //       // console.log(mesh)

  //       targetArray.push(mesh)

  //     }

  //     // GET INTERSECTIONS
  //     // Loop over each element and get geometry as subset
  //     for (let j = 0; j < elementIDs.length; j++) {
  //       let elID = elementIDs[j];
  //       // console.log([elID, ifcManager, scene, modelID])
  //       // Create element Geometry from IFC by express ID
  //       // const elSubset = await this.extractMeshOfElements(ifcManager, scene, modelID, [parseInt(elID)], elID);
  //       const elSubset = await this._gos.extractMeshOfElements(ifcManager, scene, modelID, [parseInt(elID)], elID);

  //       // console.log(targetArray, elSubset)
  //       // !environment.production && console.log(elSubset)
  //       elSubset.geometry.computeBoundingBox();
  //       // !environment.production && console.log(elSubset)

  //       // Get volume
  //       const elementVolume = this._3s.getVolume(elSubset.geometry);

  //       // Initialize intersection result object
  //       let elObject: any = {"expressID": elID, modelID, elementVolume, "interfaces": []}
  //       if( addElementGeoemtries == true) elObject["geometry"] = elSubset;

  //       // INTERSECTION
  //       // Then loop over each target geometry and find intersections
  //       for (let i = 0; i < targetArray.length; i++) {
  //         let targetSubset = targetArray[i];

  //       // !environment.production && console.log(targetSubset)

  //       // Get volume
  //       const targetVolume = this._3s.getVolume(targetSubset.geometry);


  //         // GET INTERSECTION if it exists
  //         let splitElementGeometry = this.getIntersectingGeometry(elSubset, targetSubset);

  //         if (splitElementGeometry && splitElementGeometry != undefined) {
  //           // !environment.production && console.log(splitElementGeometry)

  //           // add intersection to count
  //           intersectionCount++;

  //           const intersectingVolume = this._3s.getVolume(splitElementGeometry.geometry);

  //           // set relation of express IDs // As express Ids are unique for each element, they can later be used to get the globalID
  //           const splitGeoID = elSubset.name + "_" + targetSubset.name;
  //           splitElementGeometry.name = splitGeoID;

  //           // Add info to element object
  //           const splitObject: any = {"expressID": splitGeoID, "volume": intersectingVolume, "targetID": targetSubset.name, targetModelID, targetVolume}
  //           if( addSplitElementGeoemtries == true) splitObject["geometry"] = splitElementGeometry;
  //           if( addTargetGeometries == true) splitObject["targetGeometry"] = targetSubset;
  //           elObject.interfaces.push(splitObject)

  //         } else {
  //           // console.log("No intersection with target")
  //           continue;
  //         }
  //       };

  //       // Sort interfaces by biggest volume --> biggest first!
  //       elObject.interfaces.sort((a: any, b: any) => (a.volume > b.volume) ? -1 : 1)

  //       // append to result, usable for further action
  //       all.push(elObject)

  //       if(elObject.interfaces.length > 1) {
  //         multiple.push(elObject)
  //       } else {
  //         single.push(elObject)
  //       }
  //     };

  //   } else {

  //     // !environment.production && console.log("combine geometries to one subset")
  //     // combine all elements of each groups into a SINGLE subset
  //     const targetIDsInt = targetIDs.map((id:any) => parseInt(id));
  //     const elementIDsInt = elementIDs.map((id:any) => parseInt(id));
  //     const targetSubset = await this.extractMeshOfElements(ifcManager, scene, targetModelID, targetIDsInt, "targetSubset");
  //     const elSubset = await this.extractMeshOfElements(ifcManager, scene, modelID, elementIDsInt, "elementSubset");

  //     // !environment.production && console.log(elSubset, targetSubset)
  //     // Initialize intersection result object
  //     let elObject: any = {"expressID": elementIDs, "interfaces": ""}
  //     if( addElementGeoemtries == true) elObject["geometry"] = elSubset;
  //     if( addTargetGeometries == true) elObject["targetGeometry"] = targetSubset;


  //     // GET INTERSECTION if it exists
  //     let splitElementGeometry = this.getIntersectingGeometry(elSubset, targetSubset);

  //     if (splitElementGeometry && splitElementGeometry != undefined) {
  //       // !environment.production && console.log(splitElementGeometry)

  //       // add intersection to count
  //       intersectionCount++;

  //       const intersectingVolume = this._3s.getVolume(splitElementGeometry.geometry);

  //       // set relation of express IDs // As express Ids are unique for each element, they can later be used to get the globalID
  //       const splitGeoID = elSubset.name + "_" + targetSubset.name;
  //       splitElementGeometry.name = splitGeoID;

  //       // Add info to element object
  //       const splitObject: any = {"expressID": splitGeoID, "volume": intersectingVolume, "targetID": targetIDs}
  //       if( addSplitElementGeoemtries == true) splitObject["geometry"] = splitElementGeometry;
  //       elObject.interfaces = [splitObject];

  //       all.push(elObject);
  //       // !environment.production && console.log(elObject)

  //       if(elObject.interfaces.length > 1) {
  //         multiple.push(elObject)
  //       } else {
  //         single.push(elObject)
  //       }

  //     } else {
  //       // console.log("No intersection with target")
  //     }
  //   }
  //   const timeAfter = Date.now();
  //   console.log(`Found ${intersectionCount} clashes in ${(timeAfter - timeBefore)/1000} s`)

  //   return { all, intersectionCount, single, multiple }
  // }

  private getIntersectingGeometry(meshA: THREE.Mesh, meshB: THREE.Mesh) {
    const intRes = CSG.intersect(meshA, meshB);
    // !environment.production && console.log(intRes)

    // Logic to find out is meshes are intersecting (all elements that do not intersect with the current location)
    // for now: is position count = 0!
    // Find more robust solution later on!!
    if (intRes["geometry"]["attributes"] != undefined) {

      // counts all vertices of a geometry! if 0 --> no geometry
      if (intRes["geometry"]["attributes"]["position"]["count"] > 0) {
        // console.log(intRes)
        return intRes;
      } else {return undefined}
    } else {return undefined}
  }

}
