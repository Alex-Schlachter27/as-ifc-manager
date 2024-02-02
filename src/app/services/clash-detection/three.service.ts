import { Injectable } from '@angular/core';
import { BufferGeometry, Mesh, Quaternion, Group, Matrix4, Object3D, Vector3, Line3, Points, PointsMaterial, Plane, Raycaster, LineSegments, BufferAttribute, LineBasicMaterial, Line, Triangle, BoxBufferGeometry, MeshBasicMaterial, Material } from 'three';
import { OBB } from 'three/examples/jsm/math/OBB';
import * as THREE from "three";
import * as YUKA from "yuka";
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';


@Injectable({
    providedIn: 'root'
})
export class ThreeJsService {

    public raycaster = new Raycaster();

    public a = new Vector3();
    public b = new Vector3();
    public c = new Vector3();
    public planePointA = new Vector3();
    public planePointB = new Vector3();
    public planePointC = new Vector3();
    public lineAB = new Line3();
    public lineBC = new Line3();
    public lineCA = new Line3();
    public tolerance = 0.001;
    
    public pointOfIntersection = new Vector3();

    // geometry
    public pointsOfIntersection = new BufferGeometry();


    constructor(
    ) { }

    public getVolume(geometry: any) {
      // Crdits: https://discourse.threejs.org/t/volume-of-three-buffergeometry/5109
        if (!geometry.isBufferGeometry) {
          console.log("'geometry' must be an indexed or non-indexed buffer geometry");
          return 0;
        }
        var isIndexed = geometry.index !== null;
        let position = geometry.attributes.position;
        let sum = 0;
        let p1 = new Vector3(),
          p2 = new Vector3(),
          p3 = new Vector3();
        if (!isIndexed) {
          let faces = position.count / 3;
          for (let i = 0; i < faces; i++) {
            p1.fromBufferAttribute(position, i * 3 + 0);
            p2.fromBufferAttribute(position, i * 3 + 1);
            p3.fromBufferAttribute(position, i * 3 + 2);
            sum += this.signedVolumeOfTriangle(p1, p2, p3);
          }
        }
        else {
          let index = geometry.index;
          let faces = index.count / 3;
          for (let i = 0; i < faces; i++){
            p1.fromBufferAttribute(position, index.array[i * 3 + 0]);
            p2.fromBufferAttribute(position, index.array[i * 3 + 1]);
            p3.fromBufferAttribute(position, index.array[i * 3 + 2]);
            sum += this.signedVolumeOfTriangle(p1, p2, p3);
          }
        }
        return sum;
      }
    
    private signedVolumeOfTriangle(p1: any, p2: any, p3: any) {
      return p1.dot(p2.cross(p3)) / 6.0;
    }

    public random_rgb() {
      const o = Math.round, r = Math.random, s = 255;
      return `rgb(${o(r() * s)}, ${o(r() * s)}, ${o(r() * s)})`;
    }

  public roundToMM(x: number) {
    const xRound= Math.round(x * 1000) / 1000;
    // console.log(x, xRound)
    return xRound
  }

  // Get common points of two geometries
  public getCommonPoints(geo1: BufferGeometry, geo2: BufferGeometry) {
    const pointsSplit = this.getPointsOfBufferGeometry(geo1, false);
    const pointsNegative = this.getPointsOfBufferGeometry(geo2, false);

    // console.log(pointsSplit)
    // console.log(pointsNegative)

    let commonPoints: Vector3[] = [];

    for (let pointS of pointsSplit) {
      for (let pointN of pointsNegative) {
        if (this.roundToMM(pointS.x) == this.roundToMM(pointN.x)) {
          // console.log("found in X: ", pointN)
          if (this.roundToMM(pointS.y) == this.roundToMM(pointN.y)) {
            // console.log("found in Y: ", pointN)
            if (this.roundToMM(pointS.z) == this.roundToMM(pointN.z)) {
              // console.log("found in Z: ", pointN)

              // make sure that only unique points are added
              if (!commonPoints.includes(pointS)) {
                commonPoints.push(pointS);
              }
            }
          }
        }
      }
    }
    // alternative did not work!
    // pointsSplit.filter(point => pointsNegative.includes(value));
    // const commonPoints = pointsSplit.filter(value => pointsNegative.includes(value));

    // Remove identical
    // let commonPointsUniq = this._3s.removeIdentical(commonPoints);
    // let uniq = Array.from(new Set(commonPoints));
    // console.log(commonPoints)
    // console.log(uniq)
    // console.log(commonPointsUniq)

    return commonPoints;
  }

  public drawIntersectionPoints(points: Vector3[]) {

    const geometry = new BufferGeometry().setFromPoints( points );

    const pointsMaterial = new PointsMaterial({
      size: .5,
      color: 0x00ff00
    });
    let pointsObj = new Points(geometry, pointsMaterial);
    let contourObj: any[] = []

    return {pointsObj, contourObj}

  }



  public getContours(points: any, contours: any, firstRun: any): any {
    console.log("firstRun:", firstRun);

    let contour = [];

    // find first line for the contour
    let firstPointIndex = 0;
    let secondPointIndex = 0;
    let firstPoint, secondPoint;
    for (let i = 0; i < points.length; i++) {
      if (points[i].checked == true) continue;
      firstPointIndex = i;
      firstPoint = points[firstPointIndex];
      firstPoint.checked = true;
      secondPointIndex = this.getPairIndex(firstPoint, firstPointIndex, points);
      secondPoint = points[secondPointIndex];
      secondPoint.checked = true;
      contour.push(firstPoint.clone());
      contour.push(secondPoint.clone());
      break;
    }

    contour = this.getContour(secondPoint, points, contour);
    contours.push(contour);
    let allChecked = 0;
    points.forEach((p:any) => { allChecked += p.checked == true ? 1 : 0; });
    console.log("allChecked: ", allChecked == points.length);
    console.log(allChecked)
    console.log(points.length)
    console.log(contours)
    console.log(points)

    if (allChecked != points.length) { return  this.getContours(points, contours, false); } // maximum call size exceeded!
    else {return contours }
  }

  getContour(currentPoint: any, points: any, contour: any): any {
    let p1Index = this.getNearestPointIndex(currentPoint, points);
    let p1 = points[p1Index];
    p1.checked = true;
    let p2Index = this.getPairIndex(p1, p1Index, points);
    let p2 = points[p2Index];	
    p2.checked = true;
    console.log(p1)
    console.log(p2)
    let isClosed = p2.equals(contour[0], this.tolerance);
    if (!isClosed) {
      contour.push(p2.clone());
      return this.getContour(p2, points, contour);
    } else {
      contour.push(contour[0].clone());
      return contour;
    }
  }

  getNearestPointIndex(point: any, points: any){
    let index = 0;
    for (let i = 0; i < points.length; i++){
      let p = points[i];
      if (p.checked == false && p.equals(point, this.tolerance)){ 
        index = i;
        break;
      }
    }
    return index;
  }

  getPairIndex(point: any, pointIndex: any, points: any) {
    let index = 0;
    for (let i = 0; i < points.length; i++) {
      let p = points[i];
      if (i != pointIndex && p.checked == false && p.faceIndex == point.faceIndex) {
        index = i;
        break;
      }
    }
    return index;
  }

  public  createAndLoadLine(points: Vector3[]) {
    const geometry = new BufferGeometry().setFromPoints( points );

    const material = new LineBasicMaterial({
      color: this.random_rgb()
    });
    const triangleLine = new Line( geometry, material );
    return triangleLine
  }

  public getPointsOfBufferGeometry(elGeo: BufferGeometry, addFaceIndex: boolean = true) {
    let points: Vector3[] = [];
      let positions: any = elGeo.attributes['position']['array']; // used to be : Float32Array
      let ptCout = positions.length / 3;

      for (let i = 0; i < ptCout; i++)
      {
          let point: any = new Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
          if (addFaceIndex == true) {
            point["faceIndex"] = Math.floor(i/3);
            point["checked"] = false;
          }
          points.push(point)
      };
      // console.log(points)
      return points;
  }

  public getFacesOfBufferGeometry(geo: BufferGeometry, getNormals: boolean = true, load: boolean = false) {
    const index = geo.getIndex();
    console.log(index)

    const points = this.getPointsOfBufferGeometry(geo, false);
    // console.log(points)

    let faces: Triangle[] = [];
    let normals: Vector3[] = [];

    if (index == null) { // non-indexed bufferGeometry
      const position = geo.getAttribute( 'position' );

      // console.log(position, position.count)

      for ( let i = 0; i < position.count; i += 3 ) {

          const a = i;
          const b = i + 1;
          const c = i + 2;
          // console.log(a, b, c)
          const pointA = points[a];
          const pointB = points[b];
          const pointC = points[c];

          if( this.isPointOnLine (pointA, pointB, pointC)) continue;

          const triangle = new Triangle(pointA, pointB, pointC);
          faces.push(triangle)

          if (getNormals == true) {
            const normal = triangle.getNormal(new Vector3);
            normals.push(normal)
          }

          if (load == true) {
            const triangle = [pointA, pointB, pointC, pointA]
            const triangleLine = this.createAndLoadLine(triangle);
          }
      }
    } else { // indexed bufferGeometry
      // list of 3 indices (indicates a triangle)
      for ( let i = 0; i < index.count; i += 3 ) {

          const a = index.getX( i );
          const b = index.getX( i + 1 );
          const c = index.getX( i + 2 );
          // console.log(a, b, c)
          const pointA = points[a];
          const pointB = points[b];
          const pointC = points[c];

          if( this.isPointOnLine (pointA, pointB, pointC)) continue;

          const triangle = new Triangle(pointA, pointB, pointC);
          faces.push(triangle)

          if (getNormals == true) {
            const normal = triangle.getNormal(new Vector3).normalize();
            normals.push(normal)
          }

          if (load == true) {
            const triangle = [pointA, pointB, pointC, pointA]
            const triangleLine = this.createAndLoadLine(triangle);
          }
      }    
    }
    return {faces, normals};
  }

  
  public createOBBMesh(obb: OBB, quaternion: Quaternion) {
    // credits: https://stackoverflow.com/questions/66381445/draw-3d-bounding-box-in-three-js

    
    const halfSize: Vector3 = obb.halfSize;
    const center: Vector3 = obb.center;
    const rotMat = obb.rotation.identity();
    let rot = new Matrix4().identity().setFromMatrix3(rotMat);
    let gH = new BufferGeometry().setFromPoints([
      new Vector3(1, 1, 1),
      new Vector3(1, 1, -1),
      new Vector3(1, -1, -1),
      new Vector3(1, -1, 1),
      new Vector3(-1, 1, 1),
      new Vector3(-1, 1, -1),
      new Vector3(-1, -1, -1),
      new Vector3(-1, -1, 1)
    ]);
    gH.setIndex([
      0, 1, 1, 2, 2, 3, 3, 0,
      4, 5, 5, 6, 6, 7, 7, 4,
      0, 4, 1, 5, 2, 6, 3, 7
    ])
    let mH = new LineBasicMaterial({color: 0xff0000});
    let oH = new LineSegments(gH, mH);
    oH.scale.copy(halfSize);
    oH.position.set(center.x, center.y, center.z)
    // oH.matrix.setRotationFromQuaternion( quaternion );
    oH.rotation.setFromRotationMatrix(rot);
    return oH;
  }
  private tripleProduct(a: any,b: any,c: any) {
    return a.clone().dot(
      (new THREE.Vector3()).crossVectors(b,c)
    );
  }
  
  public isCoPlanar(a: any,b: any,c: any,d: any) {
    var ab = b.clone().sub(a);
    var ac = c.clone().sub(a);
    var ad = d.clone().sub(a);
    return this.tripleProduct(ab,ac,ad) === 0;
  }

  public pointsAreCoplanar(points: Vector3[], tolerance: number = 0.001) {
    let isCoPlanar = true;
    let isLine = false;
    let plane = new THREE.Plane();

    let pointA!: Vector3, pointB!: Vector3, pointC!: Vector3;
    let linearPoints = true;
    
    const max = points.length - 2
    // console.log(max)
    for (let start of Array.from(Array(max).keys())) {
      pointA = points[start];
      pointB = points[start+1];
      pointC = points[start+2];
      
      if (this.isPointOnLine (pointA, pointB, pointC)) {
        // console.log("onLine: ", pointA, pointB, pointC)
      } else {
        linearPoints = false;
        // console.log("not linear: ", pointA, pointB, pointC)
        break;
      }
    }
    plane = plane.setFromCoplanarPoints(pointA, pointB, pointC)

    // console.log(plane)

    if (linearPoints == false) {
      
      // console.log(pointA, pointB, pointC)
       
      // points are coplanar? // if not --> Manual assessment; if yes --> check!
      for (var i=3; i<points.length; i++) {      
        // isCoPlanar = isCoPlanar && this.isCoPlanar(pointA, pointB, pointC, points[i]);
        // console.log(pointA, pointB, pointC, points[i])
        // console.log(isCoPlanar)
        // console.log(this.isCoPlanar(pointA, pointB, pointC, points[i]))
        const dist = Math.abs(plane.distanceToPoint(points[i]));
        // console.log(dist)
        // console.log(dist<tolerance)

        isCoPlanar = isCoPlanar && dist<tolerance;
        // console.log(isCoPlanar)

      }
    } else {
      isCoPlanar = false;
      isLine = true;
      console.log("could not find three coplanar points of the geometry. All points seem to be on a line")
    }
    
    return {isCoPlanar, plane, isLine};
  }


  public createOBBHelper(obb: YUKA.OBB, asWireframe: boolean = true) {
    const center = obb.center;
    const size = new YUKA.Vector3().copy(obb.halfSizes).multiplyScalar(2);
    const rotation = new YUKA.Quaternion().fromMatrix3(obb.rotation);
  
    const geometry = new THREE.BoxBufferGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: asWireframe
    });
    const mesh = new Mesh(geometry, material);
  
    mesh.position.copy(center as any);
    mesh.quaternion.copy(rotation as any);

    mesh.updateMatrix();

    // Apply mesh matrix to geometry
    mesh.geometry.applyMatrix4( mesh.matrix );
    // mesh.updateMatrix();
    // mesh.geometry.applyMatrix4(mesh.matrixWorld)

    // create new mesh with no rotation and use the rotatet geometry instead!
    const meshReady = new Mesh(geometry, material);
  
    return meshReady;
  }

  public createReducedOBB(geo: BoxBufferGeometry, tolerance: number = 1e-3) {
    const points = this.getPointsOfBufferGeometry(geo, false);
    const splitSurface = new BufferGeometry().setFromPoints( points );

    const mergedSurface = mergeVertices(splitSurface, tolerance);

  
    return mergedSurface;
  }


  private isPointOnLine (pointA: Vector3, pointB: Vector3, pointToCheck: Vector3) {
    var c = new Vector3(); 
    // console.log(pointA, pointB, pointToCheck)  
    // console.log(pointA.clone().sub(pointToCheck))
    // console.log(pointB.clone().sub(pointToCheck))
    c.crossVectors(pointA.clone().sub(pointToCheck), pointB.clone().sub(pointToCheck));
    return !c.length();
}

  public removeIdentical(a: any[]) {
    var seen: any = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
         var item = a[i];
         if(seen[item] !== 1) {
               seen[item] = 1;
               out[j++] = item;
         }
    }
    return out;
}

  public setTransparent(mesh: Mesh, randomColor: boolean = false) {
    const o = Math.round, r = Math.random, s = 255;
    Array.isArray(mesh.material) ? mesh.material[0]["opacity"] = 0.5 : mesh.material["opacity"] = 0.5;
    Array.isArray(mesh.material) ? mesh.material[0]["transparent"] = true : mesh.material["transparent"] = true;

    // // not working
    // if (randomColor == true) {
    //   Array.isArray(mesh.material) ? mesh.material[0].["color"].setRGB(o(r() * s), o(r() * s), o(r() * s)) : mesh.material["color"].setRGB(o(r() * s), o(r() * s), o(r() * s))
    // }
    
    return mesh;
  }
  public getIntersectingPoint(element: Mesh, target: Mesh) {
    
    /**
     * references:
     *  main: https://stackoverflow.com/questions/62573349/three-js-detecting-collision-with-raycaster-and-buffergeometry
     * raycaster (ThreeJS): https://threejs.org/docs/?q=raycast#api/en/core/Raycaster
     * raycaster examples: https://sbcode.net/threejs/measurements/
     * three js raycast examples: https://threejs.org/examples/?q=rayc#webgl_instancing_raycast (https://github.com/mrdoob/three.js/blob/master/examples/webgl_instancing_raycast.html)
        * Are all using the camera position as origin of the ray
        * Here we need the origin of the geometry to fire rays from
      * Example with Three.Geometry: view-source:https://stemkoski.github.io/Three.js/Collision-Detection.html
          * Has to be adapted to the new BufferGeometry
          * vertices = in attibrutes.positions... 
    */
      const elGeo: BufferGeometry = element.geometry;
      // const originPoint: Vector3 = elGeo.attributes.position.clone();
      // const originPoint = element.geometry.getAttribute( 'position' );
      const originPoint = element.position.clone();

      let vertices = this.getPointsOfBufferGeometry(elGeo)
      let res;

      for (let vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
          let localVertex = vertices[vertexIndex].clone();
          // let globalVertex = localVertex.applyMatrix4(target.matrix);
          let globalVertex = localVertex.applyMatrix4(element.matrix);

          // console.log(localVertex)
          // console.log(globalVertex)
          // console.log(globalVertex2)
          // console.log(vertexIndex)
          // console.log(originPoint) // all verteces are the same! because origin = 0,0,0

          // from https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/raycast.js
          element.updateMatrixWorld();
          globalVertex.setFromMatrixPosition( element.matrixWorld );

          console.log(globalVertex)

          // let directionVector = globalVertex.sub(element.position);
          let directionVector = globalVertex.sub(element.position);
          // console.log(directionVector)

          
          // dirVec.copy( origVec ).multiplyScalar( - 1 ).normalize();
          this.raycaster.set(originPoint, directionVector.clone().normalize());
          let collisionResults = this.raycaster.intersectObject(target, false); // @TODO create method
          // https://github.com/mrdoob/three.js/blob/master/examples/webgl_interactive_buffergeometry.html --> intersects.face
          
          if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
              console.log('<<<<HIT>>>>>', collisionResults[0].object.name);

              // if hit was detected there's no need to analyze more
              // return collisionResults[0];
              res = collisionResults[0];
              break;
          }
      }
      return res;
  }


    // Removes unused positions, normals and expressIDs + sets new index for the mesh
    public cleanMesh(mesh: Mesh): void{

      const index = mesh.geometry.getIndex();
  
      if(index == undefined) return;
  
      const initialExpressID = mesh.geometry.getAttribute("expressID");
      const initialPosition = mesh.geometry.getAttribute("position");
      const initialNormal = mesh.geometry.getAttribute("normal");
  
      const expressIDArray = new Uint32Array(index.array.length);
      const positionArray = new Float32Array(index.array.length * 3);
      const normalArray = new Float32Array(index.array.length * 3);
      let currentGroup = 0;
      for (let i = 0; i < index.array.length; i++) {
  
          const idx = index.array[i];
  
          // Get expressID
          expressIDArray[i] = initialExpressID.array[idx];
  
          // Get position
          const pX = initialPosition.getX(idx);
          const pY = initialPosition.getY(idx);
          const pZ = initialPosition.getZ(idx);
          positionArray[i+currentGroup] = pX;
          positionArray[i+currentGroup+1] = pY;
          positionArray[i+currentGroup+2] = pZ;
  
          // Get normal
          const nX = initialNormal.getX(idx);
          const nY = initialNormal.getY(idx);
          const nZ = initialNormal.getZ(idx);
          normalArray[i+currentGroup] = nX;
          normalArray[i+currentGroup+1] = nY;
          normalArray[i+currentGroup+2] = nZ;
  
          currentGroup+=2;
  
      }
  
      mesh.geometry.setAttribute('expressID', new BufferAttribute(expressIDArray, 1));
      mesh.geometry.setAttribute('position', new BufferAttribute(positionArray, 3));
      mesh.geometry.setAttribute('normal', new BufferAttribute(normalArray, 3));
  
      // Set index to 
      mesh.geometry.setIndex(Array.from(Array(index.array.length).keys()));
  
      mesh.updateMatrix();
      
  }
  
  public removeUnusedMaterials(mesh: Mesh): void{
  
      const newGroups = mesh.geometry.groups.filter(group => group.count > 0);
      const materialArray: Material[] = mesh.material as Material[];
  
      const newMaterial: any = [];
      for (let i = 0; i < newGroups.length; i++) {
          const idx = newGroups[i].materialIndex;
          if(idx != undefined){
              newMaterial.push(materialArray[idx]);
              newGroups[i].materialIndex = i;
          }
      }
  
      mesh.geometry.groups = newGroups;
      mesh.material = newMaterial;
  
  }


  public createSmallSphereAtPosition(position: Vector3, w?: number, h?: number, r?: number) {
    w = w === undefined ? 30 : w;
    h = h === undefined ? 15 : h;
    r = r === undefined ? 0.1 : r;

    var mesh = new THREE.Mesh(
      // USING A SPHERE GEOMETRY WITH A RADIUS OF 0.5
      new THREE.SphereGeometry(r, w, h),
      // standard material
      new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0x404040
      }));
      mesh.position.set(position.x, position.y, position.z); 

      return mesh
  }

  

}