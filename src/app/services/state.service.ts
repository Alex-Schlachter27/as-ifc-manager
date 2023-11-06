import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private modelCount: number = 0;

  getModelCount() {
    return this.modelCount;
  }

  setModelCount(value: number) {
    this.modelCount = value;
  }
}
