import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'schedule-mapping-report',
  templateUrl: './schedule-mapping-validation.component.html',
  styleUrls: ['./schedule-mapping-validation.component.css']
})
export class ScheduleMappingValidationComponent implements OnInit {
  @Input() scheduleParamsResponse: any;
  @Output() showResults = new EventEmitter<any>();

  showEntityList: boolean = false;
  Object = Object;

  constructor() { }

  ngOnInit(): void {
    console.log("schedule-mapping-report initialized")
    for(let key in this.scheduleParamsResponse.error_list) {
      const itemList = this.scheduleParamsResponse.error_list[key];
      console.log(itemList)
      const id_List = itemList.map((item: any) => {
        return item.id
      })

      this.scheduleParamsResponse.error_list[key] = {
        ids: id_List,
        items: itemList
      }

    }
    console.log(this.scheduleParamsResponse)
  }

  handleShowResults(ids: any) {
    console.log(ids)
    // Assuming you want to show results for the selected requirement
    this.showResults.emit(ids);
  }

}
