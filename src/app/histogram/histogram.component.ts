import { Component,OnInit, ElementRef, Input, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-histogram',
  standalone: true,
  imports: [HttpClientModule,MatSlideToggleModule, FormsModule, CommonModule],
  templateUrl: './histogram.component.html',
  styleUrl: './histogram.component.css'
})
export class HistogramComponent {
  constructor(private elementRef: ElementRef,private http: HttpClient) { }
  @Input()
  barOption:any;

  ngOnChanges(changes: SimpleChanges) {
    // Check if barOption input has changed
    if (changes['barOption'] && !changes['barOption'].firstChange) {
        this.refresh();
    }
  }
  
  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      this.loadData();
    }
  }

  displayMenu=false;
  //barOption="Suburb";
  bar_options=["Rooms","Distance","Postcode","Propertycount","Landsize","YearBuilt"]
  r_data={};
  fcount:any={}
  finalData:any=[];
  sum=0;
  max_value=0;
  reload=true;

  displayOptions(){
    this.displayMenu=!this.displayMenu;
  }

  selectOption(value:any){
    this.barOption=value;
    this.refresh();
  }

  refresh(){
    d3.select("#title").remove();
    d3.select("#mod")
    .append('div')
    .attr('id', 'title')
    .style('border','1px solid black')
    .append('h5')
    .style("display","grid")
    .style("justify-items","center")
    .text("Frequency Distribution of "+ this.barOption);
    // this.fcount={};
    // this.finalData=[];
    //this.max_value=0;
    //this.frequency(this.barOption,this.barData);
    //this.finalData.splice(this.finalData.length-1); 
    this.createChart(this.r_data);
  }


  loadData(): void {
    this.http.get('assets/finalHousing.csv', { responseType: 'text' })
      .subscribe(data1 => {
        const data = d3.csvParse(data1); 
        this.r_data=data;
        console.log("logged")
        this.refresh();
        //this.createChart(data); 
      });
  }

   // Frequency function--->
   frequency(v:any,data:any){
    for(let i in data){
      if( this.fcount.hasOwnProperty(data[i][v]))
        this.fcount[data[i][v]]=this.fcount[data[i][v]]+1;
      else
      this.fcount[data[i][v]]=1;
    }
    //console.log('start');
    for(let i in this.fcount){
      this.finalData.push({region:i,value:this.fcount[i]});
      this.sum+=this.fcount[i];
      this.max_value=Math.max(this.max_value,this.fcount[i])
    }
    //console.log("72 line "+  this.sum)
  }
// function end--->

  createChart(data:any){
    //this.reload=true;

    var margin = {top: 40, right: 30, bottom: 120, left: 120},
    width = 750 - margin.left - margin.right,
    height = 650 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let max_value=0;
    let min_value=9999999;
    let mean =0;
    for(let i in data){
      if(data[i][this.barOption] != undefined){
        max_value=Math.max(max_value,data[i][this.barOption])
        min_value=Math.min(min_value,data[i][this.barOption])
      }
    }
    console.log(max_value)
    var svg = d3.select("#title")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

     // X axis: scale and draw:
     var x = d3.scaleLinear()
     .domain([min_value, max_value])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
     .range([0, width]);
     svg.append("g")
     .attr("transform", "translate(0," + height + ")")
     .call(d3.axisBottom(x));
     

     svg.append("text")
     .attr("transform", "translate(" + (width - 50) + " ," + (height + margin.top +30) + ")")
     .style("text-anchor", "middle")
     .text(this.barOption);

    // set the parameters for the histogram
    
    var histogram = d3.bin<number, number>()
      .value((d:any) => {return d[this.barOption]; })   // I need to give the vector of value
      .domain([min_value,max_value])  // then the domain of the graphic
      .thresholds(x.ticks(7)); // then the numbers of bins

    // And apply this function to data to get the bins
    var bins = histogram(data);
    

    // Y axis: scale and draw:
    var y = d3.scaleLinear()
      .range([height, 0]);
      y.domain([0, d3.max(bins, function(d:any) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    svg.append("g")
      .call(d3.axisLeft(y));

    svg.append("text")
    .attr("transform", "translate(" + (-60) + " ," + (50) + ")rotate(-90)")
    .style("text-anchor", "middle")
    .text("Frequency ->");
    
    // let t1:any=(bins[1].x1) 
    // let t2:any=(bins[1].x0)
    // let tmin:any= t1-t2
    // t1=(bins[0].x1) 
    // t2=(bins[0].x0)
    // let tmin0:any= t1-t2
    // if(tmin0 < tmin)
    //     bins.splice(0,1)
    // t1=(bins[bins.length-1].x1) 
    // t2=(bins[bins.length-1].x0)
    // tmin0 = t1 - t2;
    // if(tmin0 < tmin)
    //     bins.splice(bins.length-1,bins.length)

   

     



      console.log(bins)
    // append the bar rectangles to the svg element
    console.log("histogram plot")
    svg.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d:any) { 
          return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d:any) {
           return x(d.x1) - x(d.x0) -1; })
        .attr("height", function(d:any) { return height - y(d.length); })
        .style("fill", "#69b3a2")
        .on("mouseover", function(d: any) {
          // Append text element to display value
          d3.select(this).style("fill","#6495ED")
          console.log(d);
          svg.append("text")
            .attr("class", "bar-value")
            .attr("x",x(d.target.__data__.x1) - 25 )  
            .attr("y", y(d.target.__data__.length) - 5) 
            .text(d.target.__data__.length)
            .style("text-anchor", "middle")
            .style("fill", "blue")
          svg.append("text")
          .attr("class", "bar-value")
          .attr("x",x(d.target.__data__.x1) - 25 )  
          .attr("y", y(d.target.__data__.length) - 20) 
          .text("range: "+d.target.__data__.x0+" - "+d.target.__data__.x1)
          .style("text-anchor", "middle")
          .style("fill", "blue")
        })
        .on("mouseout", function() {
          d3.select(this).style("fill","#69b3a2")
          svg.selectAll(".bar-value").remove();
        });

     //this.reload=true;
  }

}
