import { HttpClient, HttpBackend, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    private http: HttpClient;

    constructor(
        private handler: HttpBackend,
    ){
        this.http = new HttpClient(handler);
    }

    testAPI() {
      const url = "http://127.0.0.1:8000/ids/";
      return this.http.get(url);
    }

    validateModel(ifc: File, ids: File) {
      const formData = new FormData();
      formData.append('ifc', ifc, ifc.name);
      formData.append('ids', ids, ids.name);

      const url = "http://127.0.0.1:8000/ids/validate/";

      return this.http.post(url, formData)
      .pipe(
        catchError(this.handleError)
      );
    }

    getIfcProducts(file: File) {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const url = "http://127.0.0.1:8000/main/get-ifc-products/";

      return this.http.post(url, formData)
      .pipe(
        catchError(this.handleError)
      );
    }


    private handleError(error: HttpErrorResponse) {
      if (error.status === 0) {
        // A client-side or network error occurred. Handle it accordingly.
        console.error('An error occurred:', error.error);
      } else {
        // The backend returned an unsuccessful response code.
        // The response body may contain clues as to what went wrong.
        console.error(
          `Backend returned code ${error.status}, body was: `, error.error);
      }
      // Return an observable with a user-facing error message.
      return throwError(() => new Error('Something bad happened; please try again later.'));
    }

    // async updateData(oldTriples: any, newTriples: any) {

    //     console.log(oldTriples)
    //     console.log(newTriples)

    //     const q = `DELETE{
    //         <https://resources.kobl.app/w1-bbox> <https://w3id.org/kobl/geometry-analysis#zMin> ?sh .
    //     }INSERT{
    //         ${newTriples}
    //     }WHERE{
    //         <https://resources.kobl.app/w1-bbox> <https://w3id.org/kobl/geometry-analysis#zMin> ?sh .
    //      }`;
    //     console.log(q)
    //     try{
    //         await this._ts.updateQuery(q).toPromise();
    //         console.log(`Successfully updated rule`);
    //     }catch(e:any){
    //         console.log(e)
    //         throw `Updating of rule failed: ${e}`;
    //     }
    // }

}
