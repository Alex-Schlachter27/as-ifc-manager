import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from "@angular/core";
import * as _ from "lodash";

export class colorLegendRoundData {
  text: string;
  color: string;
  radius?: number;
  value?: string;
  count?: number;
  constructor(text: string, color: string, radius: number, value: string, count: number) {
    this.text = text;
    this.color = color;
    this.radius = radius;
    this.value = value;
    this.count = count;
  }
}

export class Circle {
  x: number;
  y: number;
  r: number;

  constructor(x: number, y: number, r: number) {
    this.x = x;
    this.y = y;
    this.r = r;
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
  selector: "color-legend-round",
  templateUrl: "./color-legend-round.component.html",
  styleUrls: ["./color-legend/color-legend.component.scss"],
})
export class ColorLegendRoundComponent implements OnInit, OnChanges {
  @Input() data?: colorLegendRoundData[];
  @Input() title?: string;
  @Input() clickable: boolean = false;
  @Input() width: number = 100;


  @Output() onItemHover = new EventEmitter<any>();
  @Output() onItemClick = new EventEmitter<string>();

  public canvasHeight: number = 150;
  public titleHeight: number = 0;
  diameter: number = 20;
  totalWidth?: number;

  circles: any[] = [];

  constructor() {}

  ngOnInit() {
    if (this.title) this.titleHeight = 25;
    this.drawCircles();
  }

  ngOnChanges(changes: SimpleChanges) {
    // console.log(changes)
    if (changes["data"].currentValue) {
      this.data = changes["data"].currentValue;
      // console.log(this.data)
      this.drawCircles();
    }
  }

  hoveringItem(ev: any) {
    this.onItemHover.emit(ev.value);
  }

  itemClick(ev: any) {
    this.onItemClick.emit(ev);
  }

  private drawCircles() {
    if(!this.data) return
    this.circles = this.data.map((item, i) => {
      var color = item.color;

      // Generate box
      var x = this.diameter / 2;
      var y = this.diameter / 2 + i + i * 1.2 * this.diameter;
      if (this.title) y = y + this.titleHeight;
      var r = item.radius ? item.radius : this.diameter / 2;
      let circ = new Circle(x, y, r);

      // Generate text
      var x_txt = x + this.diameter;
      var y_txt = y + 3;
      var txt: string = item.text;

      let itemCount = "-";
      if (item.count != undefined) itemCount = item.count.toString();
      txt = `${txt} [${itemCount}]`;

      let label = new Text(x_txt, y_txt, txt);

      this.canvasHeight = y + this.diameter; // Update canvas size

      return { value: item.value, text: item.text, color, circ, label };
    });
    // console.log(this.circles)
  }
}
