import { Component,OnInit, ElementRef, SimpleChanges, OnChanges, Input } from '@angular/core';
import * as d3 from 'd3';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';


@Component({
  selector: 'app-smatrix',
  standalone: true,
  imports: [HttpClientModule,MatSlideToggleModule, FormsModule, CommonModule],
  providers: [DataService],
  templateUrl: './smatrix.component.html',
  styleUrl: './smatrix.component.css'
})
export class SmatrixComponent {
  constructor(private elementRef: ElementRef,
    private http: HttpClient, 
    private dataService: DataService) { }

    @Input() di:any; 
    @Input() kc:any;

  ngOnInit(): void {
    if (typeof document !== 'undefined'){
      this.loadData();

      this.dataService.getCluster().subscribe(
        response => {
        this.clusteredData = response.clustered_label[this.kc];
        this.clustered_label=response.clustered_label;
        this.dataService.get_d_attributes(this.di+1).subscribe(
          response => {
            console.log('Response from server:',response);
            this.attr=response.attributes
            this.createAll();
          })
      });
    }
  }

    ngOnChanges(changes: SimpleChanges): void {
    if (changes['di'] && !changes['di'].firstChange) {
      if (typeof document !== 'undefined'){
        console.log("ngonchange "+this.di)
        this.dataService.get_d_attributes(this.di+1).subscribe(
          response => {
            console.log('Response from server:',response);
            this.attr=response.attributes
            this.createAll();
          },
          error => {
            console.error('Error:', error);
          }
        );
      }
    }
    if (changes['kc'] && !changes['kc'].firstChange) {
      if (typeof document !== 'undefined'){
        console.log("changed"+ this.kc)
        //console.log(this.clustered_label[this.kc])
        this.clusteredData=this.clustered_label[this.kc]
        this.createAll()
      }
    }
  }
  clusteredData:any
  clustered_label:any
  arr: any[] = new Array(16);
  attr=["Rooms","Distance","Price","Landsize"]
  cat_options=["Suburb","SellerG","CouncilArea","Regionname","Type","Method","Postcode"]
  num_options=["Rooms","Distance","Propertycount","Landsize","YearBuilt","Bathroom","Price"]
  bar_options=["Suburb","SellerG","Bathroom","CouncilArea","Regionname","Type","Price","Method","Rooms","Distance","Postcode","Propertycount","Landsize","YearBuilt"]
  fcount:any={}
  f1:any=[];
  f2:any=[];
  finalData:any=[];
  value1:string="Rooms"
  value2:string="Price"
  sum=0;
  max_value=0;
  cv1_max = -999999999;
  cv2_max = -999999999;
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
    this.http.get('assets/updated.csv', { responseType: 'text' })
      .subscribe(data1 => {
        const data = d3.csvParse(data1);
        this.r_data=data;
        //this.createChart(data); 
      });
  }

  refresh(){
    this.cv1_max = -9999999;
    this.cv1_min= 99999999;
    this.arr1=[];
    this.cv2_max = -9999999;
    this.cv2_min = 99999999;
    this.arr2=[];
   
  }

  frequency(v:any,data:any){
    let j=1;
    this.fcount=[];
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




  //FUNCTIONS-->
  id=0;
  createAll(){
    // d3.select("#mod2").remove();
    // d3.select("#mod1")
    // .append('h5')
    // .text("S")
    // .style('text-align','center')

    this.id=0
    for(let i of this.attr){
      this.value2=i;
      this.createname(this.value2)
      for(let j of this.attr){
        this.value1=j;
        d3.select("#div-"+this.id).remove();
        d3.select("#mod1")
        .append('div')
        .attr('id', 'div-'+this.id)
        .style('border','1px solid black')

        this.createChart2(this.id,this.r_data);
        this.id++;
      }
    }
    d3.select("#div-"+this.id).remove();
    d3.select("#mod1")
    .append('div')
    .attr('id', 'div-'+this.id)
    this.id++
    for(let i of this.attr){
      this.createname(i)
    }
  }

  createname(v:any){
    d3.select("#div-"+this.id).remove();
    d3.select("#mod1")
    .append('div')
    .attr('id', 'div-'+this.id)
    //.style('border','1px solid black')


    var margin = {top: 20, right: 20, bottom: 20, left: 40},
    width = 150 - margin.left - margin.right,
    height = 80 - margin.top - margin.bottom;


    if(this.id > 19){
      // var svg = d3.select("#div-"+this.id)
      // .append("svg")
      // .attr("width", width + margin.left + margin.right)
      // .attr("height", height + margin.top + margin.bottom + 10) 
      // .append("g")
      // .attr("transform","translate(" + margin.left + "," + margin.top + ")");

      d3.select("#div-"+this.id)
      .style("text-anchor", "middle")
      .style("font-size","10px")
      .append("text")
      .text(v+" ->")
      .style("margin-left","35px")
    }
    else{
      //.style("transform", "translate(" + (0) + " ," + (45) + ")rotate(-90)")
      var svg = d3.select("#div-"+this.id)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + 10) 
      .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");
      svg.append("text")
      .attr("transform", "translate(" + (-10) + " ," + (height/2 + 8)+ ")rotate(-90)")
      .style("text-anchor", "middle")
      .style("font-size","10px")
      .text(v+" ->");
    }
   

    this.id++;
  }

  createChart(id: any,data:any){
    this.refresh();

    // this.frequency(this.value1,data);
    // this.frequency(this.value2,data);

    var margin = {top: 30, right: 30, bottom: 30, left: 60},
    width = 300 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

    var svg = d3.select("#div-"+id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 10) 
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

    // UPDATED MAX MIN VALUES
    let t1=[]
    let t2=[]
    for(let i of data){
      t1.push(Number(i[this.value1]))
      t2.push(Number(i[this.value2]))
    }
    this.cv1_min=Number(d3.min(t1))
    this.cv1_max=Number(d3.max(t1))
    this.cv2_min=Number(d3.min(t2))
    this.cv2_max=Number(d3.max(t2))
    // END MAX MIN VALUES

   var x = d3.scaleLinear()
    .domain([this.cv1_min, this.cv1_max])
    .nice()
    .range([ 0, width ])

    var xAxis = d3.axisBottom(x)
    .ticks(2);
    // .tickFormat(() => ""); // Empty function to hide tick values

    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "x-axis")
    .call(xAxis);

    // svg.append("g")
    // .attr("transform", "translate(0," + height + ")")
    // .call(d3.axisBottom(x))

    var y = d3.scaleLinear()
    .domain([this.cv2_min,this.cv2_max])
    .nice()
    .range([height,0]);

    var yAxis = d3.axisLeft(y)
    .ticks(2);
    // .tickFormat(() => ""); // Empty function to hide tick values

    svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

    //console.log(data);

    // svg.append("g")
    // .call(d3.axisLeft(y));

    svg.append("text")
    .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top) + ")")
    .style("text-anchor", "middle")
    .style("font-size","10px")
    .text(this.value1+" ->");

    svg.append("text")
    .attr("transform", "translate(" + (-40) + " ," + (height/2) + ")rotate(-90)")
    .style("text-anchor", "middle")
    .style("font-size","10px")
    .text(this.value2+" ->");


    svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx",(d:any,i:any) => {return x(d[this.value1])} )
    .attr("cy",(d:any,i:any) => {return y(d[this.value2])} )
    // .attr("cx",(d:any,i:any) => {
    //   let t= x(d[this.value1]) + Math.random()*(20) - 10; 
    //   if(t<x(this.cv1_min))
    //     return x(this.cv1_min)
    //   return t
    // } )
    // .attr("cy",(d:any)=>{
    //   let t= y(d[this.value2]) + Math.random()*(20) - 10; 
    //     if(t>y(this.cv2_min))
    //       return y(this.cv2_min)
    //     return t
    // })
    .attr("r", 1.5)
    // .style("fill",(d,i:any)=> {
    //   if(this.clusteredData[i]==0)
    //     return "skyblue"
    //   else if(this.clusteredData[i]==1)
    //     return "lightsalmon"
    //   return "lightgreen"
    // })
    .style("fill", "#69b3a2")

  }

  createChart2(id: any,data:any){
    this.refresh();

    var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 150 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

    var svg = d3.select("#div-"+id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 10) 
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

    // UPDATED MAX MIN VALUES
    let t1=[]
    let t2=[]
    for(let i of data){
      t1.push(Number(i[this.value1]))
      t2.push(Number(i[this.value2]))
    }
    this.cv1_min=Number(d3.min(t1))
    this.cv1_max=Number(d3.max(t1))
    this.cv2_min=Number(d3.min(t2))
    this.cv2_max=Number(d3.max(t2))
    // END MAX MIN VALUES

   var x = d3.scaleLinear()
    .domain([this.cv1_min, this.cv1_max])
    .nice()
    .range([ 0, width ])

    var xAxis = d3.axisBottom(x)
    .ticks(3);
  
    // svg.append("g")
    // .attr("transform", "translate(0," + height + ")")
    // .attr("class", "x-axis")
    // .call(xAxis);

    var y = d3.scaleLinear()
    .domain([this.cv2_min,this.cv2_max])
    .nice()
    .range([height,0]);

    var yAxis = d3.axisLeft(y)
    .ticks(3);



    // svg.append("g")
    // .attr("transform", "translate("+ 9 +", " + 0 + ")")
    // .attr("class", "y-axis")
    // .call(yAxis);
    const colors = ["skyblue", "lightsalmon", "red", "green", "lightgreen", "orange", "cornflowerblue", "lightcoral", "limegreen", "mediumseagreen"];


    svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx",(d:any,i:any) => {return x(d[this.value1])} )
    .attr("cy",(d:any,i:any) => {return y(d[this.value2])} )
    .attr("r", 1.5)
    //.style("fill", "#69b3a2")
    .style("fill",(d:any,i:any)=> {
      //console.log(this.clusteredData)
      let index=this.clusteredData[Number(i)]
      return colors[index]
    })

  }
}

