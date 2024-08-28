import { Component,OnInit, ElementRef, Input,OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bar',
  standalone: true,
  imports: [HttpClientModule, FormsModule, CommonModule],
  templateUrl: './bar.component.html',
  styleUrl: './bar.component.css'
})

export class BarComponent implements OnChanges{
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
  barData={};
  fcount:any={}
  finalData:any=[];
  sum=0;
  max_value=0;
  reload=true;
  z_value=this.max_value

  displayOptions(){
    this.displayMenu=!this.displayMenu;
  }
  selectOption(value:any){
    this.barOption=value;
    //this.resfresh();
    this.refresh();
  }
  bar_options=["Suburb","SellerG","CouncilArea","Regionname","Type","Method"]

  checkboxes = [
    { id: 'c1', label: 'bottom' },
    { id: 'c2', label: 'left' }
  ];

  sdata:any={
    cb1:true
  }

  a:any;
  temp:any;
  r_data:any
  
   loadData(): void {
    this.http.get('assets/finalHousing.csv', { responseType: 'text' })
      .subscribe(data1 => {
        const data = d3.csvParse(data1);
        this.barData=data; 
        this.fcount={};
        this.finalData=[];
        this.max_value=0;
        this.frequency(this.barOption,this.barData);
        console.log(this.finalData);
        this.refresh();
        this.finalData.splice(this.finalData.length-1); 
        //console.log(this.barOption);
      });
      
  }
  refresh(){
    
    d3.select("#title").remove();
    d3.select("#mod")
    .append('div')
    .attr('id', 'title')
    .style('margin','-50px')
    .style('border','1px solid black')
    .append('h5')
    .style("display","grid")
    .style("justify-items","center")
    .text("Frequency Distribution of "+ this.barOption); 

    this.fcount={};
    this.finalData=[];
    this.max_value=0;
    this.frequency(this.barOption,this.barData);
    this.finalData.splice(this.finalData.length-1); 
    this.createChart();
  }

  z_refresh(){
    d3.select("#title").remove();
    d3.select("#mod")
    .append('div')
    .attr('id', 'title')
    this.createChart();
  }

  zoomIn(){
    this.z_value-=10;
    this.z_refresh();
  }

  zoomOut(){
    this.z_value+=10;
    this.z_refresh();
  }
  
  //r_data:any;
  // Frequency function--->
    frequency(v:any,data:any){
      for(let i in data){
        if( this.fcount.hasOwnProperty(data[i][v]))
          this.fcount[data[i][v]]=this.fcount[data[i][v]]+1;
        else
        this.fcount[data[i][v]]=1;
      }
      console.log('start');
      for(let i in this.fcount){
        this.finalData.push({region:i,value:this.fcount[i]});
        this.sum+=this.fcount[i];
        this.max_value=Math.max(this.max_value,this.fcount[i])
      }
      this.z_value=this.max_value+50;
      console.log("72 line "+  this.sum)
    }
  // function end--->

  createChart(): void {
    //this.reload = false;

    console.log("again");
    console.log(this.sdata.cb1)
   
    let tdata=this.finalData;
    console.log(this.finalData);
    const margin = { top: 60, right: 60, bottom: 120, left: 160 };
    const width = 780 - margin.left - margin.right;
    const height = 650 - margin.top - margin.bottom;

    const svg = d3.select("#title")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


  if(this.sdata.cb1)
  { 
    const x = d3.scaleBand()
    .range([0, width])  // fixed 
    .domain(tdata.map(function(d:any) { return d['region'] }))
    .padding(0.4);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end")

    svg.append("text")
    .attr("transform", "translate(" + (width - 50) + " ," + (height + margin.top +30) + ")")
    .style("text-anchor", "middle")
    .text(this.barOption);
      
      
  // ------------------------------------------------------------------------------>
    const y = d3.scaleLinear()
      .domain([0, this.z_value])
      .range([height, 0]) // fixed 
    svg.append("g")
      .call(d3.axisLeft(y));

    svg.append("text")
    .attr("transform", "translate(" + (-60) + " ," + (50) + ")rotate(-90)")
    .style("text-anchor", "middle")
    .text("Frequency ->");

  // ------------------------------------------------------------------------------>

  console.log("error");
  console.log(tdata);
  svg.selectAll("rect")
    .data(tdata)
    .enter().append("rect")
    .attr("x",function(d:any):any { return x(d['region']); })
    .attr("y",function(d:any) { return y(d.value); })
    .attr("width", x.bandwidth())
    .attr("height",function(d:any) { return height - y(d.value); })
    .attr("fill", "lightgreen")
    .on("mouseover", function(d: any) {
      d3.select(this).style("fill","#6495ED")
      svg.append("text")
        .attr("class", "bar-value")
        .attr("x",Number(x(d.target.__data__.region))+ x.bandwidth() / 2)  //x(d.region) + x.bandwidth() / 2
        .attr("y", y(d.target.__data__.value) - 5) // Adjust position to place text above the bar
        .text(d.target.__data__.value)
        .style("text-anchor", "middle");
        
    })
    .on("mouseout", function() {
      d3.select(this).style("fill","lightgreen")
      svg.selectAll(".bar-value").remove();
    });
  
  }
  else{
    const y = d3.scaleBand()
    .range([0, height]) // swapped width and height
    .domain(tdata.map(function(d:any) { return d['region'] }))
    .padding(0.4);
  
    svg.append("g")
    .call(d3.axisLeft(y)) // switched from axisBottom to axisLeft
    .selectAll("text")
    .style("text-anchor", "end");
  
    svg.append("text")
    .attr("transform", "translate(" + (-140) + " ," + (80) + ")rotate(-90)")
    .style("text-anchor", "middle")
    .text(this.barOption);


  
  const x = d3.scaleLinear() // swapped scaleBand and scaleLinear
    .domain([0, this.z_value])
    .range([0, width]); // swapped range for x scale
  
  
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)); // switched from axisLeft to axisBottom
  svg.append("text")
  .attr("transform", "translate(" + (width - 50) + " ," + (height + margin.top +10) + ")")
  .style("text-anchor", "middle")
  .text("Frequency ->");
  
  svg.selectAll("rect")
    .data(tdata)
    .enter().append("rect")
    .attr("y", function(d:any):any { return y(d['region']); })  
    .attr("x", d => 0) // swapped x and y attributes
    .attr("height", y.bandwidth()) // swapped height and width
    .attr("width", function(d:any) { return x(d.value); }) // updated width calculation accordingly
    .attr("fill", "lightgreen")
    .on("mouseover", function(d: any) {
      d3.select(this).style("fill","#6495ED")
      svg.append("text")
        .attr("class", "bar-value")
        .attr("y",Number(y(d.target.__data__.region))+ y.bandwidth() / 2 + 5)  //x(d.region) + x.bandwidth() / 2
        .attr("x", x(d.target.__data__.value) + 20) // Adjust position to place text above the bar
        .text(d.target.__data__.value)
        .style("text-anchor", "middle");
    })
    .on("mouseout", function() {
      d3.select(this).style("fill","lightgreen")
      svg.selectAll(".bar-value").remove();
    });
  } 
  this.reload = true;
  }
}
