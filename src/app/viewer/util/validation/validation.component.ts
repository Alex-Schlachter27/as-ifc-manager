import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'validation-report',
  templateUrl: './validation.component.html',
  styleUrls: ['./validation.component.css']
})
export class ValidationComponent implements OnInit {
  @Input() idsResult: any;
  @Output() showResults = new EventEmitter<any>();

  showEntityList: boolean = false;

  constructor() { }

  ngOnInit(): void {
    console.log("validation-report initialized")
  }

  handleShowResults(requirement: any) {
    // Assuming you want to show results for the selected requirement
    this.showResults.emit(requirement.failed_entities);
  }

  toggleshowEntityList() {
    this.showEntityList = !this.showEntityList;
    // console.log(this.showEntityList)
  }

}
