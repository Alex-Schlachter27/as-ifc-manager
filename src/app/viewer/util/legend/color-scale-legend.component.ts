import {
  Component,
  OnChanges,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import * as _ from "lodash";
import * as d3 from "d3-scale";

export class Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, size:number) {
    this.x = x;
    this.y = y;
    this.width = size;
    this.height = size;
    return { x: x, y: y, width: size, height: size };
  }
}

export class Text {
  x: number;
  y: number;
  text: string;

  constructor(x: number, y: number, text: string) {
    this.x = x;
    this.y = y;
    this.text = text;
    // return { x, y, text };
  }
}

@Component({
  selector: "color-scale-legend",
  templateUrl: "./color-scale-legend.component.html",
  styleUrls: ["./color-scale-legend.component.scss"],
})
export class ColorScaleLegendComponent implements OnChanges {
  @Input() minVal?: number;
  @Input() maxVal?: number;
  @Input() steps?: number;
  @Input() maxDecimals: number = 2;
  @Input() unit?: string;
  @Input() title?: string;

  @Input() width: number = 100;

  @Output() onItemHover = new EventEmitter<any>();

  public canvasHeight: number = 150;
  public titleHeight: number = 0;
  boxSize: number = 20;
  totalWidth?: number;

  boxes: any[] = [];

  constructor() {}

  ngOnInit() {
    if (this.title) this.titleHeight = 25;
    this.drawBoxes();
  }

  ngOnChanges() {
    this.drawBoxes();
  }

  hoveringItem(ev: any) {
    this.onItemHover.emit(ev.value);
  }

  private drawBoxes() {
    if(!this.maxVal || !this.minVal || !this.steps) return
    var incrementor = (this.maxVal - this.minVal) / this.steps;
    var valueArray = _.range(this.minVal, this.maxVal, incrementor);
    var color_scale = d3
      .scaleLinear<string>()
      .domain([this.minVal, this.maxVal])
      .range(["#fee8c8", "#e34a33"]);

    this.boxes = valueArray.map((val: any, i: number) => {
      var rounded =
        Math.round(Number(val) * 10 ** this.maxDecimals) /
        10 ** this.maxDecimals;

      // Generate box
      var x = 0;
      var y = i + i * 1.2 * this.boxSize + this.titleHeight;
      var size = this.boxSize;
      let rect = new Rectangle(x, y, size);

      // Generate text
      var x_txt = x + this.boxSize + 10;
      var y_txt = y + this.boxSize - 3;
      var txt: string = rounded.toString();
      if (this.unit) txt = `${txt} ${this.unit}`;
      let text = new Text(x_txt, y_txt, txt);

      this.canvasHeight = y + this.boxSize; // Update canvas size

      return { value: val, color: color_scale(val), rect: rect, label: text };
    });
  }
}
