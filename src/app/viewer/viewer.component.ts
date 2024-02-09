import { Component, ElementRef, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import * as THREE from "three";
import * as OBC from "openbim-components";

import { StateService } from '../services/state.service';
import { ModelLoaderService } from '../services/model-loader.service';
import { ApiService } from '../services/ifc-api.service';
import { ToolbarButtonService } from '../services/toolbar-button.service';
import { HttpResponse } from '@angular/common/http';

export interface IMappingParams {
  schedule_sheet: string
	mapping_column: string
	task_type_column: string
	target_pset: string
	identity_prop: string
  group_prop: string
}

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
      this.initMappingForm()
    }
  }
  @ViewChild('ifcUpload') ifcUpload!: ElementRef;
  @ViewChild('idsUpload') idsUpload!: ElementRef;
  @ViewChild('scheduleUpload') scheduleUpload!: ElementRef;

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
  public scheduleFile?: File;

  public mainToolbar?: OBC.Toolbar;

  public activeViewerComponents: any = {
    "legend": false,
    "ids": false,
  };

  public legendData: any[] = [
    {
        "text": "Sample",
        "value": "SAMPLE",
        "color": "#ffffff",
    },
  ];

  public colorMap: any = {
    "idsFailed": "#F82C00",
    "idsSuccess": "#007F00"
  };

  public idsResult?: any;
  public scheduleParamsResponse?: any;
  public scheduleMappingParams: IMappingParams = {
    schedule_sheet: "Task_Table1",
    mapping_column: "Mark",
    task_type_column: "Task_Type_(4D)",
    target_pset: "Identity Data",
    identity_prop: "Mark",
    group_prop: "PAA_Group Identification",
  }


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
    this.viewer.scene = sceneComponent;
    sceneComponent.setup();

    // Get scene for further use
    this.scene = sceneComponent.get()
    // this.scene.background = null
    // Add light (already done with setup)
    // const directionalLight = new THREE.DirectionalLight();
    // directionalLight.position.set(5, 10, 3);
    // directionalLight.intensity = 0.5;
    // this.scene.add(directionalLight);

    // const ambientLight = new THREE.AmbientLight();
    // ambientLight.intensity = 0.5;
    // this.scene.add(ambientLight);

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
    // postproduction.customEffects.outlineEnabled = true;

    const grid = new OBC.SimpleGrid(this.viewer, new THREE.Color(0x444444))
    postproduction.customEffects.excludedMeshes.push(grid.get())

    // console.log(this.viewer)


    this.fragmentManager = this._modelLoader.initFragmentManager(this.viewer);
    this.ifcLoader = this._modelLoader.initIfcLoader(this.viewer);

    // Set up highlighter
    this.highlighterComponent = new OBC.FragmentHighlighter(this.viewer)
    this.highlighterComponent.setup()

    // Hider
    // const hider = new OBC.FragmentHider(this.viewer);
    // await hider.loadCached();

    // Set up properties
    const propertiesProcessor = new OBC.IfcPropertiesProcessor(this.viewer)
    this.highlighterComponent.events['select'].onClear.add(() => {
      propertiesProcessor.cleanPropertiesList()
    })

    // Classifier
    this.fragmentClassifier = new OBC.FragmentClassifier(this.viewer);

    this._modelLoader.initiateLoadingProcesses(propertiesProcessor, this.highlighterComponent, this.fragmentClassifier);

    // TOOLBAR
    this.mainToolbar = await this.addToolbar(this.viewer);

    // (Model) Upload
    const modelButton = this._button.uploadModelButton(this.viewer, this.ifcUpload);
    const idsButton = this._button.uploadIDSlButton(this.viewer, this.idsUpload);
    const scheduleButton = this._button.addChildButton(this.viewer, this.scheduleUpload, "Schedule");

    const containerButton = this._button.addContainerButton(this.viewer, "upload", "Upload IFC, IDS, Schedule")
    containerButton.addChild(
      modelButton,
      idsButton,
      scheduleButton
    )

    // Model Overview
    this.mainToolbar.addChild(
      containerButton,
      this.fragmentManager.uiElement.get("main"),
      propertiesProcessor.uiElement.get("main"),
    );

    // Highlight by Class
    this.highlightByClass(this.mainToolbar, this.viewer);

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

    // Make with Observable that only runs if a model is loaded! OR if no models, disable the button!
    if(this.ifcFiles.length == 1) {
      this._button.addProductButton(this.mainToolbar!, this.ifcFiles[0], this.viewer);

      // Test, get intersection of two elements
      // this.getIntersection(this.mainToolbar!, this.viewer);
    }
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

  async loadSchedule(event: any) {

    if (event.target.files.length == 0) {
      console.log("No file selected!");
      return;
    }
    this.scheduleFile = event.target.files[0] as File;
    console.log("schedule loaded!")
    console.log(this.scheduleFile)

    // Open Modal to insert Mapping params
    this.showModal("schedule-mapping-modal")
  }


  getIds(_apiService: any) {
      // console.log("test ids");
      if(!_apiService) return;
      _apiService.testAPI()
        .subscribe((data: any) => {
          console.log(data)
      });
  }

  async visualizeFailedEntities(idList: any[], transparent: boolean = false) {
    // Use three.js to visualize the failed entities in your 3D model
    console.log(idList);

    // Reset 3D scene
    this.highlighterComponent?.clear();

    // Hide original elements
    // const hider = await this.viewer.tools.get(OBC.FragmentHider)
    // hider.set(false)

    // TODO: Only set the onws that meet the requirements to green!
    console.log("highlight everything green!")
    const allItemsFragmentMap = this.getFragmentIdMapOfAllIds();
    if(!this.highlighterComponent?.highlightMats["highlighter_validEntities"]) {
      // let materialPassed = new THREE.MeshStandardMaterial({ color: this.colorMap.idsSuccess, depthTest: false, opacity: 0.1, transparent: true});
      // let materialPassed = new THREE.MeshStandardMaterial({ color: this.colorMap.idsSuccess});
      // console.log(materialPassed)
      let materialPassed = new THREE.MeshStandardMaterial({ color: this.colorMap.idsSuccess});
      if(transparent) {
        // materialPassed.depthTest = false;
        // materialPassed.transparent = true;
        // materialPassed.opacity = 0.3;
      }
      this.highlighterComponent?.add("highlighter_validEntities", [materialPassed])
    }
    this.highlighterComponent?.highlightByID("highlighter_validEntities", allItemsFragmentMap!)


    // Highlight failed entities
    const failedEntitiesFragmentMap = this.getFragmentIdMapOfExpressIds(idList);

    if(failedEntitiesFragmentMap) {
      console.log("highlight failed entities")
      // if highlighter does not yet exist, create it
      if(!this.highlighterComponent?.highlightMats["highlighter_failedEntities"]) {
        console.log("highlight failed entities 2")
        this.highlighterComponent?.add("highlighter_failedEntities", [new THREE.MeshStandardMaterial({ color: this.colorMap.idsFailed})])
      }
      this.highlighterComponent?.highlightByID("highlighter_failedEntities", failedEntitiesFragmentMap)
    } else {
      console.log("No fragmentMap was generated")
    }


    console.log(this.highlighterComponent);
    console.log(this.fragmentManager)

    // Update Legend

    // ADD COUNT
    this.legendData = [
      {
        "text": "failed",
        "value": "failed",
        "color": this.colorMap.idsFailed,
        "count": idList.length,
      },{
        "text": "ok",
        "value": "ok",
        "color": this.colorMap.idsSuccess,
      },
    ];
    this.activeViewerComponents.legend = true;
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
    console.log( this.fragmentManager!)

    // Only one fragmentGroup per ifc-Model??
    const group = this.fragmentManager!.groups[0];

    // Initiate fragmentMap
    const fragmentMap: OBC.FragmentIdMap = {};

    // Loop through all ids and add to fragmentMap
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      console.log(id)
      const data = group.data[id];
      console.log(data)
      let fragmentID: any;
      if (!data) {
        console.log(group);
        console.log("id was not found in fragment group");
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
    uiElement.onClick.add(async () => {
      const fragment = this.fragmentManager;
      console.log(fragment);
      console.log(this.highlighterComponent)

      const entitiesSystem = this.fragmentClassifier!.get()['entities'];
      for(const entity in entitiesSystem) {
        if(!this.highlighterComponent?.highlightMats[entity]) {
          let material = new THREE.MeshStandardMaterial({ color: this.getRandomColor()});

          // let material = new THREE.MeshStandardMaterial({ color: "#FF0000"});
          // let material = new THREE.MeshStandardMaterial({ color: "#FF0000", opacity: 0.5, transparent: true});
          // let material = new THREE.MeshStandardMaterial({ color:"#00ff00" , depthTest: false, opacity: 0.5, transparent: true});
          this.highlighterComponent!.add(entity, [material]);
          // this.highlighterComponent!.outlineEnabled = true;
          // this.highlighterComponent!.outlineMaterial.color.set(0xf0ff7a);
        }
        this.highlighterComponent?.highlightByID(entity, entitiesSystem[entity])
      }
    });
  }

  getIntersection(toolbar: OBC.Toolbar, viewer: OBC.Components) {

    console.log(viewer);
    console.log(this.scene)

    // Clear any previous highlighting
    this.highlighterComponent?.clear();

    // NExt, get any ID list by fragment classifier
    // const entitiesSystem = this.fragmentClassifier!.get()['entities'];

    const idList1: any = [5548];
    const idList2: any = [5498];

    // Highlight failed entities
    const fragmentMap1 = this.getFragmentIdMapOfExpressIds(idList1);
    const fragmentMap2 = this.getFragmentIdMapOfExpressIds(idList2);

    if(fragmentMap1) {
      // if highlighter does not yet exist, create it
      if(!this.highlighterComponent?.highlightMats["highlighter_intersectionSet_1"]) {
        this.highlighterComponent?.add("highlighter_intersectionSet_1", [new THREE.MeshStandardMaterial({ color: this.colorMap.idsSuccess})]);
      }
      this.highlighterComponent?.highlightByID("highlighter_intersectionSet_1", fragmentMap1)

      this.highlighterComponent?.add("highlighter_intersectionSet_2", [new THREE.MeshStandardMaterial({ color: this.colorMap.idsFailed})]);
      this.highlighterComponent?.highlightByID("highlighter_intersectionSet_2", fragmentMap2!)
    } else {
      console.log("No fragmentMap was generated")
    }

    // Get MEshes
    this.fragmentManager?.updateWindow();
    const  fragmentMeshes = viewer.meshes; // Does all fragmentMeshes include the new created mesh??
    const fragmentMesh = fragmentMeshes[0] as any; // Get only one fragment (from 93 in Duplex_A)
    // console.log(viewer.meshes);
    console.log(fragmentMesh)
    const fragmentMesh_Highlighter = fragmentMesh["fragment"]["fragments"]
    console.log(fragmentMesh_Highlighter)
    const fragment_intersection1 = fragmentMesh_Highlighter["highlighter_intersectionSet_1"] // undefined as highlighter selections are first "active" later?!
    console.log(fragment_intersection1)


    const meshList1 = this.highlighterComponent?.components.meshes[0];
    const meshList2 = this.highlighterComponent?.components.meshes[1];

    // Run clash detection
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

  addScheduleParamsCheckButton(viewer: OBC.Components, ifcFile: File, params: IMappingParams, scheduleFile?: File) {
    const uiElement = new OBC.Button(viewer, { name: "Check Mapping" });
    uiElement.tooltip = "Check 4D Params Mapping from Schedule";

    uiElement.onClick.add(() => {
      if(!scheduleFile) {
        alert('Please upload a schedule-file first!');
      } else {
        // Not working with bigger files!
        // Check out .stream() --> https://stackoverflow.com/questions/73442335/how-to-upload-a-large-file-%e2%89%a53gb-to-fastapi-backend
        this._apiService.addScheduleParams(ifcFile, scheduleFile, params)
          .subscribe((response: any) => {
            console.log(response);
            this.scheduleParamsResponse = response; // Text result;
          })
      }
    });

    return uiElement
  }

  addSuffixToFilename(filename: string, suffix: string) {
    const [baseName, extension] = filename.split('.');

    // Check if the filename has an extension
    if (extension) {
      return `${baseName}_${suffix}.${extension}`;
    } else {
      // If the filename has no extension, add the suffix directly
      return `${filename}_${suffix}`;
    }
  }

  addScheduleParamsDownloadButton(viewer: OBC.Components, ifcFile: File, params: IMappingParams, scheduleFile?: File) {
    const uiElement = new OBC.Button(viewer, { name: "Download" });
    uiElement.tooltip = "Download 4D Model";

    const download: string = "True";

    uiElement.onClick.add(() => {
      if(!scheduleFile) {
        alert('Please upload a schedule-file first!');
      } else {

        this._apiService.addScheduleParams(ifcFile, scheduleFile, params, download)
          .subscribe((response: any) => {
            console.log(response);
            const file = response; // File data

            // get fileName
            const newFilename = this.addSuffixToFilename(ifcFile.name, "4D");
            console.log(newFilename)

            // Save the file as a blob
            const blob = new Blob([file], { type: "text/plain" });

            // Create a blob URL and trigger the download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = newFilename;
            a.click();

            // Revoke the blob URL to free up resources
            URL.revokeObjectURL(url);
            });
      }
    });

    return uiElement

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



// Modal

showModal(id: string) {
  const modal = document.getElementById(id)
  if (modal && modal instanceof HTMLDialogElement) {
    modal.showModal()
  } else {
    console.warn("The provided modal wasn't found. ID: ", id)
  }
}

public closeModal(id: string) {
  const modal = document.getElementById(id)
  if (modal && modal instanceof HTMLDialogElement) {
    modal.close()
  } else {
    console.warn("The provided modal wasn't found. ID: ", id)
  }
}

// // This document object is provided by the browser, and its main purpose is to help us interact with the DOM.
// const newProjectBtn = document.getElementById("new-project-btn")
// if (newProjectBtn) {
//   newProjectBtn.addEventListener("click", () => {showModal("new-project-modal")})
// } else {
//   console.warn("New projects button was not found")
// }
initMappingForm() {
  const mappingForm = document.getElementById("schedule-mapping-form")

  if (mappingForm && mappingForm instanceof HTMLFormElement) {
    mappingForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const formData = new FormData(mappingForm)
      const mappingData: IMappingParams = {
        schedule_sheet: formData.get("schedule_sheet") as string,
        mapping_column: formData.get("mapping_column") as string,
        task_type_column: formData.get("task_type_column") as string,
        target_pset: formData.get("target_pset") as string,
        identity_prop: formData.get("identity_prop") as string,
        group_prop: formData.get("group_prop") as string,
      }
      try {
        console.log(mappingData)
        this.scheduleMappingParams = mappingData;
        // Schedule Mapping Process
        const mainToolbar = this.viewer.ui.toolbars[0];
        // console.log(mainToolbar)

        const simCheckButton = this.addScheduleParamsCheckButton(this.viewer, this.ifcFiles[0], this.scheduleMappingParams, this.scheduleFile);
        const simDownloadButton = this.addScheduleParamsDownloadButton(this.viewer, this.ifcFiles[0], this.scheduleMappingParams, this.scheduleFile);

        const containerButton = this._button.addContainerButton(this.viewer, "construction", "Run 4D Mapping")
        containerButton.addChild(
          simCheckButton,
          simDownloadButton
        )
        mainToolbar.addChild(containerButton)

        // mappingForm.reset()
        this.closeModal("schedule-mapping-modal")
      } catch (err) {
        alert(err)
      }
    })


  } else {
    console.warn("The project form was not found. Check the ID!")
  }
}





}

