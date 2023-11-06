import { Component, ViewChild } from '@angular/core';
import * as THREE from "three";
import * as OBC from "openbim-components";
import { ModelLoaderService } from './services/model-loader.service';
import { ViewerComponent } from './viewer/viewer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public title = 'PAA IFC Manager';

  @ViewChild(ViewerComponent) ViewerComponentViewChild!: ViewerComponent;
  public scene?: THREE.Scene;

  constructor(
    private _modelLoader: ModelLoaderService,
  ) { }

  ngAfterViewInit() {
    this.scene = this.ViewerComponentViewChild.scene;
  }

  ngOnInit(): void {
    // this.container = this.canvas!.nativeElement as HTMLElement;

    // this.container = document.getElementById('canvas') as HTMLElement;
    // this.components.scene = new OBC.SimpleScene(this.components);;
    // this.components.renderer = new OBC.SimpleRenderer(this.components, this.container);
    // // this.components.camera = new OBC.SimpleCamera(this.components);
    // const camera = new OBC.OrthoPerspectiveCamera(this.components);
    // this.components.camera = camera;
    // camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
    // this.components.raycaster = new OBC.SimpleRaycaster(this.components) as OBC.SimpleRaycaster;

    // this.components.init();

    // // Add some elements to the scene
    // this.scene = this.components.scene.get() as THREE.Scene;
    // // this.components.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);

    // const grid = new OBC.SimpleGrid(this.components);
    // const boxMaterial = new THREE.MeshStandardMaterial({ color: '#6528D7' });
    // const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
    // const cube = new THREE.Mesh(boxGeometry, boxMaterial);
    // cube.position.set(0, 1.5, 0);
    // this.scene.add(cube);
    // this.components.meshes.push(cube);

    // // Add light
    // const directionalLight = new THREE.DirectionalLight();
    // directionalLight.position.set(5, 10, 3);
    // directionalLight.intensity = 0.5;
    // this.scene.add(directionalLight);

    // const ambientLight = new THREE.AmbientLight();
    // ambientLight.intensity = 0.5;
    // this.scene.add(ambientLight);

  }

  async loadIfcAsFragments(event: any) {
    if(!this.scene) return;
    const ifcLoader = this._modelLoader.getIfcLoader() as OBC.FragmentIfcLoader;

    if (event.target.files.length == 0) {
      console.log("No file selected!");
      return;
    }
    let file: File = event.target.files[0];

    if (file) {
      const model = await this._modelLoader.loadModelSimple(file, ifcLoader)
      this.scene!.add(model);
      console.log("MODEL LOADED INTO SCENE")
    }
  }
}
