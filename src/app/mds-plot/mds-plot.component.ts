import { Component, ElementRef, Input, OnChanges, Self, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';
import { HttpClient } from '@angular/common/http';
import {SmatrixComponent} from '../smatrix/smatrix.component';
import { Renderer2 } from '@angular/core';
import * as d3 from 'd3';
import { animate } from '@angular/animations';

@Component({
  selector: 'app-mds-plot',
  standalone: true,
  imports: [CommonModule],
  providers: [DataService],
  templateUrl: './mds-plot.component.html',
  styleUrl: './mds-plot.component.css'
})
export class MdsPlotComponent {
  constructor(private elementRef: ElementRef,
    private http: HttpClient,
    private renderer: Renderer2,
    private dataService: DataService) { }

  ngOnInit(): void {
    if (typeof document !== 'undefined') { 
    this.getmds();
    this.loadData();
    }
  }
  cat_options=["Suburb", "CouncilArea", "SellerG", "Regionname", "Postcode", "Type", "Method", "Address", "Date"]
  num_options=["Rooms","Distance","Propertycount","Landsize","YearBuilt","Bathroom","Price","Car"]
 

  r_data:any
  isloading:any = false
  mds_svg:any
  attrline:any= []
  dimensionfix:any=[]

  dimensions:any={}
  mds_data:any=[]
  mds_data1:any=[]
  clusteredData:any
  clustered_label:any
  wcss:any
  columns:any
  kc:any = 3
  k_el:any
  sel_attributed:any=[]

  getmds(){
    this.dataService.getCluster().subscribe(
      response => {
      this.clusteredData = response.clustered_label[this.kc];
      this.clustered_label=response.clustered_label
      this.wcss = response.wcss;
      this.columns = response.columns
      this.kc = Number(response.elbow_point) - 1
      this.k_el=this.kc
      console.log(response)
      this.plotElbowMethod();
    }); 
    this.dataService.get_mds().subscribe(
      response => {
        console.log('Response from server:',response);
        this.mds_data = response.mds_data
        this.mds_data1=response.mds_data1
        // this.plotmds()
        // this.plotmds1()
        //this.plotmds1()
        
      },
      error => {
        console.error('Error:', error);
      }
    ); 
  }

  pcpreset(){
    this.dimensions = [...this.dimensionfix]
    this.plotpcp()
  }
  mdsreset(){
    this.plotmds1()
    this.sel_attributed = []
    this.attrline = []
    this.pcpreset()
  }

  loadData(): void {
    this.http.get('assets/finalHousing.csv', { responseType: 'text' })
      .subscribe(data1 => {
        const data = d3.csvParse(data1);
        this.r_data=data;
        //this.retrieve_dimensions() 
      });
    
  }

  plotmds(){
    
    d3.select("#plotmds").remove();
    d3.select("#d1")
    .append('div')
    .attr('id', 'plotmds')
    .style('border','1px solid black')
    .append('h5')
    .text("MDS Plot")
    .style('text-align','center')
    .append('div')



    // var margin = {top: 100, right: 30, bottom: 60, left: 100},
    // width = 800 - margin.left - margin.right,
    // height = 700 - margin.top - margin.bottom;

    var margin = {top: 40, right: 100, bottom: 60, left: 80},
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var svg = d3.select("#plotmds")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");

     // Add x-axis
    let min = d3.min(this.mds_data, (d: any[]) => Number(d[0]));
    let max:any = d3.max(this.mds_data, (d: any[]) => Number(d[0]));
    var x = d3.scaleLinear()
    .domain([min,max])//d3.min(this.pc1, d => d), d3.max(this.pc1, d => d)
    .nice()
    .range([ 0, width ])
  

    svg.append("g")
    .attr("transform", "translate(0," + height+ ")")
    .call(d3.axisBottom(x))

    min = d3.min(this.mds_data, (d: any[]) => Number(d[1]));
    max = d3.max(this.mds_data, (d: any[]) => Number(d[1]));
    var y = d3.scaleLinear()
    .domain([min,max])  //d3.min(this.pc2, d => d), d3.max(this.pc2, d => d)
    .nice()
    .range([height,0]);

    svg.append("g")
    .call(d3.axisLeft(y));
    

    // svg.append("text")
    // .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top) + ")")
    // .style("text-anchor", "middle")
    // .style("font-size","small")
    // .text("PC 1");
 
    // svg.append("text")
    // .attr("transform", "translate(" + (-40) + " ," + (height/2) + ")rotate(-90)")
    // .style("text-anchor", "middle")
    // .style("font-size","small")
    // .text("PC 2");
     
    //let tempclusterData=this.clusteredData;
    const colors = ["skyblue", "lightsalmon", "lightgreen", "green", "orange","red", "cornflowerblue", "lightcoral", "limegreen", "mediumseagreen"];

    // Add scatter plot points
    let tempclusterData=this.clusteredData;

    svg.selectAll('circle')
    .data(this.mds_data)
    .enter()
    .append('circle')
    .attr('cx', (d:any,i:any) => x(d[0])) // Sample x-coordinate
    .attr('cy', (d:any,i:any) => y(d[1])) // Sample y-coordinate
    .attr('r', 3)
    .style("fill",(d,i:any)=> {
      let index=tempclusterData[i]
      return colors[index]
    })


    // svg.selectAll(".loading")
    //   .data(this.loadings)
    //   .enter()
    //   .append("line")
    //   .attr("x1", x(0))
    //   .attr("y1", y(0))
    //   .attr("x2", d => x(d[p1]))
    //   .attr("y2", d => y(d[p2]))
    //   .style("stroke", "steelblue")
    //   .style("stroke-width", "1.5px");

    // svg.selectAll(".loading")
    // .data(this.loadings)
    // .enter()
    // .append("text")
    // .attr("x", d => x(d[p1])) // Position text at the x2 coordinate of the line
    // .attr("y", d => y(d[p2])) // Position text at the y2 coordinate of the line
    // .text((d:any,i:any)=> this.columns[i]) // Display text with coordinates
    // .style("font-size", "12px") // Adjust font size as needed
    // .style("fill", "black"); 
      

    console.log("cluster created")
  }



  plotmds1(){
    
    d3.select("#plotcluster").remove();
    d3.select("#d2")
    .append('div')
    .attr('id', 'plotcluster')
    .style('border','1px solid black')
    .append('h5')
    .text("MDS Attribute Plot")
    .style('text-align','center')
    .append('div')



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

    this.mds_svg = svg

     // Add x-axis
    let min = d3.min(this.mds_data1, (d: any[]) => Number(d[0]));
    let max:any = d3.max(this.mds_data1, (d: any[]) => Number(d[0]));
    var x = d3.scaleLinear()
    .domain([min,max])//d3.min(this.pc1, d => d), d3.max(this.pc1, d => d)
    .nice()
    .range([ 0, width ])
  

    svg.append("g")
    .attr("transform", "translate(0," + height+ ")")
    .call(d3.axisBottom(x))

    min = d3.min(this.mds_data1, (d: any[]) => Number(d[1]));
    max = d3.max(this.mds_data1, (d: any[]) => Number(d[1]));
    var y = d3.scaleLinear()
    .domain([min,max])  //d3.min(this.pc2, d => d), d3.max(this.pc2, d => d)
    .nice()
    .range([height,0]);

    svg.append("g")
    .call(d3.axisLeft(y));
    

    // svg.append("text")
    // .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top) + ")")
    // .style("text-anchor", "middle")
    // .style("font-size","small")
    // .text("PC ");
 
    // svg.append("text")
    // .attr("transform", "translate(" + (-40) + " ," + (height/2) + ")rotate(-90)")
    // .style("text-anchor", "middle")
    // .style("font-size","small")
    // .text("PC ");
     
    //let tempclusterData=this.clusteredData;
    const colors = ["skyblue", "lightsalmon", "lightgreen", "green", "orange","red", "cornflowerblue", "lightcoral", "limegreen", "mediumseagreen"];

    // Add scatter plot points
    let tempclusterData=this.clusteredData;
    let self=this
    
    const line:any = d3.line()
    .x((d: any) =>{ console.log(Number(d[0])); return x(d[0])}) // x-coordinate
    .y((d: any) => y(d[1]));

    svg.selectAll('circle')
    .data(this.mds_data1)
    .enter()
    .append('circle')
    .attr('cx', (d:any,i:any) => x(d[0])) // Sample x-coordinate
    .attr('cy', (d:any,i:any) => y(d[1])) // Sample y-coordinate
    .attr('r', 5)
    .text((d:any,i:any)=>this.columns[i])
    .style("fill",(d,i:any)=> {
      //let index=tempclusterData[i]
      return "lightgreen"//colors[index]
    })
    .on("click",function(d:any,i:any){
      if(d3.select(this).style("fill") == "red"){
        d3.select(this).style("fill","lightgreen")
        let ind=self.sel_attributed.indexOf(d.srcElement.innerHTML)
        self.sel_attributed.splice(ind,1)
        self.attrline.splice(ind,1)
        
      }
      else{
        d3.select(this).style("fill","red")
        self.attrline.push(i)
        self.sel_attributed.push(d.srcElement.innerHTML)
      }
      d3.selectAll("path.line").remove()
      d3.selectAll("text.line").remove()
      draw_line()
      
      // if(self.sel_attributed.length <= 1){
      //   self.dimensions = self.dimensionfix
      // }else{
      //   self.dimensions = self.sel_attributed
      // }
      for(let i in self.sel_attributed){
        console.log(i)
        let ind=self.dimensions.indexOf(self.sel_attributed[i])
        self.dimensions.splice(ind,1)
        self.dimensions.splice(i, 0, self.sel_attributed[i]);
      }
      // let ind=self.dimensions.indexOf(d.srcElement.innerHTML)
      // self.dimensions.splice(ind,1)
      // self.dimensions.splice(self.sel_attributed.length-1, 0, d.srcElement.innerHTML);
      //self.dimensions.unshift(d.srcElement.innerHTML)

      console.log(self.dimensions.length)
      self.plotpcp()
      // this.clusteredData = this.clustered_label[this.wcss.indexOf(i)]
      // this.plotClusters();
    })

  function draw_line(){
      svg.append('path')
      .datum(self.attrline)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line)
      .attr('class',"line");

      for (let i = 0; i < self.attrline.length - 1; i++) {
        svg.append('text')
            .attr('x', x((self.attrline[i][0] + self.attrline[i + 1][0]) / 2))
            .attr('y', y((self.attrline[i][1] + self.attrline[i + 1][1]) / 2))
            .attr('dx', 5)
            .attr('dy', -5)
            .text(i + 1) // Display segment number
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('fill', 'black')
            .attr('class',"line")
            .style('font-size', 10);
      }
    }
   




    svg.selectAll('text1')
    .data(this.mds_data1)
    .enter()
    .append('text')
    .attr('x', (d:any, i) => x(d[0])) // Adjust label position as needed
    .attr('y', (d:any, i) => y(d[1])) // Adjust label position as needed
    .text((d:any,i:any)=>this.columns[i]) // Label text
    .style('font-size', '10px') // Adjust font size as needed
    .attr('dx', 10) // Offset label horizontally
    .attr('dy', -5) // Offset label vertically
    


    // svg.selectAll(".loading")
    //   .data(this.loadings)
    //   .enter()
    //   .append("line")
    //   .attr("x1", x(0))
    //   .attr("y1", y(0))
    //   .attr("x2", d => x(d[p1]))
    //   .attr("y2", d => y(d[p2]))
    //   .style("stroke", "steelblue")
    //   .style("stroke-width", "1.5px");

    // svg.selectAll(".loading")
    // .data(this.loadings)
    // .enter()
    // .append("text")
    // .attr("x", d => x(d[p1])) // Position text at the x2 coordinate of the line
    // .attr("y", d => y(d[p2])) // Position text at the y2 coordinate of the line
    // .text((d:any,i:any)=> this.columns[i]) // Display text with coordinates
    // .style("font-size", "12px") // Adjust font size as needed
    // .style("fill", "black"); 
      

    console.log("cluster created")
  }

  // draw_mds1line(){

  //   let self = this

  //   const line:any = d3.line()
  //   .x((d: any) =>{ console.log(Number(d[0])); return this.mds_svg.x(d[0])}) // x-coordinate
  //   .y((d: any) => this.mds_svg.y(d[1]));

  //   this.mds_svg.append('path')
  //   .datum(self.attrline)
  //   .attr('fill', 'none')
  //   .attr('stroke', 'steelblue')
  //   .attr('stroke-width', 1.5)
  //   .attr('d', line);
  // }


 

  retrieve_dimensions(){
    console.log(this.r_data)
    this.dimensions = Object.keys(this.r_data[0]).filter(function(d: any) {  return d !== "Species"; });
    //this.dimensions.splice(3)
    let ind=this.dimensions.indexOf("Address")
    this.dimensions.splice(ind,1)
    this.dimensionfix =  [...this.dimensions]
    console.log("retrieve")
    this.plotpcp();
  }

   isdrag:any = []



  plotpcp(){

    d3.select("#plotpcp").remove();
    d3.select("#d3")
    .append('div')
    .attr('id', 'plotpcp')
    .style('border','1px solid black')
    .append('h5')
    .text("PCP")
    .style('text-align','center')
    .append('div')

    var margin = {top: 40, right: 100, bottom: 60, left: 80},
    width = 1415 - margin.left - margin.right, //1415
    height = 600 - margin.top - margin.bottom;

    var svg = d3.select("#plotpcp")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform","translate(" + margin.left + "," + margin.top + ")");
    
   let dimensionaxis:any={}
   let pd:any= {}
   let d3axis:any={}
    //let dimensions = d3.keys(this.r_data[0]).filter(function(d:any) { return d != "Species" })
    //  let dimensions = Object.keys(this.r_data[0]).filter(function(d: any) {  return d !== "Species"; });
    // console.log("dimensions"+dimensions)

     // For each dimension, I build a linear scale. I store all in a y object
  let y:any ={}
  let t_data = this.r_data

  this.isdrag = []

  

  for (let i in this.dimensions) {
    let name :any = this.dimensions[i]
    if(!this.cat_options.includes(name)){
      y[name] = d3.scaleLinear()
      .domain(d3.extent(this.r_data, function(d:any) { return +d[name]; }) as [any, any] )
      .range([height, 0])
      .nice()
    }else{
      y[name]= d3.scaleBand()
      .domain(this.r_data.map((d:any,i:any)=>{return d[name]}))
      .range([height, 0])
    }
   
  }

  // Build the X scale -> it find the best position for each Y axis
  let x = d3.scalePoint()
    .range([-30, width+100])
    .padding(1)
    .domain(this.dimensions);

  for(let i of this.dimensions){

    dimensionaxis[i]=x(i)
    pd[i]=x(i)
    this.isdrag[i] = false
  }

  let self = this

 

  function path(d: any) {
    return d3.line<any>()(
      self.dimensions.map(function(p: any) {
      return y[p].bandwidth ? [Number(dimensionaxis[p]), y[p](d[p])+ y[p].bandwidth()/2] :  [Number(dimensionaxis[p]), y[p](d[p])];
      // if (d == null || d == undefined) {
      //   return  null;
      // }
      // if (p in d && d[p] != null) {
      //     return [Number(dimensionaxis[p]), y[p](d[p])];
      // } else {
      //     return [Number(dimensionaxis[p]), y[p](0)];
      // }
      })//.filter((coord:any) => coord !== null || typeof coord === 'number')  
      
    );
  }
  
  let tempclusterData=this.clusteredData;
  const colors = ["skyblue", "lightsalmon", "lightgreen", "green", "orange","red", "cornflowerblue", "lightcoral", "limegreen", "mediumseagreen"];

 
  svg.selectAll("myPath")
    .data(t_data)
    .enter().append("path")
    .attr("d",  path)
    .style("fill", "none")// "#69b3a2"
    .style("stroke",(d,i:any)=> {
      let index=tempclusterData[i]
      return colors[index]
    })
    .style("opacity", 0.5)


  const drag:any = d3.drag<SVGGElement, any>()
  .on('drag', function(event,dimension) {
    if(self.isdrag[dimension] == false)
      return
    const newX = event.x;
    let i = self.dimensions.indexOf(dimension)
    let curr=self.dimensions[i];
    let prev=self.dimensions[i-1];
    let next=self.dimensions[i+1];
    console.log(t_data[1]["Price"])
    if(newX < pd[prev]){
      dimensionaxis[prev]=pd[curr];
      let pa1 = pd[prev]
      let pa2 = pd[curr]
      pd[prev]=pa2
      pd[curr]=pa1
      let a1= self.dimensions[i-1]
      let a2=self.dimensions[i]
      self.dimensions[i] = a1
      self.dimensions[i-1] = a2
      console.log(self.dimensions)
      d3axis[prev].attr('transform','translate('+ dimensionaxis[prev] +',' + 0 + ')');
    }
    if(newX > pd[next]){
      dimensionaxis[next]=pd[curr];
      let pa1 = pd[next]
      let pa2 = pd[curr]
      pd[next]=pa2
      pd[curr]=pa1
      let a1= self.dimensions[i+1]
      let a2=self.dimensions[i]
      self.dimensions[i] = a1
      self.dimensions[i+1] = a2
      console.log(self.dimensions)
      d3axis[next].attr('transform','translate('+ dimensionaxis[next] +',' + 0 + ')');
    }
   
    console.log(dimension)
    d3.select(this).attr('transform','translate('+ newX +',' + 0 + ')');
    dimensionaxis[dimension]=event.x
    svg.selectAll('path')
      .attr('d', function(d: any) { return path(d); });

   
   
  })
  .on('end',function(event,dimension){
    if(self.isdrag[dimension] == false)
      return
    d3.select(this).attr('transform','translate('+ pd[dimension] +',' + 0 + ')');
    dimensionaxis[dimension] = pd[dimension]
    svg.selectAll('path')
      .attr('d', function(d: any) { return path(d); });
    //self.plotpcp()
  })

  // Define the brush function
  function brushed(event:any, dimension:any) {
    self.isdrag[dimension] = false
    const selection = event.selection;
    if (!selection) return;

    // Get the range of the brushed area
    const [start, end] = selection;

    // Define a filter function based on the brushed range
    const filterFunction = function (d:any) {
        const yValue = y[dimension].bandwidth ?  y[dimension](d[dimension]) + y[dimension].bandwidth()/2 : y[dimension](d[dimension]);
        return yValue >= start && yValue <= end;
    };

    // Filter the data based on the brushed range
    const filteredData = t_data.filter(filterFunction);

    // Update the visualization to highlight the selected data points
    svg.selectAll("path:not(.domain)")
        .style("stroke", function (d:any,i:any) {
            return filteredData.includes(d) ? colors[tempclusterData[i]] : "none"; // Highlight selected data points
        })
        .style("opacity", function (d:any,i:any) {
          return filteredData.includes(d) ? 0.5 : 0; // Highlight selected data points
      })
    
  }





 

  // Draw the axis:
  svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(this.dimensions).enter()
    .append("g")
    .attr("transform", function(d:any,i:any) { return "translate(" + Number(x(d)) + ")"; })
    .each(function(d:any) { 
      d3.select(this).call(d3.axisLeft(y[d]))
      .call(brush(d))
      .call(drag)
      d3axis[d]=d3.select(this);
     })
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d:any) { return d; })
      .style("fill", "black")
      .on("mouseover",(d,i:any)=>{
        self.isdrag[i] = true
        //d3axis[i].call(drag)
        console.log(this.isdrag)
      })
      .on("mouseout",(d,i)=>{
        //self.isdrag = false
      })

    function brush(dimension:any) {
        return d3.brushY()
            .extent([[0, 0], [20, height]]) // Adjust the brush extent as needed
            .on("brush", function (event) { brushed(event, dimension); }); // Call brushed function on brush event
    }
      

  }

  plotElbowMethod() {
    d3.select("#elbow").remove();
    d3.select("#d4")
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
    let min =d3.min(this.wcss)
    let max:any= d3.max(this.wcss)
    const y = d3.scaleLinear()
      .domain([min,max])
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
      self.plotmds();
      self.plotpcp();
    })

    const line = d3.line()
    .x((d, i) => x(i + 1))
    .y((d:any)=> y(d))
    //.curve(d3.curveMonotoneX);

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
      .attr("cy", (d:any) => y(d))
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

      this.plotmds()
      this.plotmds1()
      this.retrieve_dimensions() 
      this.isloading = true
  }

}
