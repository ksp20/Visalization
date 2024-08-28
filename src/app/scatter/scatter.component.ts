import { Component,OnInit, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-scatter',
  standalone: true,
  imports: [HttpClientModule,MatSlideToggleModule, FormsModule, CommonModule],
  templateUrl: './scatter.component.html',
  styleUrl: './scatter.component.css'
})
export class ScatterComponent {
  constructor(private elementRef: ElementRef,private http: HttpClient) { }
  ngOnInit(): void {
    if (typeof document !== 'undefined') 
      this.loadData();
  }

  cat_options=["Suburb","SellerG","CouncilArea","Regionname","Type","Method","Postcode"]
  num_options=["Rooms","Distance","Propertycount","Landsize","YearBuilt","Bathroom","Price"]
  bar_options=["Suburb","SellerG","Bathroom","CouncilArea","Regionname","Type","Price","Method","Rooms","Distance","Postcode","Propertycount","Landsize","YearBuilt"]
  fcount:any={}
  f1:any=[];
  f2:any=[];
  finalData:any=[];
  value1:string="none"
  value2:string="none"
  sum=0;
  max_value=0;
  cv1_max = 0;
  cv2_max = 0;
  cv1_min= 99999999;
  cv2_min = 99999999;
  arr1:any=[];
  arr2:any=[];
  r_data:any={};
  reload=false;
  displayMenu1=false;
  displayMenu2=false;


  displayOptions1(){
    this.displayMenu1=!this.displayMenu1
  }
  displayOptions2(){
    this.displayMenu2=!this.displayMenu2
  }



  loadData(): void {
    this.http.get('assets/finalHousing.csv', { responseType: 'text' })
      .subscribe(data1 => {
        const data = d3.csvParse(data1);
        this.r_data=data;
        this.createChart(data); 
      });
  }

  refresh(t:any,value:any){
    if(t == 'v1'){
      this.value1=value;
      this.displayMenu1=false;
    }
    else{ 
      this.value2=value;
      this.displayMenu2=false;
    }
    this.cv1_max = 0;
    this.cv1_min= 99999999;
    this.arr1=[];
    this.cv2_max = 0;
    this.cv2_min = 99999999;
    this.arr2=[];
    console.log(this.cv1_min+" "+this.cv1_max +" "+this.value1);
    console.log(this.cv2_min+" "+this.cv2_max+" "+this.value2);
    if(this.value1 != "none" && this.value2 != "none")
      this.createChart(this.r_data);
  }

  frequency(v:any,data:any){
    let j=1;
    this.fcount=[];
    if(this.cat_options.includes(v)){
      if(v==this.value1)
        this.f1=[];
      if(v==this.value2)
        this.f2=[];
      for(let i in data){
        if(!this.fcount.hasOwnProperty(data[i][v])){
          this.fcount[data[i][v]]=j;
          if(v==this.value1)
            this.f1.push(data[i][v])
          if(v==this.value2)
            this.f2.push(data[i][v])
          j++;
        }
      if(this.value1 == v){
          this.arr1.push(this.fcount[data[i][v]]);
          this.cv1_max=j-1;
          this.cv1_min=1;
        }
        if(this.value2 == v){
          this.arr2.push(this.fcount[data[i][v]]);
          this.cv2_max=j-1;
          this.cv2_min=1;
        }
      }
      console.log(this.f1)
    }
    else{
      console.log("numeric value")
      for(let i of data){
        if(this.value1 == this.value2){
          this.arr1.push(i[v]);
          this.cv1_max=Math.max(this.cv1_max,i[v]);
          this.cv1_min=Math.min(this.cv1_min,i[v]);
          this.arr2.push(i[v]);
          this.cv2_max=Math.max(this.cv2_max,i[v]);
          this.cv2_min=Math.min(this.cv2_min,i[v]);
        }
        else if(this.value1 == v){
          this.arr1.push(i[v]);
          this.cv1_max=Math.max(this.cv1_max,i[v]);
          this.cv1_min=Math.min(this.cv1_min,i[v]);
        }
        else{
          this.arr2.push(i[v]);
          this.cv2_max=Math.max(this.cv2_max,i[v]);
          this.cv2_min=Math.min(this.cv2_min,i[v]);
        }
      }
    }
    console.log(this.cv1_min+"  "+this.cv1_max);
    console.log(this.cv2_min+"  "+this.cv2_max);
  }

  createChart(data:any){

    this.reload=false;

    d3.select("#title").remove();
    d3.select("#mod")
    .append('div')
    .attr('id', 'title')
    .style('width','700px')
    .style('margin-top','-20px')
    .style('border','1px solid black')
    .append('h5')
    .style("display","grid")
    .style("justify-items","center")
    .text("Relationship between "+ this.value1+" and "+this.value2);

    if(this.value1 == this.value2){
      this.frequency(this.value1,data);
    }
    else{
      this.frequency(this.value1,data);
      this.frequency(this.value2,data);
    }

    console.log(this.cv1_min+" "+this.cv1_max +" "+this.value1);
    console.log(this.cv2_min+" "+this.cv2_max+" "+this.value2);
    

  
    var margin = {top: 80, right: 200, bottom: 130, left: 160},
    width = 870 - margin.left - margin.right,
    height = 740 - margin.top - margin.bottom;


    var svg = d3.select("#title")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

    var x:any; 
    if(!this.cat_options.includes(this.value1)){
      x = d3.scaleLinear()
      .domain([this.cv1_min, this.cv1_max])
      .range([ 0, width ])

      svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      
    }
    else{
      this.f1.pop();
      x=d3.scaleBand()
      .domain(this.f1.map((d:any)=>{ return d}))
      .range([ 0, width ])
      .padding(1);

      svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
    }


    svg.append("text")
    .attr("transform", "translate(" + (width - 180) + " ," + (height + margin.top + 20) + ")")
    .style("text-anchor", "middle")
    .style("font-size","small")
    .text(this.value1+" ->");
    

    var y:any;

    if(!this.cat_options.includes(this.value2)){
      y = d3.scaleLinear()
      .domain([this.cv2_min, this.cv2_max])
      .range([height,0]);
    }
    else{
      this.f2.pop();
      y=d3.scaleBand()
      .domain(this.f2.map((d:any)=>{ return d}))
      .range([height,0])
      .padding(1)
      
    }

    svg.append("g")
    .call(d3.axisLeft(y));

    svg.append("text")
    .attr("transform", "translate(" + (-130) + " ," + (180) + ")rotate(-90)")
    .style("text-anchor", "middle")
    .style("font-size","small")
    .text(this.value2+" ->");


    svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx",(d:any,i:any) => {
      if(this.cat_options.includes(this.value1) || this.cat_options.includes(this.value2) ){ 
        let t= x(d[this.value1]) + Math.random()*(30) - 15; 
        if(t<x(this.cv1_min))
          return x(this.cv1_min)
        return t
      }
        return x(d[this.value1])} )
    .attr("cy",(d:any,i:any) => { 
      if(this.cat_options.includes(this.value1) || this.cat_options.includes(this.value2)){ 
        let t= y(d[this.value2]) + Math.random()*(30) - 15; 
        if(t>y(this.cv2_min))
          return y(this.cv2_min)
        return t
      }
        return y(d[this.value2])} )
    .attr("r", 1.5)
    .style("fill", "#69b3a2")


    // if(this.cat_options.includes(this.value1)){ // remove if condition
      //   return x(d[this.value1])
      // }


    // svg.append('g')
    // .selectAll("dot")
    // .data(data)
    // .enter()
    // .append("circle")
    // .attr("cx",(d:any,i:any) => {
    //   if(!this.cat_options.includes(this.value1) || !this.cat_options.includes(this.value2))
    //     return x(this.arr1[i])
    //   let t= x(this.arr1[i]) + Math.random()*(10) - 5; 
    //   if(t<this.cv1_min)
    //     return x(this.arr1[i])
    //   return t;} )
    // .attr("cy",(d:any,i:any) => { 
    //   if(!this.cat_options.includes(this.value1) || !this.cat_options.includes(this.value2))
    //     return y(this.arr2[i])
    //   let t= y(this.arr2[i]) + Math.random()*(5) - 5; 
    //   if(t<this.cv2_min)
    //     return y(this.arr2[i])
    //   return t;} )
    // .attr("r", 1.5)
    // .style("fill", "#69b3a2")
    this.reload = true;
  }

}


