import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from "@angular/core";

import stc from 'string-to-color';

export class ColorLegendData {
  text: string;
  color: string;
  radius?: number;
  value?: any;
  count?: number;
  temporary?: boolean;
  constructor(text: string, color: string, radius: number, value: string, count: number, temporary?: boolean) {
    this.text = text;
    this.color = color;
    this.radius = radius;
    this.value = value;
    this.count = count;
    this.temporary = temporary;
  }
}


export enum Shape{
  round = "round",
  square = "square"
}

@Component({
  selector: "color-legend",
  templateUrl: "./color-legend.component.html",
  styleUrls: ["./color-legend.component.scss"],
})
export class ColorLegendComponent implements OnChanges {

  @Input() data?: ColorLegendData[];
  @Input() title?: string;
  @Input() clickable: boolean = false;
  @Input() unfoldOnClick: boolean = false;
  @Input() shape: Shape = Shape.square;

  @Input() addNewOption: boolean = false;
  @Input() addNewButtonText: string = "Add";
  @Input() addNewDefaultText: string = "Item X";

  @Output() onItemHover = new EventEmitter<any>();
  @Output() onItemClick = new EventEmitter<string>();
  @Output() onDataUpdate = new EventEmitter<any>();

  public unfolded?: number | null;

  public addNewMode: boolean = false;

  boxes = [];

  constructor() {}

  ngOnInit() {

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["data"] && changes["data"].currentValue) {
      this.data = changes["data"].currentValue;
      this.appendMissingColors();
      this.sortAlphabetically();
    }
  }

  hoveringItem(ev: any) {
    this.onItemHover.emit(ev.value);
  }

  itemClick(index: number) {

    if(!this.data) return

    const item: ColorLegendData = this.data[index];

    if(this.clickable || this.unfoldOnClick && !item["temporary"]){
      this.onItemClick.emit(item.value);
    }

    if(this.unfoldOnClick){
      this.unfolded = this.unfolded == index ? null : index;
    }
  }

  onAddNew(){

    if(!this.addNewMode){

      if(!this.data) return

      this.addNewMode = true;

      // Do nothing if there is already a new item in the array
      const tempItems = this.data.filter(item => item.temporary);
      if(tempItems.length) return;

      let newItem : ColorLegendData = {
        text: this.addNewDefaultText,
        color: stc(this.addNewDefaultText),
        count: 0,
        value: null,
        temporary: true
      }

      this.data.unshift(newItem);
    }else{
      this.addNewMode = false;
      this.onDeleteNewItem();
    }
  }

  // Update color as name changes
  updateColorForNewItem(item: ColorLegendData){
    item.color = stc(item.text);
  }

  onDeleteNewItem(){
    if(!this.data) return
    this.data = this.data.filter(item => !item.temporary);
  }

  collapse(){
    this.unfolded = null;
  }

  onSaveNewItem(){
    if(!this.data) return

    this.data[0].temporary = false;

    const newItem = this.data[0];
    this.sortAlphabetically();

    this.onDataUpdate.emit({
      list: this.data,
      newItem: newItem
    })
  }

  private appendMissingColors(){
    if(!this.data) return
    this.data = this.data.map(item => {
      if(item.color == undefined) item.color = stc(item.text);
      return item;
    })
  }

  private sortAlphabetically(){
    if(!this.data) return
    this.data = this.data.sort((a, b) => a.text.localeCompare(b.text));
  }

}
