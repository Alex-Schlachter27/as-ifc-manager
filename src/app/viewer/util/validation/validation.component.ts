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
    const failedEntities = requirement.failed_entities;
    console.log(failedEntities)
    let idList = [];
    for (let i = 0; i < failedEntities.length; i++) {
      let failedEntity = failedEntities[i];
      idList.push(failedEntity.id)
    }
    this.showResults.emit(idList);
  }

  toggleshowEntityList() {
    this.showEntityList = !this.showEntityList;
    // console.log(this.showEntityList)
  }

}
