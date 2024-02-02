import { Component, Input } from '@angular/core';

@Component({
    selector: 'lib-circle',
    templateUrl: './circle.component.html'
})
export class CircleComponent {

    @Input() color = "red";
    boxSize: number = 20;
    x = this.boxSize/2;
    y = this.boxSize/2;
    
}
