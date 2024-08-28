import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }
  getData(): Observable<any> {
    return this.http.get('http://127.0.0.1:5000/api/data');
  }

  sendData(data: any): Observable<any> {
    return this.http.post<any>('http://127.0.0.1:5000/reduce_dimensions', { data });
  }

  getCluster(): Observable<any> {
    return this.http.get('http://127.0.0.1:5000/k-means');
  }

  send_di(data: any): Observable<any> {
    return this.http.post<any>('http://127.0.0.1:5000/d_index', { data});
  }

  get_d_attributes(data:any): Observable<any> {
    return this.http.post<any>('http://127.0.0.1:5000/d_attributes',{ data});
  }

  get_mds():Observable<any>{
    return this.http.get('http://127.0.0.1:5000/mds');
  }

}
