import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from "three";
import * as OBC from "openbim-components";

import { StateService } from '../services/state.service';
import { ModelLoaderService } from '../services/model-loader.service';
import { ApiService } from '../services/ifc-api.service';
import { ToolbarButtonService } from '../services/toolbar-button.service';

@Component({
  selector: 'viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css']
})
export class ViewerComponent implements OnInit {

  // public viewer = "bim-viewer";
  public canvas?: any;

  @ViewChild('canvas') set content(content: ElementRef) {
    if (content) {
      console.log(content)
      // initially setter gets called with undefined
      this.canvas = content.nativeElement;
      this.initScene(this.canvas);
    }
  }
  @ViewChild('ifcUpload') ifcUpload!: ElementRef;
  @ViewChild('idsUpload') idsUpload!: ElementRef;

  public viewer = new OBC.Components();
  public container?: HTMLElement;
  // public fragments?: OBC.Fragments;
  public scene?: THREE.Scene;
  public ifcLoader?: OBC.FragmentIfcLoader;
  public fragmentManager?: OBC.FragmentManager;

  public rendererComponent?: OBC.PostproductionRenderer;
  public highlighterComponent?: OBC.FragmentHighlighter;
  public fragmentClassifier?: OBC.FragmentClassifier;

  public ifcFile?: File;
  public ifcFiles: File[] = [];
  public idsFile?: File;

  public idsResult?: any;


  constructor(
    private stateService: StateService,
    private _modelLoader: ModelLoaderService,
    private _apiService: ApiService,
    private _button: ToolbarButtonService
  ) {}

  ngOnInit(): void {
    console.log("OnInit")

    // Does not work
    // this.container = document.getElementById('canvas') as HTMLElement;
    // this.initScene(this.container)
  }

  async initScene(canvas: any){
    console.log("initScene")
    // Scene
    const sceneComponent = new OBC.SimpleScene(this.viewer);
    sceneComponent.setup()
    this.viewer.scene = sceneComponent;

    // Renderer
    // const rendererComponent = new OBC.SimpleRenderer(this.viewer, canvas);
    this.rendererComponent = new OBC.PostproductionRenderer(this.viewer, canvas);
    this.viewer.renderer = this.rendererComponent;
    const postproduction = this.rendererComponent.postproduction;
    // this.viewer.renderer = rendererComponent as OBC.SimpleRenderer;

    // Camera
    // this.viewer.camera = new OBC.SimpleCamera(this.viewer);
    const cameraComponent = new OBC.OrthoPerspectiveCamera(this.viewer);
    this.viewer.camera = cameraComponent;
    // cameraComponent.controls.setLookAt(20, 20, 20, 0, 0, 0);

    // Raycaster
    const raycasterComponent = new OBC.SimpleRaycaster(this.viewer) as OBC.SimpleRaycaster;
    this.viewer.raycaster = raycasterComponent;

    this.viewer.init();
    cameraComponent.updateAspect();
    postproduction.enabled = true;

    const grid = new OBC.SimpleGrid(this.viewer, new THREE.Color(0x444444))
    postproduction.customEffects.excludedMeshes.push(grid.get())

    // console.log(this.viewer)

    // Get scene for further use
    this.scene = this.viewer.scene.get() as THREE.Scene;
    // Add light (already done with setup)
    // const directionalLight = new THREE.DirectionalLight();
    // directionalLight.position.set(5, 10, 3);
    // directionalLight.intensity = 0.5;
    // this.scene.add(directionalLight);

    // const ambientLight = new THREE.AmbientLight();
    // ambientLight.intensity = 0.5;
    // this.scene.add(ambientLight);

    this.fragmentManager = this._modelLoader.initFragmentManager(this.viewer);
    this.ifcLoader = this._modelLoader.initIfcLoader(this.viewer);

    // Set up highlighter
    this.highlighterComponent = new OBC.FragmentHighlighter(this.viewer)
    this.highlighterComponent.setup()

    // Set up properties
    const propertiesProcessor = new OBC.IfcPropertiesProcessor(this.viewer)
    this.highlighterComponent.events['select'].onClear.add(() => {
      propertiesProcessor.cleanPropertiesList()
    })

    // Classifier
    this.fragmentClassifier = new OBC.FragmentClassifier(this.viewer);

    this._modelLoader.initiateLoadingProcesses(propertiesProcessor, this.highlighterComponent, this.fragmentClassifier);

    const mainToolbar = await this.addToolbar(this.viewer);

    // (Model) Upload
    this._button.uploadModelButton(mainToolbar, this.viewer, this.ifcUpload);
    this._button.uploadIDSlButton(mainToolbar, this.viewer, this.idsUpload);
    this.highlightByClass(mainToolbar, this.viewer)


    // Model Overview
    mainToolbar.addChild( this.fragmentManager.uiElement.get("main"));

    // IFC Loader
    // mainToolbar.addChild(this.ifcLoader.uiElement.get("main")); // Default openBIMComponents

    // const settings: UiSettings = {
    //   icon: "info",
    //   tooltip: "Info",
    //   clickAction: this.getIds,
    // }
    // const validateButton: UiSettings = {
    //   icon: "check",
    //   tooltip: "Validate Model with IDS",
    //   clickAction: this.validateNodel,
    // }

    // const productButton: UiSettings = {
    //   icon: "category",
    //   tooltip: "Get IFC Products",
    //   clickAction: this.getIfcProducts,
    // }
    // this._button.addCustomUiToToolbar(mainToolbar, validateButton);
    // this.addCustomUiToToolbar(mainToolbar, productButton);

    this._button.addProductButton(mainToolbar, this.ifcFiles[0], this.viewer);

    // Add some elements to the scene
    // this.addRotatingCubes();

  }

  async addToolbar(viewer: OBC.Components) {
    const ifcLoader = await viewer.tools.get(OBC.FragmentIfcLoader)
    const toolbar = new OBC.Toolbar(viewer);
    toolbar.name = "mainToolbar"
    viewer.ui.addToolbar(toolbar);

    // const ifcButton = ifcLoader.uiElement.get("main") as OBC.Button;
    // toolbar.addChild(ifcButton);
    return toolbar
  }

  async loadIfcAsFragments(event: any) {

    const ifcLoader = this._modelLoader.getIfcLoader() as OBC.FragmentIfcLoader;

    if (event.target.files.length == 0) {
      console.log("No file selected!");
      return;
    }
    this.ifcFile = event.target.files[0] as File;
    this.ifcFiles.push(this.ifcFile)

    console.log(this.ifcFiles)

    if (this.ifcFile) {
      const model = await this._modelLoader.loadModelSimple(this.ifcFile, ifcLoader)
      this.scene!.add(model);
    }

    this.fragmentManager!.updateWindow()
    console.log("Model loaded!")
  }


  async loadIds(event: any) {

    if (event.target.files.length == 0) {
      console.log("No file selected!");
      return;
    }
    this.idsFile = event.target.files[0] as File;
    console.log("IDS loaded!")
    console.log(this.idsFile)

    // IDS Validation
    const mainToolbar = this.viewer.ui.toolbars[0];
    console.log(mainToolbar)
    this.addValidateModelButton(mainToolbar, this.viewer, this.ifcFiles[0], this.idsFile);

  }


  getIds(_apiService: any) {
      // console.log("test ids");
      if(!_apiService) return;
      _apiService.testAPI()
        .subscribe((data: any) => {
          console.log(data)
      });
  }

  visualizeFailedEntities(failedEntities: any[]) {
    // Use three.js to visualize the failed entities in your 3D model
    console.log(failedEntities)

    // Reset 3D scene
    this.highlighterComponent?.clear();

    let idList = [];
    for (let i = 0; i < failedEntities.length; i++) {
      let failedEntity = failedEntities[i];
      idList.push(failedEntity.id)
    }

    // TODO: Only set the onws that meet the requirements to green!
    const allItemsFragmentMap = this.getFragmentIdMapOfAllIds();
    if(!this.highlighterComponent?.highlightMats["highlighter_validEntities"]) {
      this.highlighterComponent?.add("highlighter_validEntities", [new THREE.MeshStandardMaterial({ color: "#007F00"})])
    }
    this.highlighterComponent?.highlightByID("highlighter_validEntities", allItemsFragmentMap!)



    // Highlight failed entities
    const failedEntitiesFragmentMap = this.getFragmentIdMapOfExpressIds(idList);

    if(failedEntitiesFragmentMap) {
      // if highlighter does not yet exist, create it
      if(!this.highlighterComponent?.highlightMats["highlighter_failedEntities"]) {
        this.highlighterComponent?.add("highlighter_failedEntities", [new THREE.MeshStandardMaterial({ color: "#F82C00"})])
      }
      this.highlighterComponent?.highlightByID("highlighter_failedEntities", failedEntitiesFragmentMap)
    } else {
      console.log("No fragmentMap was generated")
    }
  }

  hightlightByExpressIds(ids: number[], highlightName: string, hex = "#F82C00") {
    const fragmentMap = this.getFragmentIdMapOfExpressIds(ids)
    console.log(fragmentMap)
    if(fragmentMap) {
      // if highlighter does not yet exist, create a new one
      if(!this.highlighterComponent?.highlightMats[highlightName]) {
        this.highlighterComponent?.add(highlightName, [new THREE.MeshStandardMaterial({ color: hex})])
      }
      this.highlighterComponent?.highlightByID(highlightName, fragmentMap)
    } else {
      console.log("No fragmentMap was generated")
    }

  }

  getFragmentIdMapOfExpressIds(ids: number[]): OBC.FragmentIdMap | undefined {
    console.log( this.fragmentManager!.groups)

    // Only one fragmentGroup per ifc-Model??
    const group = this.fragmentManager!.groups[0];

    // Initiate fragmentMap
    const fragmentMap: OBC.FragmentIdMap = {};

    // Loop through all ids and add to fragmentMap
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const data = group.data[id];
      console.log(data)
      let fragmentID: any;
      if (!data) {
        console.log(group);
        return
      };
      for (const key of data[0]) {
        // get fragmentId of the fragment, the element is a part of
        fragmentID = group.keyFragments[key];
        if(!fragmentMap[fragmentID]) {
          fragmentMap[fragmentID] = new Set();
        }
        fragmentMap[fragmentID].add(String(id))
      }

      // Meshes are in here!
      const fragment = this.fragmentManager!.list[fragmentID!];

    }
    return fragmentMap
  }

  getFragmentIdMapOfAllIds(): OBC.FragmentIdMap | undefined {
    console.log( this.fragmentManager!.groups)

    // Only one fragmentGroup per ifc-Model??
    const group = this.fragmentManager!.groups[0];
    const fragments = group.items;

    // Initiate fragmentMap
    const fragmentMap: OBC.FragmentIdMap = {};

    for (let i = 0; i < fragments.length; i++) {
      const fragment = fragments[i];
      const fragmentID = fragment.id;
      const ids = fragment.items;
      if(!fragmentMap[fragmentID]) {
        fragmentMap[fragmentID] = new Set();
      }
      ids.forEach(id => fragmentMap[fragmentID].add(id))

    }
    return fragmentMap
  }


  highlightByClass(toolbar: OBC.Toolbar, viewer: OBC.Components) {

    // Clear any previous highlighting
    // this.highlighterComponent?.clear();

    const uiElement = new OBC.Button(viewer);
    uiElement.materialIcon = "visibility";
    uiElement.tooltip = "Highlight by class";

    toolbar.addChild(uiElement);
    uiElement.onClick.add(() => {
      const fragment = this.fragmentManager;
      console.log(fragment);
      console.log(this.highlighterComponent)

      const entitiesSystem = this.fragmentClassifier!.get()['entities'];
      for(const entity in entitiesSystem) {
        if(!this.highlighterComponent?.highlightMats[entity]) {
          this.highlighterComponent?.add(entity, [new THREE.MeshStandardMaterial({ color: this.getRandomColor()})]);
        }
        this.highlighterComponent?.highlightByID(entity, entitiesSystem[entity])
      }
    });
  }

  getRandomColor() {
    const hexColors = [
      "#FF5733",
      "#8A2BE2",
      "#1E90FF",
      "#FFD700",
      "#32CD32",
      "#FF69B4",
      "#00BFFF",
      "#FFA500",
      "#2E8B57",
      "#8B008B",
    ]
    const randomIndex = Math.floor(
      Math.random() * (hexColors.length - 0) + 0
    )
    return hexColors[randomIndex]
  }


  // getIfcProducts(_apiService: any, _modelLoader:any) {
  //   if(!_apiService) return;

  //   const ifcLoader = this._modelLoader.getIfcLoader();
  //   console.log(ifcLoader)
  //   console.log(this.ifcFiles)
  //   const ifcFile = this.ifcFiles[0];

  //   _apiService.getIfcProducts(ifcFile)
  //     .subscribe((data: any) => {
  //       console.log(data)
  //   });
  // }

  addValidateModelButton(toolbar: OBC.Toolbar, viewer: OBC.Components, ifcFile: File, idsFile?: File) {
    const uiElement = new OBC.Button(viewer);
    uiElement.materialIcon = "verified";
    uiElement.tooltip = "Validate Model with IDS";

    toolbar.addChild(uiElement);
    uiElement.onClick.add(() => {
      if(!idsFile) {
        alert('Please upload an IDS-file first!');
        return undefined
      } else {

        return this._apiService.validateModel(ifcFile, idsFile)
          .subscribe((data: any) => {
            console.log(data);
            this.idsResult = data;
        });
      }
    });

  }


  rotateCubes(mesh: THREE.Mesh, x: number, y: number, z: number) {
    mesh.rotation.x += x;
    mesh.rotation.y += y;
    mesh.rotation.z += z;
  }


  addRotatingCubes() {
    const boxMaterial = new THREE.MeshStandardMaterial({ color: '#00ffff' });
    const cubeMaterial = new THREE.MeshStandardMaterial({color: '#6528D7'});
    const greenMaterial = new THREE.MeshStandardMaterial({color: '#BCF124'});
    const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
    const cube1 = new THREE.Mesh(boxGeometry, boxMaterial);
    const cube2 = new THREE.Mesh(boxGeometry, cubeMaterial);
    const cube3 = new THREE.Mesh(boxGeometry, cubeMaterial);

    this.scene!.add(cube1, cube2, cube3);
    this.viewer.meshes.push(cube1, cube2, cube3);
    const cubes = [cube1, cube2, cube3];

    cube2.position.x = 5;
    cube3.position.x = -5;

    const oneDegree = Math.PI / 180;
    function rotateCubes() {
    cube1.rotation.x += oneDegree;
    cube1.rotation.y += oneDegree;
    cube2.rotation.x += oneDegree;
    cube2.rotation.z += oneDegree;
    cube3.rotation.y += oneDegree;
    cube3.rotation.z += oneDegree;
    }
    this.rendererComponent!.onBeforeUpdate.add(rotateCubes);
    // not working --> this.viewer.renderer.onBeforeUpdate
    // const rend = this.viewer.renderer as OBC.SimpleRenderer
    // rend.onBeforeUpdate

    let previousSelection: any;
    window.onmousemove = () => {
    const result = this.viewer.raycaster.castRay(cubes);
    // console.log(result)
    if (previousSelection) {
      previousSelection.material = cubeMaterial;
    }
    if (!result) {
      return;
    }
    const object = result.object as THREE.Mesh;
    object.material = greenMaterial;
    previousSelection = object;
    }
  }

}
