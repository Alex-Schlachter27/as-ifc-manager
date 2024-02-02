import { Component, Input } from '@angular/core';

@Component({
    selector: 'lib-square',
    templateUrl: './square.component.html'
})
export class SquareComponent {

    @Input() color = "red";
    boxSize: number = 20;

}
