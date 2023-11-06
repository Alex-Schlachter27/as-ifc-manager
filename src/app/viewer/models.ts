import { Color, PointsMaterial, Vector2, Vector3 } from "three";
// import { LineMaterial } from "three-fatline";

export class ModelViewerSettings{

    public panelColor: string = "DodgerBlue";
    public panelColorHover: string = "RoyalBlue";
    public displayMenuPanel: boolean = true;
    public displayGrid: boolean = false;
    public clickableWhenDimmed: boolean = false;    // Should dimmed elements be clickable?
    public highlightSelectedObjects: boolean = true;
    public multiSelectEnabled: boolean = false;
    public selectionColor: string = "rgba(251,254,157,0.5)";
    public hoverColor: string = "rgba(255,204,255,0.5)";
    public displayAxes: boolean = true;
    public backgroundColor: string = "";
    public showContextMenu: boolean = true;
    public showSpinnerOnModelLoad: boolean = true;
    public menuPanelSettings: MenuPanelSettings = new MenuPanelSettings();
    public contextMenuButtons: ContextMenuButtons = new ContextMenuButtons();
    // https://coolors.co/palette/001219-005f73-0a9396-94d2bd-e9d8a6-ee9b00-ca6702-bb3e03-ae2012-9b2226
    public colorScheme: string[] = ["#001219", "#005F73", "#0A9396", "#94D2BD", "#E9D8A6", "#EE9B00", "#CA6702", "#BB3E03", "#AE2012", "#9B2226"];

    setColorScheme(panelColor: string, panelColorHover: string){
        this.panelColor = panelColor;
        this.panelColorHover = panelColorHover;
        this.menuPanelSettings.setColorScheme(panelColor, panelColorHover);
    }

}

export enum ModelFileType{
    IFC="IFC",
    glTF="glTF",
    LDBIM="LDBIM"
}

export class MenuPanelSettings{

    public panelColor: string = "DodgerBlue";
    public panelColorHover: string = "RoyalBlue";
    public displayMenuPanel: boolean = true;
    public displayContextMenu: boolean = true;
    public panelButtons: PanelButtons = new PanelButtons();

    setColorScheme(panelColor: string, panelColorHover: string){
        this.panelColor = panelColor;
        this.panelColorHover = panelColorHover;
    }

}

export class ContextMenuButtons{
    showProperties: boolean = true;
}


export class PanelButtons{
    uploadFile: boolean = true;
    searchBar: boolean = true;
    cleanScene: boolean = true;
    modelOverview: boolean = true;
}

export interface ColorGroup{
    color: "string",
    expressIDs: number[]
}

export interface IDMap{
    expressToGlobalId: any;
    globalToExpressId: any;
}

export interface XYScreenCoordinate{
    x: string;
    y: string;
}

export interface ElementClickEvent{
    globalId: string;
    expressID: number;
    modelID: number;
    object: PickedObject;
    mouseEvent: MouseEvent;
    selection: string[];
}

export interface GlobalIdMatch{
    modelID: number;
    expressIDs: number[];
}

export interface PickedObject{
    distance: number;
    expressID: number;
    modelID: number;
    intersectionPoint: Vector3;
}

// WKT Objects
export class WKTObject{
    public wktString: string = "";
    public options: WKTObjectOptions = new WKTObjectOptions();
    public type: WKTObjectType = WKTObjectType.Unknown;
    public transformYZ: boolean = true;

    constructor(wktString: string, options = new WKTObjectOptions()){
        this.wktString = wktString.toLowerCase().trim();
        this.options = options;
        this.setType();
    }

    setType(){
        if(this.wktString.startsWith("bbox")){
            this.type = WKTObjectType.AABB;
        }
        if(this.wktString.startsWith("point")){
            this.type = WKTObjectType.Point;
        }
        if(this.wktString.startsWith("linestring")){
            this.type = WKTObjectType.LineString;
        }
        if(this.wktString.startsWith("polygon")){
            this.type = WKTObjectType.Polygon;
        }
    }
}

export class WKTObjectOptions{
    public color: string = "black";
    public size?: number = 0.3;
    public lineWidth?: number = 2;

    constructor(color?: string){
        if(color != undefined) this.color = color;
    }
}

export enum WKTObjectType{
    Unknown="unknown",
    Polygon="polygon",
    LineString="lineString",
    Point="point",
    AABB="aabb"
}
