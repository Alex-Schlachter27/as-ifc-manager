export interface IntersectionResults{
    all: Intersection[];
    intersectionCount: number;
    multiple: Intersection[];
    single: Intersection[];
}

export interface Intersection{
    expressID: number;
    modelID: number;
    elementVolume: number;
    interfaces: InterfaceObject[];
}

export interface InterfaceObject{
    expressID: number;
    volume: number;
    targetID: number;
    targetModelID: number;
    targetVolume: number;
}

// export interface ClashDetectionInput{
//   elementIDs: string[],
//   model?: IFCModel,
//   modelID: number,
// }
