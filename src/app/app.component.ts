import { Component,OnInit, ElementRef, Input} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';
import {BarComponent} from './bar/bar.component';
import {ScatterComponent} from './scatter/scatter.component';
import {ScreeplotComponent} from './screeplot/screeplot.component';
import {HistogramComponent} from './histogram/histogram.component';
import {MdsPlotComponent} from './mds-plot/mds-plot.component'
import {VizprojComponent} from './vizproj/vizproj.component'
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DataService } from './data.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, FormsModule, BarComponent, HttpClientModule,
    CommonModule, ScatterComponent, HistogramComponent, ScreeplotComponent, MdsPlotComponent, VizprojComponent
  ],
  providers: [DataService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})


export class AppComponent implements OnInit {

  chartData: any = 'Hello from Parent!';

  constructor(
    private elementRef: ElementRef,
    private http: HttpClient,
    private dataService: DataService) { }

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      this.loadData();
    }
    // this.dataService.getData().subscribe(response => {
    //   this.flask_data = response;
    // });
  }

  flask_data:any=""
  dataset:any;

  cat_options=["Suburb","CouncilArea","SellerG","Regionname","Postcode","Type","Method","Address","Date"]
  num_options=["Rooms","Distance","Propertycount","Landsize","YearBuilt","Bathroom","Price","Car"]
  bar_options=["Suburb","CouncilArea","Car","Rooms",,"SellerG","Regionname","Type","Method","Price","Bathroom","Distance","Postcode","Propertycount","Landsize","YearBuilt"]
  displayMenu=false;

  displayOptions(){
    this.displayMenu=!this.displayMenu
  }
  selectOption(value:any){
    this.chartData=value;
    if(this.cat_options.includes(value))
      this.data.graph="bargraph";
    else 
      this.data.graph="histogram"
    console.log(this.chartData);
  }

  data:any={
    graph:"viz"
    //graph:"mdsplot"
  }

  // FUNCTIONS

  loadData(): void {
    this.http.get('assets/finalHousing.csv', { responseType: 'text' })
      .subscribe(data1 => {
        const data = d3.csvParse(data1); 
        //console.log(this.barOption);
        data.forEach((obj:any) => {
          // Iterate through keys to delete
          this.cat_options.forEach(key => {
              if (obj.hasOwnProperty(key)) {
                  delete obj[key];
              }
          });
        });
        this.dataset=data;
      });
      
  }

  changeOption(option:any){
    this.data.graph=option;
  }

  sendData() {
    const data = {
      "key":"value",
      "a":"1234",
      "b":"defg",
    };
    this.dataService.sendData(this.dataset).subscribe(
      response => {
        //console.log('Response from server:', response);
        // Handle response here
      },
      error => {
        console.error('Error:', error);
        // Handle error here
      }
    );
  }

}
