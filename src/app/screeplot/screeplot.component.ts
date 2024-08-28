import { Component, ElementRef, Input, OnChanges, Self, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';
import { HttpClient } from '@angular/common/http';
import {SmatrixComponent} from '../smatrix/smatrix.component';
import { Renderer2 } from '@angular/core';
import * as d3 from 'd3';
import { rmSync } from 'fs';
import { animate } from '@angular/animations';

@Component({
  selector: 'app-screeplot',
  standalone: true,
  imports: [SmatrixComponent, CommonModule],
  providers: [DataService],
  templateUrl: './screeplot.component.html',
  styleUrl: './screeplot.component.css'
})
export class ScreeplotComponent {

  constructor(private elementRef: ElementRef,
    private http: HttpClient,
    private renderer: Renderer2,
    private dataService: DataService) { }
    
    private chartContainer: ElementRef | undefined;

    loading = false

    ngOnInit(): void {
      if (typeof document !== 'undefined') { 
      this.sendData();
      this.loadData();
      }
    }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['eigenvalues'] && !changes['eigenvalues'].firstChange) {
  //     //this.sendData();
  //     //this.drawScreePlot();
  //   }
  // }

  eigenvalues:any={}
  pc:any=[];
  di:any=4
  clustered_label=[]
  loadings=[]
  kc:any = 2
  columns:any=[]
  s_el:any
  k_el:any
  p1:any = 0
  p2:any = 1
  r_data:any

  loadData(): void {
    this.http.get('assets/updated.csv', { responseType: 'text' })
      .subscribe(data1 => {
        const data = d3.csvParse(data1);
        this.r_data=data;
        //this.plotMds(); 
      });
  }

  sendData(){
    this.dataService.sendData("a").subscribe(
      response => {
        console.log('Response from server:',response);
        this.eigenvalues=(response.variance);
        this.pc=response.X_pca;
        //this.di= response.elbow_point - 1
        this.s_el=response.elbow_point - 1
        this.loadings=response.loadings
        this.get_table(this.di)
        this.drawScreePlot();
      },
      error => {
        console.error('Error:', error);
      }
    );
    this.dataService.getCluster().subscribe(
      response => {
      this.clusteredData = response.clustered_label[this.kc];
      this.clustered_label=response.clustered_label
      this.wcss = response.wcss;
      this.columns = response.columns
      this.kc = Number(response.elbow_point) - 1
      this.k_el=this.kc
      console.log(response)
      this.plotClusters(0,1);
      this.plotElbowMethod();
    });  
  }
  top_attr=[]
  attr_values:any

  get_table(di:any){
    this.dataService.send_di(di+1).subscribe(
      response=>{
        this.top_attr = response.attributes
        this.attr_values = response.attr_values
        console.log("get_table: " +response)
      }
    )
  }



  drawScreePlot(): void {

    d3.select("#title").remove();
    d3.select("#mod")
    .append('div')
    .attr('id', 'title')
    .style('border','1px solid black')
    .append('h5')
    .text("Scree Plot")
    .style('text-align','center')
    

    console.log("hello")


    var margin = {top: 40, right: 100, bottom: 60, left: 80},
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;


    var svg = d3.select("#title")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");
    
    var x = d3.scaleBand()
    .domain(this.eigenvalues.map((d:any,i:any)=>{return "pc"+(i+1)})) //"PC "+ (i+1);
    .range([0, width])
    .padding(0.4)
      

    let max=0;
    var y = d3.scaleLinear()
    .domain([0, 1])
    .nice()
    .range([height, 0]);

    svg.selectAll('*').remove();

    svg.append("g")
    .call(d3.axisLeft(y));

    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")

    svg.append("text")
    .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top) + ")")
    .style("text-anchor", "middle")
    .style("font-size","small")
    .text("Principal Components");

    svg.append("text")
    .attr("transform", "translate(" + (-40) + " ," + (height/2) + ")rotate(-90)")
    .style("text-anchor", "middle")
    .style("font-size","small")
    .text("Explained Variance");

    let cumsum=0;
    


    let temp=this.eigenvalues;
    let self = this
    let prev: d3.Selection<SVGRectElement, unknown, null, undefined>;
    let prev1: d3.Selection<SVGCircleElement, unknown, null, undefined>;
    let prev2: d3.Selection<SVGCircleElement, unknown, null, undefined>;
    let col:any =null
    // let p1:any=null
    // let p2:any=null

    svg.append('g')
    .selectAll("rect")
    .data(this.eigenvalues)
    .enter()
    .append("rect")
    .attr("x",(d:any,i:any):any => { return  x("pc"+(i+1))} ) 
    .attr("y",(d:any) => { return  y(d)})
    .attr("width",x.bandwidth())
    .attr("height",(d:any,i)=> {return height - y(d)})
    .style("fill",function(d:any,i:any){
      if(i==self.di){
        col = d
        prev= d3.select(this); 
        return "lightsalmon"
      } 
      return "lightgreen"
    })
    .on("mouseover", function(d: any) {
      var tx=+d3.select(this).attr("x");
      var ty=+d3.select(this).attr("y");
      d3.select(this).style("fill","#6495ED")
      svg.append("text")
      .attr("class", "bar-value")
      .attr("x", tx)  //x(d.region) + x.bandwidth() / 2
      .attr("y", ty - 10) // Adjust position to place text above the bar
      .text(d.target.__data__)
      .style("text-anchor", "middle");   
    })
    .on("mouseout", function(d:any,i:any) {
      if(i == col)
        d3.select(this).style("fill","lightsalmon")
      else
        d3.select(this).style("fill","lightgreen")
      svg.selectAll(".bar-value").remove();
    })
    .on("click",function(d:any,i:any){
      if(prev != null)
        prev.style("fill","lightgreen")
      col = i
      prev = d3.select(this).style("fill","lightsalmon")
      self.di=self.eigenvalues.indexOf(i)
      self.get_table(self.di)
    });

    const line = d3.line()
    .x((d:any,i:any) => { return  Number(x("pc"+(i+1))) + x.bandwidth() / 2 }) //x("PC "+ (i+1)) 
    .y((d: any) => y(cumsum+=d) );

    svg.append('path')
    .datum(this.eigenvalues)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', line);

    cumsum=0;

    svg.selectAll("myCircles")
    .data(this.eigenvalues)
    .enter()
    .append("circle")
      .attr("fill", "black")
      .attr("stroke", "none")
      .attr("cx", (d:any,i:any) => {  return  Number(x("pc"+(i+1))) + x.bandwidth() / 2})
      .attr("cy", (d:any) => { return y(cumsum+=d) })
      .attr("r", (d,i:any)=>{
        if(this.s_el == i)
          return 7
        return 4
      })
      .on("mouseover", function(d: any) {
        // const cx = +d3.select(this).attr("cx");
        // const cy = +d3.select(this).attr("cy");
        // console.log(d)
        // d3.select(this).style("fill","#6495ED")
        // svg.append("text")
        // .attr("class", "k-1")
        // .attr("x",cx-5)  
        // .attr("y",cy-10)
        // .text(d.target.__data__)
        // .style("text-anchor", "middle");
          
      })
      .on("mouseout", function() {
        // d3.select(this).style("fill","brown")
        // svg.selectAll(".k-1").remove();
      })
      .on("click",function(d:any,i:any){
        if((prev1 != null && prev1.style("fill")=="red") && (prev2 != null && prev2.style("fill")=="red") ){ //|| (prev1.style("fill")=="red" && prev2.style("fill")=="red")
          prev1.style("fill","black")
          prev2.style("fill","black")
          console.log(i)
        }
        if(prev1 == null || prev1.style("fill")=="black" ){
          self.p1 = self.eigenvalues.indexOf(i)
          prev1 = d3.select(this)
        }
        else if(prev2 == null || prev2.style("fill")=="black"){
          self.p2 = self.eigenvalues.indexOf(i)
          prev2 = d3.select(this)
          self.plotClusters(self.p1,self.p2)
          // prev1.style("fill","black")
          // prev2.style("fill","black")
        }
        d3.select(this).style("fill","red")
        // this.clusteredData = this.clustered_label[this.wcss.indexOf(i)]
        // this.plotClusters();
      })

  }


  //ON----------->
  pc1:any[]=[];
  pc2:any[]=[];
  cal_pc(){
    this.pc1=[]
    this.pc2=[]
    for(let i of this.pc){
      this.pc1.push(i[this.p1]);
      this.pc2.push(i[this.p2]);
    }
    //console.log(this.pc1)
  }

  clusteredData: any[] = [];
  wcss: any[]=[];

  plotClusters(p1:any,p2:any) {

    d3.select("#plotcluster").remove();
    d3.select("#d2")
    .append('div')
    .attr('id', 'plotcluster')
    .style('border','1px solid black')
    .append('h5')
    .text("Bi Plot")
    .style('text-align','center')
    .append('div')

    this.cal_pc()

    // var margin = {top: 100, right: 30, bottom: 60, left: 100},
    // width = 800 - margin.left - margin.right,
    // height = 700 - margin.top - margin.bottom;

    var margin = {top: 40, right: 100, bottom: 60, left: 80},
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var svg = d3.select("#plotcluster")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

     // Add x-axis
     //d3.min(this.pc1, d => d)
    var x = d3.scaleLinear()
    .domain([-1,1]) //d3.min(this.pc1, d => d), d3.max(this.pc1, d => d)
    .nice()
    .range([ 0, width ])
  

    svg.append("g")
    .attr("transform", "translate(0," + height/2+ ")")
    .call(d3.axisBottom(x))

    

    var y = d3.scaleLinear()
    .domain([-1,1])  //d3.min(this.pc2, d => d), d3.max(this.pc2, d => d)
    .nice()
    .range([height,0]);

    svg.append("g")
    .attr("transform", "translate(" + width/2 + ",0)")
    .call(d3.axisLeft(y));
    

    svg.append("text")
    .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top) + ")")
    .style("text-anchor", "middle")
    .style("font-size","small")
    .text("PC "+ (p1+1));
 
    svg.append("text")
    .attr("transform", "translate(" + (-40) + " ," + (height/2) + ")rotate(-90)")
    .style("text-anchor", "middle")
    .style("font-size","small")
    .text("PC "+(p2+1));
     
    let tempclusterData=this.clusteredData;
    const colors = ["skyblue", "lightsalmon", "red", "green", "lightgreen", "orange", "cornflowerblue", "lightcoral", "limegreen", "mediumseagreen"];

    // Add scatter plot points
    svg.selectAll('circle')
    .data(this.pc)
    .enter()
    .append('circle')
    .attr('cx', (d:any,i:any) => x(this.pc1[i])) // Sample x-coordinate
    .attr('cy', (d:any,i:any) => y(this.pc2[i])) // Sample y-coordinate
    .attr('r', 3)
    .style("fill",(d,i:any)=> {
      let index=tempclusterData[i]
      return colors[index]
    })

    // const line = d3.line()
    // .x((d:any,i:any) => { return x(d[0]) }) 
    // .y((d:any,i:any) => {return y(d[1]) });

    // svg.append('line')
    // .datum(this.loadings)
    // .attr('fill', 'none')
    // .attr('stroke', 'steelblue')
    // .attr('stroke-width', 1.5)
    // .attr('d', line);

    svg.selectAll(".loading")
      .data(this.loadings)
      .enter()
      .append("line")
      .attr("x1", x(0))
      .attr("y1", y(0))
      .attr("x2", d => x(d[p1]))
      .attr("y2", d => y(d[p2]))
      .style("stroke", "steelblue")
      .style("stroke-width", "1.5px");

    svg.selectAll(".loading")
    .data(this.loadings)
    .enter()
    .append("text")
    .attr("x", d => x(d[p1])) // Position text at the x2 coordinate of the line
    .attr("y", d => y(d[p2])) // Position text at the y2 coordinate of the line
    .text((d:any,i:any)=> this.columns[i]) // Display text with coordinates
    .style("font-size", "12px") // Adjust font size as needed
    .style("fill", "black"); 
      

    console.log("cluster created")
    
  }

  plotElbowMethod() {
    d3.select("#elbow").remove();
    d3.select("#d1")
    .append('div')
    .attr('id', 'elbow')
    .style('border','1px solid black')
    .append('h5')
    .text("k-means MSE plot")
    .style('text-align','center')

    var margin = {top: 40, right: 100, bottom: 60, left: 80},
    width = 700 - margin.left - margin.right,
    height = 523 - margin.top - margin.bottom;
    // var margin = {top:20, right: 20, bottom: 40, left: 40},
    // width = 650 - margin.left - margin.right,
    // height = 450 - margin.top - margin.bottom;

    var svg = d3.select("#elbow")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

    // Add line chart for elbow method
    const x = d3.scaleLinear()
      .domain([0, this.wcss.length])
      .nice()
      .range([0,width]);

    const y = d3.scaleLinear()
      .domain([d3.min(this.wcss), d3.max(this.wcss)])
      .nice()
      .range([height,0]);

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(this.wcss.length));

    // Add y-axis
    svg.append('g')
      .call(d3.axisLeft(y));


    svg.append("text")
    .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top) + ")")
    .style("text-anchor", "middle")
    .style("font-size","small")
    .text("No Of Clusters (K)");

    svg.append("text")
    .attr("transform", "translate(" + (-55) + " ," + (height/2) + ")rotate(-90)")
    .style("text-anchor", "middle")
    .style("font-size","small")
    .text("MSE");

    let self = this
    let prev: d3.Selection<SVGRectElement, unknown, null, undefined>;
    let present_color: any = null;

    svg.append('g')
    .selectAll("rect")
    .data(this.wcss)
    .enter()
    .append("rect")
    .attr("x",(d:any,i:any):any => x(i+1) - 10) 
    .attr("y",(d:any) => y(d))
    .attr("width",20)
    .attr("height",(d:any,i)=> {return height - y(d)})
    .style("fill",function(d:any,i:any){
      if(i==self.kc){
        present_color = d
        prev= d3.select(this); 
        return "lightsalmon"
      } 
      return "lightgreen"
      })
    .on("mouseover", function(d: any) {
      var tx=+d3.select(this).attr("x");
      var ty=+d3.select(this).attr("y");
      //if(d3.select(this).style("fill") !== "lightsalmon") {
        d3.select(this).style("fill","#6495ED")
      //}
      svg.append("text")
      .attr("class", "bar-value")
      .attr("x", tx) 
      .attr("y", ty - 10)
      .text(d.target.__data__)
      .style("text-anchor", "middle");   
    })
    .on("mouseout", function(d:any,i:any) {
      svg.selectAll(".bar-value").remove();
      if(present_color === i) {
        d3.select(this).style("fill","lightsalmon")
      }
      else{
        d3.select(this).style("fill","lightgreen")
      }
    })
    .on("click",function(this,d:any,i:any){
      if(prev!=null)
        prev.style("fill","lightgreen")
      present_color=i
      prev=d3.select(this)
      d3.select(this).style("fill","lightsalmon")
      console.log(i)
      self.clusteredData = self.clustered_label[self.wcss.indexOf(i)]
      self.kc=self.wcss.indexOf(i)
      self.plotClusters(self.p1,self.p2);
    })

    const line = d3.line()
    .x((d, i) => x(i + 1))
    .y((d:any)=> y(d))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(this.wcss)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2)
    .attr('d', line);




    let tempwcss =this.wcss
    

    svg.selectAll("myCircles")
    .data(this.wcss)
    .enter()
    .append("circle")
      .attr("fill", "black")
      .attr("stroke", "none")
      .attr("cx", (d,i) => x(i+1))
      .attr("cy", (d) => y(d))
      .attr("r", (d,i:any)=>{
        if(this.k_el == i)
          return 5
        return 2
      })
    //   .on("mouseover", function(d: any) {
    //     const cx = +d3.select(this).attr("cx");
    //     const cy = +d3.select(this).attr("cy");
    //     console.log(d)
    //     d3.select(this).style("fill","#6495ED")
    //     svg.append("text")
    //     .attr("class", "k-1")
    //     .attr("x",cx-5)  
    //     .attr("y",cy-10) 
    //     .text(d.target.__data__)
    //     .style("text-anchor", "middle");
          
    //   })
    //   .on("mouseout", function() {
    //     d3.select(this).style("fill","brown")
    //     svg.selectAll(".k-1").remove();
    //   })
    //   .on("click",(d:any,i:any)=>{
    //     console.log(i)
    //     this.clusteredData = this.clustered_label[this.wcss.indexOf(i)]
    //     this.plotClusters(self.p1,self.p2);
    //   })


  }
  dimensions:any
 
  plotMds(){
    d3.select("#plotmds").remove();
    d3.select("#d3")
    .append('div')
    .attr('id', 'plotmds')
    .style('border','1px solid black')
    .append('h5')
    .text("MDS")
    .style('text-align','center')
    .append('div')

    var margin = {top: 40, right: 100, bottom: 60, left: 80},
    width = 1500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var svg = d3.select("#plotmds")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform","translate(" + margin.left + "," + margin.top + ")");
    

    //let dimensions = d3.keys(this.r_data[0]).filter(function(d:any) { return d != "Species" })
    let dimensions = Object.keys(this.r_data[0]).filter(function(d: any) { return d !== "Species"; });
    console.log("dimensions"+dimensions)

     // For each dimension, I build a linear scale. I store all in a y object
  let y:any ={}
  let t_data = this.r_data

  for (let i in dimensions) {
    let name :any = dimensions[i]
    y[name] = d3.scaleLinear()
    .domain(d3.extent(this.r_data, function(d:any) { return +d[name]; }) as [any, any] )
    .range([height, 0])
  }

  // Build the X scale -> it find the best position for each Y axis
  let x = d3.scalePoint()
    .range([0, width])
    .padding(1)
    .domain(dimensions);

  function path(d: any) {
    return d3.line<any>()(
      dimensions.map(function(p: any) {
        return [x(p), y[p](d[p])]; // Handle possible undefined values
      })
    );
  }

  // const drag:any = d3.drag()
  // .on('drag', function(dimension) {
  //   const newY = d3.event.y;
  //   y[dimension].range([newY, newY - height]);
  //   svg.selectAll('path')
  //     .attr('d', function(d: any) { return path(d); });
  //   d3.select(this).attr('transform', 'translate(0,' + newY + ')');
  // });

  const drag:any = d3.drag()
  .on('drag', function(dimension) {
    const mouseCoordinates = d3.pointer(this); // Get mouse coordinates relative to the SVG element
    const newY = mouseCoordinates[1];
    y[dimension].range([newY, newY - height]);
    svg.selectAll('path')
      .attr('d', function(d: any) { return path(d); });
    d3.select(this).attr('transform', 'translate(0,' + newY + ')');
  });

  svg.selectAll("myPath")
    .data(t_data)
    .enter().append("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.5)

    svg.selectAll('.myAxis')
  // For each dimension of the dataset I add a 'g' element:
  .data(dimensions)
  .enter()
  .append('g')
  .attr('class', 'myAxis')
  .attr('transform', function(d) { return 'translate(' + x(d) + ')'; })
  // And I build the axis with the call function
  .each(function(d) {
    d3.select(this)
      .call(d3.axisLeft(y[d]))
      .call(drag, d);
  })
  // Add axis title
  .append('text')
  .style('text-anchor', 'middle')
  .attr('y', -9)
  .text(function(d) { return d; })
  .style('fill', 'black');

  // Draw the axis:
  // svg.selectAll("myAxis")
  //   // For each dimension of the dataset I add a 'g' element:
  //   .data(dimensions).enter()
  //   .append("g")
  //   .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
  //   // And I build the axis with the call function
  //   .each(function(d) { d3.select(this).call(d3.axisLeft(y[d])); })
  //   // Add axis title
  //   .append("text")
  //     .style("text-anchor", "middle")
  //     .attr("y", -9)
  //     .text(function(d) { return d; })
  //     .style("fill", "black")



  }

  plotMds1(){
    d3.select("#plotmds").remove();
    d3.select("#d3")
    .append('div')
    .attr('id', 'plotmds')
    .style('border','1px solid black')
    .append('h5')
    .text("MDS")
    .style('text-align','center')
    .append('div')

    var margin = {top: 40, right: 100, bottom: 60, left: 80},
    width = 1500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var svg = d3.select("#plotmds")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform","translate(" + margin.left + "," + margin.top + ")");
    

    //let dimensions = d3.keys(this.r_data[0]).filter(function(d:any) { return d != "Species" })
    let dimensions = Object.keys(this.r_data[0]).filter(function(d: any) { return d !== "Species"; });
    console.log("dimensions"+dimensions)

     // For each dimension, I build a linear scale. I store all in a y object
  let y:any ={}
  let t_data = this.r_data

  for (let i in dimensions) {
    let name :any = dimensions[i]
    y[name] = d3.scaleLinear()
    .domain(d3.extent(this.r_data, function(d:any) { return +d[name]; }) as [any, any] )
    .range([height, 0])
  }

  // Build the X scale -> it find the best position for each Y axis
  let x = d3.scalePoint()
    .range([0, width])
    .padding(1)
    .domain(dimensions);

  function path(d: any) {
    return d3.line<any>()(
      dimensions.map(function(p: any) {
        return [x(p), y[p](d[p])]; // Handle possible undefined values
      })
    );
  }

  svg.selectAll("myPath")
    .data(t_data)
    .enter().append("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.5)

  // Draw the axis:
  svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft(y[d])); })
    // Add axis title
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; })
      .style("fill", "black")



  }




}
