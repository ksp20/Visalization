import { Component, ElementRef, Input, OnChanges, Self, SimpleChanges,AfterViewInit,ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';
import { HttpClient } from '@angular/common/http';
import { Renderer2 } from '@angular/core';
//import * as L from 'leaflet';
import * as d3 from 'd3';
import { rmSync } from 'fs';
import { animate } from '@angular/animations';
import { relative } from 'path';
import type * as L from 'leaflet';
import * as fc from 'd3fc'
import { select, transition } from 'd3';
// import {Legend, Swatches} from '@d3/color-legend'

let leafletModule: any;


@Component({
  selector: 'app-vizproj',
  standalone: true,
  imports: [CommonModule],
  providers: [DataService],
  templateUrl: './vizproj.component.html',
  styleUrl: './vizproj.component.css'
})
export class VizprojComponent implements AfterViewInit {
   // @ViewChild('tooltip', { static: false }) tooltipDiv!: ElementRef;
  
  constructor(private elementRef: ElementRef,
    private http: HttpClient,
    private renderer: Renderer2,
    private dataService: DataService) { }

    ngOnInit(): void {
      if (typeof document !== 'undefined') { 
        //this.loadData();
        //this.initMap();
      }
    }
    ngAfterViewInit(): void {
        if (typeof document !== 'undefined' ) { 
            // Promise.all([this.loadData()])&& this.tooltipDiv && this.tooltipDiv.nativeElement
            // .then(() => this.initMap()) // Bind this.initMap to the current instance
            // .catch((error) => {
            //   console.error('Error loading data:', error);
            //   // Handle error if necessary
            // });
            this.loadData();
            //this.initMap()
          }
      }
    
    r_data:any={}
    geo_data:any={}
    geo_data2:any={}
    mapdata :any={}
    isdrag: any=[]
    continents_list:any =  ['Asia','Europe',"South America","North America","Africa","Oceania"];
    dimensions:any=["Continent","Land area","Population","Population growth","GDP","GDP per capita","Income Group","Industry","Life expectancy","Birth rate","Death rate","PM2.5",]
    cat_options:any=["Continent","Industry","Income Group"]
    asia_map:any={}
    geo_id:any={}
    scatter_brushed:any
    pcp_brushed:any
    sp_options:any=["Birth rate","GDP per capita"]
    displayMenu:any = false;
    selectedColumn:any="Continent"
    filtered_data:any=[]
    radar_data:any=[]
    radial_data:any=[]
    geoJsonLayer:any;
    scatter_data:any
    pcp_data:any;
    oceanGeoJson:any={}
    leaf:any
    centers:any = {
        World: { coords: [30, 31], zoom: 1 },
        Europe: { coords: [50.85045, 4.34878], zoom: 3.5 },
        "North America": { coords: [54.526, -105.2551], zoom: 2 },
        "South America": { coords: [-8.7832, -55.4915], zoom: 2 },
        Asia: { coords: [52.483333, 96.085833], zoom: 2 },
        Africa: { coords: [-8.7832, 34.5085], zoom: 2 },
        Australia: { coords: [-23.116667, 132.133333], zoom: 3.5 },
      };

    private map:any;

    private initMap(): void {
        if (typeof window !== 'undefined') {
            // Dynamically import Leaflet when running in the browser
            import('leaflet').then((LModule) => {
              leafletModule = LModule; 
              this.leaf = leafletModule
              if (leafletModule) {
                this.map = leafletModule.map('map',{attributionControl:false}).setView([30, 31], 1);
              
                  const tiles = leafletModule.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 18,
                    minZoom: 1,
                    //attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    
                  });
                  tiles.addTo(this.map);
                  this.updateMap(this.geo_data,this.mapdata,"Population")

                // const map = leafletModule.map('map').setView([39.8282, -98.5795], 3);
                // leafletModule.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                //   attribution: '&copy; OpenStreetMap contributors'
                // }).addTo(map);
              }
            });
        }
        
    }


    loadData(): void {
      this.http.get<any>('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        .subscribe(data1 =>{
          this.geo_data = data1

           this.http.get('assets/oceans.json', { responseType: 'text' }) //final_updated_wip
            .subscribe(data => {
              this.oceanGeoJson = data
          })
        
        this.http.get('assets/Final_Dataset.csv', { responseType: 'text' }) //final_updated_wip
            .subscribe(data1 => {
            const data = d3.csvParse(data1);
            this.r_data=data;
            for(let i of this.r_data){
                i['Industry']=i['Industry'].split(' ')[0]
                i['Income Group']=i['Income Group'].split(' ')[0]
            }
            //console.log(d3.geoBounds(this.geo_data))
            this.filtered_data = this.r_data
            this.scatter_data=this.r_data
            this.pcp_data=this.r_data
            this.radial_data=this.r_data
            for(let d of this.r_data){
                this.mapdata[d['Country Code']] = d['Population']
                this.asia_map[d['Country Code']]= d['Continent']
                this.geo_id[d['Country Code']]= d['Country']
            }
            this.drawMap(this.geo_data, "Population");
            this.drawScatterplot();
            //this.drawBarchart();
            //this.updateMap(this.geo_data,this.mapdata,"Population")
            this.drawRadialChart("Continent")
            this.drawRadar()
            this.plotpcp()
            //this.initMap()
            //this.retrieve_dimensions() 
            });
            this.http.get('assets/continents.json', { responseType: 'text' }) //final_updated_wip
            .subscribe(data1 => {
            //const data = d3.csvParse(data1);
            this.geo_data2 = data1
            //   console.log(this.geo_data2.features)
            //   this.testMap(this.geo_data2);
            });
        })
      
    }

    drawScatterplot() {

      d3.select("#scatterplot").remove();
      d3.select("#d1")
      .append('div')
      .attr('id', 'scatterplot')
      //.style('border','1px solid black')
      .append('h6')
      .text("Scatterplot")
      .style('text-align','center')
      .style('border-radius',10)
      .append('div')
        // console.log("original data: ")
        // console.log(this.r_data)
      let sdata=this.filtered_data
      let tempdata:any = this.filtered_data
      //console.log(tempdata)
      let xd:any = []
      let yd:any = []
      let self:any = this
      let xlabel =this.sp_options[0]
      let ylabel =this.sp_options[1]
      let xmin:any;
      let ymin:any;
      //console.log(xlabel+" "+ylabel)
      if(tempdata.length <= 1){
        tempdata = this.r_data
      }
      for(let i of tempdata){
        if(this.cat_options.includes(xlabel))
            xd.push(i[xlabel])
        else
            xd.push(Number(i[xlabel]))
        if(this.cat_options.includes(ylabel))
            yd.push(i[ylabel])
        else
            yd.push(Number(i[ylabel]))
      }
      tempdata = this.filtered_data
  
      var margin = {top: 20, right: 30, bottom: 80, left: 100},
      width = 400 - margin.left - margin.right,
      height = 350 - margin.top - margin.bottom;
    //   width = 400 - margin.left - margin.right,
    //   height = 350 - margin.top - margin.bottom;
  
      var svg = d3.select("#scatterplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");
  
       // Add x-axis
       var x:any;
       var y:any;
  
    //    x = d3.scaleLinear()
    //   .domain([Number(d3.min(xd)),Number(d3.max(xd))]) 
    //   .range([ 0, width ])
    
  
    //   svg.append("g")
    //   .attr("transform", "translate(0," + height+ ")")
    //   .call(d3.axisBottom(x))
  
      
     
    //    y = d3.scaleLinear()
    //   .domain([Number(d3.min(yd)),Number(d3.max(yd))])  
    //   .nice()
    //   .range([height,0]);
  
    //   svg.append("g")
    //   .call(d3.axisLeft(y));

      //----------------------------------------------------------------------
      const formatMillions:any = d3.format(".2s");
      if(!this.cat_options.includes(xlabel)){
        xmin = Number(d3.min(xd))
        x = d3.scaleLinear()
        .domain([Number(d3.min(xd)),Number(d3.max(xd))]) //d3.min(this.pc1, d => d), d3.max(this.pc1, d => d)
        .nice()
        .range([ 0, width ])
        
        // Format to show "M" for millions

        console.log(formatMillions(1500000));
        svg.append("g")
        .attr("transform", "translate(0," + height+ ")")
        .call(d3.axisBottom(x).tickFormat(formatMillions)) 
        
      }
      else{
        x=d3.scaleBand()
        .domain(xd.map((d:any)=>{ return d}))
        .range([ 0, width ])
        .padding(1);
  
        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end")
      }
  
    //   svg.append("text")
    //   .attr("transform", "translate(" + (width - 180) + " ," + (height + margin.top + 20) + ")")
    //   .style("text-anchor", "middle")
    //   .style("font-size","small")
    //   .text(this.value1+" ->");
      
  
      if(!this.cat_options.includes(ylabel)){
        ymin = Number(d3.min(yd))
        y = d3.scaleLinear()
        .domain([Number(d3.min(yd)),Number(d3.max(yd))])  //d3.min(this.pc2, d => d), d3.max(this.pc2, d => d)
        .nice()
        .range([height,0]);
    
        svg.append("g")
        .call(d3.axisLeft(y).tickFormat(formatMillions));
      }
      else{
        y=d3.scaleBand()
        .domain(yd.map((d:any)=>{ return d}))
        .range([height,0])
        .padding(1)
        
        svg.append("g")
        .call(d3.axisLeft(y));
      }
    

      //----------------------------------------------------------------------
      
  
      svg.append("text")
      .attr("transform", "translate(" + (width/2 - 10) + " ," + (height + margin.bottom - 15) + ")")
      .style("text-anchor", "middle")
      .style("font-size","small")
      .style("fill", "black") // Set text color to black
      .text(xlabel);
   
      svg.append("text")
      .attr("transform", "translate(" + (-70) + " ," + (height/2) + ")rotate(-90)")
      .style("text-anchor", "middle")
      .style("font-size","small")
      .style("fill", "black") // Set text color to black 
      .text(ylabel);

        //   var color = d3.scaleOrdinal()
        //   .domain(["setosa", "versicolor", "virginica" ])
        //   .range([ "#440154ff", "#21908dff", "#fde725ff"])
       
      const colors = ["skyblue", "lightsalmon", "red", "green", "lightgreen", "orange", "cornflowerblue", "lightcoral", "limegreen", "mediumseagreen"];
  
      // Add scatter plot points
      var myCircle = svg.selectAll('circle')
      .data(this.filtered_data)
      .enter()
      .append('circle')
      .attr('cx', (d:any,i:any) =>{ 
            return x(d[xlabel])
        }) 
      .attr('cy', (d:any,i:any) =>{
            return y(d[ylabel])
      }) // Sample y-coordinate
      .attr('r', 3)
      .style("opacity", 0.5)
      .style("fill",(d:any):any=> {
        //d3.rgb(105, 179, 162)
        return "green"
      })
      .on("mouseover",(event:any)=>{
        console.log("mouse")
      })
    //   .on("click",()=>{
    //     console.log("clicked")
    //     this.zoomTo(this.selectedColumn)
    // })

      //console.log(myCircle)
      const updateChart = (event:any) => {
        this.scatter_brushed = true
        const extent = event.selection
        if (!extent) return;
        let brushedData:any = [];
        myCircle.style("opacity", function(d: any) {
            const isSelected = isBrushed(extent, x(d[xlabel]), y(d[ylabel]));
            if (isSelected) { 
            brushedData.push(d); // Store the data point if it's within the brush
            return 1;
            }
            return 0.5;
        })
        //myCircle.attr("id","scatterbrushed");
        self.filtered_data = brushedData
        updatePlots();
    }

      svg.call( d3.brush()                 // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("start brush",updateChart) // Each time the brush selection changes, trigger the 'updateChart' function
        .on("end",()=>{
            //if(this.filtered_data.length == 0)
            console.log("edn tens")
            //this.filtered_data = this.r_data
            //updatePlots()
            //this.zoomTo(this.selectedColumn)
          })
    )

    const updatePlots = () =>{
        if(this.filtered_data.length == 0){
            this.filtered_data = this.scatter_data
        }
        if(self.selectedColumn == 'Continent'){
            this.drawMap(this.geo_data,'Population')
        }
        else{
            this.drawMap(this.geo_data,this.selectedColumn)
        }
        self.drawRadialChart("abc")
        if(!this.pcp_brushed)
            self.plotpcp()
    }
      
    
        // Function that is triggered when brushing is performed
       
    

        function isBrushed(brush_coords:any, cx:any, cy:any) {
            var x0 = brush_coords[0][0],
                x1 = brush_coords[1][0],
                y0 = brush_coords[0][1],
                y1 = brush_coords[1][1];
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;    // This return TRUE or FALSE depending on if the points is in the selected area
        }

    }

    drawBarchart(): void {
      d3.select("#title").remove();
      d3.select("#d2")
      .append('div')
      .attr('id', 'title')
      .style('border','1px solid black')
      .append('h6')
      .text("BarChart")
      .style('text-align','center')
  
      var margin = {top: 20, right: 30, bottom: 60, left: 80},
      width = 400 - margin.left - margin.right,
      height = 350 - margin.top - margin.bottom;

      let xlabel = "Continent"
      let tempdata =this.r_data
      let xcount:any ={}
      let xvalues = []
      for(let i of tempdata){
        if (!xcount.hasOwnProperty(i[xlabel])) {
          xcount[i[xlabel]] = 1;
          xvalues.push(i[xlabel])
        } else {
          xcount[i[xlabel]]++; 
        }
      }
      console.log(xcount)
  
  
      var svg = d3.select("#title")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");
      
      
      var x = d3.scaleBand()
      .domain(tempdata.map((d:any,i:any)=>{return d[xlabel]})) //"PC "+ (i+1); tempdata.map((d:any,i:any)=>{return d[xlabel]})
      .range([0, width])
      .padding(0.4)
        
      let max=0;
      var y = d3.scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height, 0]);
  
      svg.append("g")
      .call(d3.axisLeft(y));
  
      svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
  
      svg.append("text")
      .attr("transform", "translate(" + (width/2) + " ," + (height + margin.bottom - margin.top) + ")")
      .style("text-anchor", "middle")
      .style("font-size","small")
      .text(xlabel);
  
      svg.append("text")
      .attr("transform", "translate(" + (-40) + " ," + (height/2) + ")rotate(-90)")
      .style("text-anchor", "middle")
      .style("font-size","small")
      .text("Total");

  
      
      svg.append('g')
      .selectAll("rect")
      .data(xvalues)
      .enter()
      .append("rect")
      .attr("x",(d:any,i:any):any => { return  x(d)} ) 
      .attr("y",(d:any) => { return y(xcount[d])})
      .attr("width",x.bandwidth())
      .attr("height",(d:any,i)=> {return height - y(xcount[d])})
      .style("fill",function(d:any,i:any){
        // if(i==self.di){
        //   col = d
        //   prev= d3.select(this); 
        //   return "lightsalmon"
        // } 
        return "lightgreen"
      })
      // .on("mouseover", function(d: any) {
      //   var tx=+d3.select(this).attr("x");
      //   var ty=+d3.select(this).attr("y");
      //   d3.select(this).style("fill","#6495ED")
      //   svg.append("text")
      //   .attr("class", "bar-value")
      //   .attr("x", tx)  //x(d.region) + x.bandwidth() / 2
      //   .attr("y", ty - 10) // Adjust position to place text above the bar
      //   .text(d.target.__data__)
      //   .style("text-anchor", "middle");   
      // })
      // .on("mouseout", function(d:any,i:any) {
      //   if(i == col)
      //     d3.select(this).style("fill","lightsalmon")
      //   else
      //     d3.select(this).style("fill","lightgreen")
      //   svg.selectAll(".bar-value").remove();
      // })
      // .on("click",function(d:any,i:any){
      //   if(prev != null)
      //     prev.style("fill","lightgreen")
      //   col = i
      //   prev = d3.select(this).style("fill","lightsalmon")
      //   self.di=self.eigenvalues.indexOf(i)
      //   self.get_table(self.di)
      // });      
  
    }

    drawMap(geojsonData: any, columnName:any): void { //geojsonData: any, data: Map<string, number>
      d3.select("#map1").remove();
      d3.select("#d3")
      .append('div')
      .attr('id', 'map1')
      //.style('border','1px solid black')
      .append('h6')
      .text("Choropleth Map")
      .style('text-align','center')
  
      var margin = {top: 40, right: 30, bottom: 60, left: 80},
      width = 600 - margin.left - margin.right, //650
      height = 350 - margin.top - margin.bottom;

      let selectedCountries:any = []
      let self:any = this
      let data:any={}
      let t_data = this.filtered_data
      let highCountries:any=[]

        for(let d of t_data){
            data[d['Country Code']] = d[columnName]
            if(t_data.length < 200){
                highCountries.push(d['Country Code'])
            }
        }
        const values = t_data.map((d:any) => +d[columnName]);
        const minValue:any = t_data.length <= 1 ? 0 : d3.min(values);
        const maxValue:any = t_data.length <= 1 ? 1 : d3.max(values);

      var svg = d3.select("#map1")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

      const tooltipDiv:any = document.getElementById("tooltip");
      const formatMillions:any = d3.format(".4s");
     
      var path:any = d3.geoPath();
      var projection = d3.geoMercator()
      .scale(90)
      .center([-25,40])
      .translate([width / 2, height / 2]);

      var data1 = new Map();

      const colorRange = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'];
      //['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d', '#a63603'];//['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'];
      const logValues = values.map((d:any) => Math.log(d)); // Use Math.log() or another logarithmic function
      const quantiles: number[] = [0, 0.2, 0.4, 0.6, 0.8, 1];
      const thresholds:any = quantiles.map(q => d3.quantile(logValues, q)); 

      const colorScale = d3.scaleThreshold<number, string>()
      .domain(thresholds)
      .range(colorRange);

      const colorScale1 =
      minValue < 0
        ? d3.scaleSequentialSymlog(d3.interpolatePuOr).domain([minValue, maxValue]) // Diverging scale for negative values
        : d3.scaleSequential(d3.interpolateOrRd).domain([minValue, maxValue]); // Sequential scale for positive valuesnd 3.interpolateOrRd  d3.interpolateRgb("#2563eb","#a83636f2")

      let mouseOver = function(this: any,event:any, d:any) {
        console.log(d)
        let abc = data[event.target.__data__.id] ?  formatMillions(data[event.target.__data__.id]) : "No Data Available"
        tooltipDiv.innerHTML = `<div class="tooltip-content" style="text-align:center;">
                                <a><b>${d.properties.name}</b></a><br>
                                ${columnName}: ${abc}
                                </div>`;
        //"<a><b>"+d.id+"</b></a><br>"+columnName+": "+formatMillions(data[event.target.__data__.id])// value? `${columnName}: ${value}`: "No data available";
        tooltipDiv.style.display = "block";
      
        d3.selectAll(".Country")
          .transition()
          .duration(200)
          .style("opacity", .3)
          //.style("stroke", "transparent")

        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 1)
          //.style("stroke-width", 1)
          //.style("stroke", "black")

      }
    
      let mouseLeave = function(this: any, d:any) {
        tooltipDiv.style.display = "none";
        svg.selectAll(".country-label").remove();
        d3.selectAll(".Country")
          .transition()
          .duration(200)
          .style("opacity", 1)
          //.style("stroke", "transparent")
        d3.select(this)
          .transition()
          .duration(200)
          //.style("stroke-width", 0.2)
          //.style("stroke", "transparent")    
      }

      svg.append("g")
      .selectAll("path")
      .data(geojsonData.features)//geojsonData.features
      .enter()
      .append("path")
        //.attr("d", d3.geoPath().projection(projection))
        .attr('d', function(d: any) { return d3.geoPath().projection(projection)(d); })//function(d: any) { return d3.geoPath().projection(projection)(d); }
        .attr("fill", function (d:any) {
          d.total = data[d.id] || 0;
          return colorScale1(d.total)
        })
        //.style("stroke", "transparent")
        .style("stroke", "black")
        .style("stroke-width",(d:any)=> highCountries.includes(d.id) ? 1 : 0.2)
        .attr("class", function(d){ return "Country" } )
        .attr('id',(d:any)=>  d.properties.name)//this.geo_id[d.id]
        .style("opacity", 1)
        .on("mouseover", mouseOver )
        .on("mouseout", mouseLeave )
        .on("mousemove",(event:any)=>{
            tooltipDiv.style.left = event.x + 10 + "px";
            tooltipDiv.style.top = event.y + 10 + "px";
          })
        .on("click",function(event:any,d:any){
            console.log(d.properties.name)
            if (selectedCountries.length >= 3) {
                d3.selectAll('.Country#'+selectedCountries[0]).style("stroke", "none");
                selectedCountries.shift()
            }
            selectedCountries.push(d.properties.name);//self.geo_id[d.id]
            self.radar_data.push(self.geo_id[d.id])
            self.drawRadar()
            console.log(selectedCountries)
            d3.select(this).style("stroke", "black").style("stroke-width", 2);
            //d3.select(this)
            // .transition()
            // .duration(200)
            // .style("opacity", 1)
            // .style("stroke", "black")
        })

        //const color = d3.scaleOrdinal(d3.schemeBlues[9]);

                const width1 = 100;
                const height1 = 15;

                // Define color scale
                // const values1 = t_data.map((d:any) => +d['PM2.5']);
                // const minValue1:any = t_data.length <= 1 ? 0 : d3.min(values);
                // const maxValue1:any = t_data.length <= 1 ? 1 : d3.max(values);
                // const colorScale3 = d3.scaleSequential(d3.interpolateOrRd).domain([minValue1, maxValue1]);
                const colorScale2 = d3.scaleLinear<string>()
                .domain([0, 1]) // Normalize domain for colors
                .range(['rgb(255, 243, 232)','rgb(253, 214, 165)','rgb(247, 128, 84)','rgb(226, 73, 50)','rgb(127, 39, 4)']); // Color range from orange to red

                // Append a gradient to the SVG
                const defs = svg.append('defs');
                const linearGradient = defs.append('linearGradient')
                .attr('id', 'color-gradient')
                .attr('x1', '0%')
                .attr('y1', '0%')
                .attr('x2', '100%')
                .attr('y2', '0%')
                // .attr('x3', '100%')
                // .attr('y3', '0%')

                linearGradient.selectAll('stop')
                .data(colorScale2.range())
                .enter().append('stop')
                .attr('offset', (d, i) => `${i * 100 / (colorScale2.range().length - 1)}%`)
                .attr('stop-color', d => d);

                // Append a rectangle filled with the gradient
                svg.append('rect')
                .attr('x', 10)
                .attr('y', 300)
                .attr('width', width1)
                .attr('height', height1)
                .style('fill', 'url(#color-gradient)');
        
                svg.append("text")
                .attr("transform", "translate(" + (20) + " ," + (330) + ")")
                .style("text-anchor", "middle")
                .style("font-size","small")
                .style("fill", "black")
                .text('Low');
                svg.append("text")
                .attr("transform", "translate(" + (100) + " ," + (330) + ")")
                .style("text-anchor", "middle")
                .style("font-size","small")
                .style("fill", "black")
                .text('High');
    
    }
  

    drawRadar():any{
      d3.select("#radar").remove();
      d3.select("#d5")
      .append('div')
      .attr('id', 'radar')
      //.style('border','1px solid black')
      .append('h6')
      .text("Radar Chart")
      .style('text-align','center')

      let t_data = this.filtered_data;
  
      var margin = {top: 70, right: 120, bottom: 60, left: 40},
      width = 505 - margin.left - margin.right,
      height = 330 - margin.top - margin.bottom;

      var svg = d3.select("#radar")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

      let radialScale = d3.scaleLinear()
      .domain([0, 10])
      .range([0, 140]);
      let ticks = [2, 4, 6, 8, 10];

        svg.selectAll("circle")
      .data(ticks)
      .join(
      enter => enter.append("circle")
          .attr("cx", width / 2)
          .attr("cy", height / 2)
          .attr("fill", "none")
          .attr("stroke", "gray")
          .attr("r", d => radialScale(d) )
      );

      function angleToCoordinate(angle:any, value:any){
        let x = Math.cos(angle) * radialScale(value);
        let y = Math.sin(angle) * radialScale(value);
        return {"x": width / 2 + x, "y": height / 2 - y};
      }
      const categorical =["Population","GDP per capita","Birth rate","Life expectancy","Death rate","PM2.5"]

      let featureData = categorical.map((f:any, i:any) => {
        let angle = (Math.PI / 2) + (2 * Math.PI * i / categorical.length);
        return {
            "name": f,
            "angle": angle,
            "line_coord": angleToCoordinate(angle, 10),
            "label_coord": angleToCoordinate(angle, 10.5)
        };
    });
    svg.selectAll("line")
    .data(featureData)
    .join(
        enter => enter.append("line")
            .attr("x1", width / 2)
            .attr("y1", height / 2)
            .attr("x2", (d:any) => d.line_coord.x)
            .attr("y2", (d:any) => d.line_coord.y)
            .attr("stroke","black")
    );

// draw axis label
        svg.selectAll(".axislabel")
        .data(featureData)
        .join(
          enter => enter.append("text")
              .attr("x", (d:any)=>{return d.label_coord.x})
              .attr("y", (d:any) => d.label_coord.y)
              .text((d:any) => d.name)
              .style("font-size","10px") 
              .style("transform-origin", (d) => `${d.label_coord.x}px ${d.label_coord.y}px`)
              .style("transform",(d:any)=>{
                let len= d.name.length
                if(d.angle > 2 && d.angle < 4){
                    return `translate(${-(len/2)*10}px,0px)`
                }
                return 0;
              })    
              .on("mouseover", function(event,d:any){
                console.log(d)
                d3.select(this).style("cursor", "pointer");
              })
              .on("click",(event,d)=>{
                console.log(d.name)
                this.selectedColumn = d.name
                this.updateMap(this.geo_data,this.mapdata,d.name)
                this.drawMap(this.geo_data,d.name)
                //this.drawRadialChart(d.name)
              })
        );

        let line = d3.line()
        .x((d:any) => d.x)
        .y((d:any)=> d.y);
        let colors = ["darkorange", "gray", "navy"];
        const colorScale:any = d3.scaleOrdinal(d3.schemeCategory10)
        //--------------------------------

        let tdata:any = []
        if(this.radar_data.length > 1){
            if(this.radar_data.length>3){
                this.radar_data.shift()
            }
            let ind=0
           for(let i of t_data){
            console.log(i['Country'])
                if(this.radar_data.includes(i['Country'])){
                    tdata[ind]=i;
                    ind++ 
                }
           }
           console.log(this.radar_data)
        }
        else{
            tdata = [...t_data];
            tdata=tdata.splice(0,3)
        }

       //--------------------------------------

        let scalevalues:any={}
        for (let i of categorical) {
          // Calculate min and max for each attribute 'i' in 'categorical'
          const validValues = tdata //scale this
          .filter((d: any) => d[i] !== null && d[i] !== '..')
          .map((d: any) => +d[i]); // Convert attribute values to numbers
      
        // Calculate min and max for validValues
        scalevalues[i] = {
          min: d3.min(validValues) || 0, // Default to 0 if no valid minimum value is found
          max: d3.max(validValues) || 0
        }
          // scalevalues[i] = {
          //   min: d3.min(this.r_data, (d: any) =>{ if(d[i]!=null && d[i]!='..') return d[i]}),
          //   max: d3.max(this.r_data, (d: any) => { if(d[i]!=null && d[i]!='..') return d[i]})
          // };
        }
        
        //console.log(scalevalues)

        function scaleValue(value: number, minInput: number, maxInput: number, minOutput: number, maxOutput: number): number {
          value = Math.min(Math.max(value, minInput), maxInput);
          const scaledValue = minOutput + ((value - minInput) / (maxInput - minInput)) * (maxOutput - minOutput);
          return scaledValue;
        }


       
        function getPathCoordinates(data_point:any){
          let coordinates = [];
          for (var i = 0; i < categorical.length; i++){
              let ft_name = categorical[i];
              let angle = (Math.PI / 2) + (2 * Math.PI * i / categorical.length);
              let value =scaleValue(data_point[ft_name], scalevalues[ft_name]["min"], scalevalues[ft_name]["max"], 2, 9);
              //console.log(value)
              coordinates.push(angleToCoordinate(angle, value));
          }
          do{
            let ft_name = categorical[0];
            let angle = (Math.PI / 2) + (2 * Math.PI * 0 / categorical.length);
            let value =scaleValue(data_point[ft_name], scalevalues[ft_name]["min"], scalevalues[ft_name]["max"], 2, 9);
            //console.log(value)
            coordinates.push(angleToCoordinate(angle, value));
          }while(false)
          
          return coordinates;
      }
      //console.log("color "+colorScale('0'))
        let x1=300,y1=-50
        let x2=320,ind=0
        for(let i of tdata){
            svg.append("circle").attr("cx",x1).attr("cy",y1).attr("r", 6).style("fill", colorScale(ind)).attr("opacity", 0.7)
            svg.append("text").attr("x", x2).attr("y", y1).text(i['Country']).style("font-size", "15px").attr("alignment-baseline","middle")
            y1+=20
            ind++
        }

        // svg.append("circle").attr("cx",330).attr("cy",-50).attr("r", 6).style("fill", colorScale(0)).attr("opacity", 0.7)
        // svg.append("circle").attr("cx",330).attr("cy",-30).attr("r", 6).style("fill", colorScale(1)).attr("opacity", 0.7)
        // svg.append("circle").attr("cx",330).attr("cy",-10).attr("r", 6).style("fill", colorScale(2)).attr("opacity", 0.7)
        // svg.append("text").attr("x", 350).attr("y", -50).text("variable A").style("font-size", "15px").attr("alignment-baseline","middle")
        // svg.append("text").attr("x", 350).attr("y", -30).text("variable B").style("font-size", "15px").attr("alignment-baseline","middle")
        // svg.append("text").attr("x", 350).attr("y", -10).text("variable B").style("font-size", "15px").attr("alignment-baseline","middle")


    svg.selectAll("path")
    .data(tdata)
    .join(
      enter => enter.append("path")
      .datum((d):any => getPathCoordinates(d))
      .attr("d", line)
      .attr("stroke-width", 0.4)
      .attr("stroke", (_, i) => "black")
      .attr("fill", (_, i) => colorScale(i))
      .attr("stroke-opacity", 1)
      .attr("opacity", 0.5)
      
     
    )

      


    }

    plotpcp1(){

      d3.select("#plotpcp").remove();
      d3.select("#d4")
      .append('div')
      .attr('id', 'plotpcp')
      .style('border','1px solid black')
      .append('h6')
      .text("PCP")
      .style('text-align','center')
      .append('div')

    //   if(this.scatter_data.length == 0){
    //     this.drawScatterplot()
    //   }
  
      var margin = {top: 40, right: 50, bottom: 60, left: 40},
      width = 900 - margin.left - margin.right, //650
      height = 330 - margin.top - margin.bottom;
  
      var svg = d3.select("#plotpcp")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")");
      
     let dimensionaxis:any={}
     let pd:any= {}
     let d3axis:any={}
    let y:any ={}
    let t_data:any = this.filtered_data
  
    this.isdrag = []
  
    
  
    for (let i in this.dimensions) {
      let name :any = this.dimensions[i]
      if(!this.cat_options.includes(name)){
        y[name] = d3.scaleLinear()
        .domain(d3.extent(t_data, function(d:any) { return +d[name]; }) as [any, any] )
        .range([height, 0])
        .nice()
      }else{
        y[name]= d3.scaleBand()
        .domain(t_data.map((d:any,i:any)=>{return d[name]}))
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
  
    let self:any = this
  
   
  
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
    
    //let tempclusterData=this.clusteredData;
    const colorScale:any = d3.scaleOrdinal(d3.schemeCategory10)
    const colors = ["skyblue", "lightsalmon", "lightgreen", "green", "orange","red", "cornflowerblue", "lightcoral", "limegreen", "mediumseagreen"];
  
   
    const pathGroup=svg.selectAll("myPath")
      .data(t_data)
      .enter().append("path")
      .attr("d",  path)
      .style("fill", "none")// "#69b3a2"
      .style("stroke",(d,i:any)=> {
        //let index=tempclusterData[i]
        // return colors[i]
        return colorScale(i)
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
    const brushed = (event:any, dimension:any) => {

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
      console.log(this.filtered_data)
      const filteredData = t_data.filter(filterFunction); // t_data
      this.filtered_data = filteredData
      console.log(filteredData)

  
      // Update the visualization to highlight the selected data points
      svg.selectAll("path:not(.domain)")
          .style("stroke", function (d:any,i:any) {
              return filteredData.includes(d) ? "lightgreen" : "none"; // colors[tempclusterData[i]
          })
          .style("opacity", function (d:any,i:any) {
            return filteredData.includes(d) ? 0.5 : 0; // Highlight selected data points
        })

        //update other plots
        if(this.filtered_data.length == 0){
            this.filtered_data = this.r_data
        }
        //this.pcp_data = this.filtered_data
        this.drawScatterplot()
        if(self.selectedColumn == 'Continent'){
            self.updateMap(self.geo_data,self.mapdata,'Population');
            this.drawMap(this.geo_data,'Population')
        }
        else{
            self.updateMap(self.geo_data,self.mapdata,self.selectedColumn);
            this.drawMap(this.geo_data,self.selectedColumn)
        }
        self.drawRadialChart(self.selectedColumn)

       
        
      
    }
    
    //--
  
    
  
  
   let firstChecked:any
   
  
    // Draw the axis:
    svg.selectAll("myAxis")
      // For each dimension of the dataset I add a 'g' element:
      .data(this.dimensions).enter()
      .append("g")
      .attr("transform", function(d:any,i:any) { return "translate(" + Number(x(d)) + ")"; })
      .each(function(d:any,i:any) {
        if(false){ //self.cat_options.includes(d)
            d3.select(this).call(d3.axisLeft(y[d]))
            .call(brush(d))
            .call(drag)
        } 
        else{
            d3.select(this).call(d3.axisLeft(y[d]))
            .call(brush(d))
            .call(drag)
            .append("foreignObject")
            .attr("x", -0)
            .attr("y", -35)
            .attr("width", 30)
            .attr("height", 30)
            .append("xhtml:input")
            .attr("type", "checkbox")
            .attr("class","check"+i)
            .on("change", function () {
                if(self.sp_options.length==2){
                    d3.select('.'+"check"+self.dimensions.indexOf(self.sp_options[0])).property('checked',false)
                    self.sp_options.shift()
                } 
                self.sp_options.push(d)
                self.drawScatterplot()
            });
            if(self.sp_options.includes(d)){
                d3.select('.'+"check"+i).property('checked',true)
            }
        } 
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
        //d3.select("rect.selection").remove()
          return d3.brushY()
              .extent([[0, 0], [20, height]]) // Adjust the brush extent as needed
              .on("brush", function (event) { brushed(event, dimension); }); // Call brushed function on brush event
      }
        
  
    }

    drawRadialChart(columnName:any){
        d3.select("#title").remove();
        d3.select("#d2")
        .append('div')
        .attr('id', 'title')
        //.style('border','1px solid black')
        .append('h6')
        .text("Radial BarChart")
        .style('text-align','center')
    
        var margin = {top: 20, right: 30, bottom: 60, left: 40},
        width = 400 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom,
        innerRadius = 70,
        outerRadius = (Math.min(width, height) / 2)-10;
        let tempdata:any
        let xlabel = "Continent"
        if(columnName == xlabel)
            tempdata = this.r_data
        else
            tempdata =this.filtered_data
        let xcount:any ={}
        let xvalues = [...this.continents_list]
        for(let i of xvalues){
            xcount[i] = 10
        }
        for(let i of tempdata){
            xcount[i[xlabel]] += 1
        //   if (!xcount.hasOwnProperty(i[xlabel])) {
        //         if(columnName!="Continent"){
        //             xcount[i[xlabel]] =Number( i[columnName])
        //         }
        //         else
        //             xcount[i[xlabel]] = 1;
        //         //     xvalues.push(i[xlabel])
        //     } 
        //     else {
        //         if(columnName!="Continent"){
        //             xcount[i[xlabel]] += Number(i[columnName])
        //         }
        //         xcount[i[xlabel]] += 1
        //     }
        }
        console.log(xcount)
    
    
        var svg = d3.select("#title")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top) + ")");

        
  
  
        var x = d3.scaleBand()
        .domain(xvalues.map((d:any)=> d )) //.domain(tempdata.map((d:any,i:any)=>{return d[xlabel]})) 
        .range([0, 2 * Math.PI])
        .align(0) 
        //.padding(0.4)
          
        let max=0;
        var y = d3.scaleRadial()
        .range([innerRadius, outerRadius]) 
        .domain([0,Number(d3.max(xvalues,(d:any)=> xcount[d]))]);

        const tooltipDiv:any = document.getElementById("tooltip");
        

        svg.append("g")
        .selectAll("path")
        .data(xvalues)
        .enter()
        .append("path")
          .attr("fill", "#69b3a2")
          .attr("d", d3.arc()     // imagine your doing a part of a donut plot
              .innerRadius(innerRadius)
              .outerRadius(function(d:any) { return y(xcount[d]); })
              .startAngle(function(d:any) { return Number(x(d)); })
              .endAngle(function(d:any) { return Number(x(d)) + x.bandwidth(); })
              .padAngle(0.01)
              .padRadius(innerRadius))
              .style('fill',(d)=>"rgb(31, 119, 180)")
              .style('opacity',0.7)
              .on("mouseover", function(event,d) {
                d3.select(this).style("cursor", "pointer");
                tooltipDiv.innerHTML ="No of Countries: "+ (xcount[d]-10)
                tooltipDiv.style.display = "block";
              })
              .on('mouseout',(event:any)=>{
                tooltipDiv.style.display = "none";
              })
              .on("mousemove",(event:any)=>{
                tooltipDiv.style.left = event.x + 10 + "px";
                tooltipDiv.style.top = event.y + 10 + "px";
              })
              .on("click", (event, d)=> {
                if(d=="Oceania")
                    this.zoomTo("Australia")
                else
                    this.zoomTo(d)
              })
       
        
              svg.append("g")
              .selectAll("g")
              .data(xvalues)
              .enter()
              .append("g")
                .attr("text-anchor", function(d:any) { return (Number(x(d)) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
                .attr("transform", function(d) { return "rotate(" + ((Number(x(d)) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")"+"translate(" + (y(xcount[d])+10) + ",0)"; })
              .append("text")
                .text(function(d){return(d)})
                .attr("transform", function(d) { return (Number(x(d)) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
                .style("font-size", "11px")
                .attr("alignment-baseline", "middle")
    
        
        // svg.append('g')
        // .selectAll("rect")
        // .data(xvalues)
        // .enter()
        // .append("rect")
        // .attr("x",(d:any,i:any):any => { return  x(d)} ) 
        // .attr("y",(d:any) => { return y(xcount[d])})
        // .attr("width",x.bandwidth())
        // .attr("height",(d:any,i)=> {return height - y(xcount[d])})
        // .style("fill",function(d:any,i:any){
        //   return "lightgreen"
        // })
       
    }


    updateMap(geojsonData: any, data:any, columnName:any){
     
      //d3.select(this.elementRef.nativeElement).select("#map").html('')
        let self = this
        let t_data = this.filtered_data
        let selectedCountries:any=[]
        let highCountries:any=[]
        const tooltipDiv:any = document.getElementById("tooltip");
        // console.log("enter updated")
        // console.log(geojsonData)
        const values = t_data.map((d:any) => +d[columnName]);
        const minValue:any = d3.min(values);
        const maxValue:any = d3.max(values);

       


      const colorRange = ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d', '#a63603'];//['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'];

      const colorScale1 = d3.scaleThreshold<number, string>()
      .domain([minValue,maxValue])
      .range(colorRange);


        const colorScale =
          minValue < 0
            ? d3.scaleSequentialSymlog(d3.interpolatePuOr).domain([minValue, maxValue]) // Diverging scale for negative values
            : d3.scaleSequential(d3.interpolateOrRd).domain([minValue, maxValue]); // Sequential scale for positive values

        const dataById:any = {};
        t_data.forEach((d:any) => {
            if(t_data.length < 200){
                highCountries.push(d['Country Code'])
            }
            dataById[d["Country Code"]] = +d[columnName]; 
        });

        if (this.geoJsonLayer) {
            this.geoJsonLayer.remove();
          }  
          //console.log(this.oceanGeoJson)
        import('leaflet').then((LModule) => {
            leafletModule = LModule;   
        //     leafletModule.geoJson(this.oceanGeoJson, {
        //         style:(feature:any)=> {
        //             return {
        //             fillColor: "#FFFFFF", // White color for oceans
        //             weight: 0, // No border
        //             fillOpacity: 1, // Solid fill
        //             };
        //         },
        //   }).addTo(this.map);
          this.geoJsonLayer = leafletModule.geoJson(geojsonData, {
            style: (feature:any) => ({
              fillColor: dataById[feature.id]
                ? colorScale(dataById[feature.id])
                : "white",//colorScale(0), // Default color for unmatched IDs
              weight:  highCountries.includes(feature.id) ? 2 : 1,
              opacity: 1,
              color: highCountries.includes(feature.id) ? "rgb(31, 119, 180)" :"grey",
              fillOpacity: 0.9,
              bringToFront : true
            }),
            onEachFeature: function (feature:any, layer:any) {
               
              layer.on("click",function() {
                    console.log("Country Code:", dataById[feature.id]);
                    self.radar_data.push(self.geo_id[feature.id])
                    //console.log(self.radar_data)
                    self.drawRadar()

                    if (selectedCountries.length >= 3) {
                    self.geoJsonLayer.resetStyle(selectedCountries.shift());
                    }
                    selectedCountries.push(layer);
                    // Highlight the new selected country
                    layer.setStyle({
                    weight: 3,
                    color: "rgb(31, 119, 180)", // Gold color for highlight
                    dashArray: "",
                    fillOpacity: 0.9,
                    });
              })

              layer.on("mouseover",(event:any)=>{
                highlightFeature(event, self.geoJsonLayer)
                //var tooltip=layer.bindTooltip(""+dataById[feature.id],{sticky:true})
                const value = dataById[feature.id];

                tooltipDiv.innerHTML = value? `${columnName}: ${value}`: "No data available";
                tooltipDiv.style.display = "block";
                //layer.openTooltip();
              })

              layer.on("mouseout",(event:any)=>{
                resetHighlight(event, self.geoJsonLayer);
                tooltipDiv.style.display = "none";
              })

              layer.on("mousemove",(event:any)=>{
                //console.log("aa")
                tooltipDiv.style.left = event.originalEvent.pageX + 10 + "px";
                tooltipDiv.style.top = event.originalEvent.pageY + 10 + "px";
              })
            },
          }).addTo(this.map);
          

        })

        function highlightFeature(e:any, geoJsonLayer:any) {
            geoJsonLayer.eachLayer(function (layer:any) {
                console.log("fill")
              layer.setStyle({
                opacity: 0.1,
                fillOpacity: 0.5, // Lower opacity for all
              });
            });
            e.target.setStyle({
              opacity: 1,
              fillOpacity: 0.9, // Highlight the hovered country
            })
            e.target.bringToFront();
          }
    
          function resetHighlight(e:any, geoJsonLayer:any) {
            geoJsonLayer.eachLayer(function (layer:any) {
              layer.setStyle({
                opacity: 1,
                fillOpacity: 0.9, // Restore the default opacity
              });
            });
          }

    }

    zoomTo(continent:any) {
        this.filtered_data=[]
        let ind=0;
        
        //const { coords, zoom } = this.centers[continent];
        //this.map.flyTo(coords, zoom);
        //console.log(this.filtered_data)
        if(continent == "Continent"){
            this.filtered_data = this.r_data
            this.pcp_data = this.r_data
        }
        else{
            if(continent=="Australia")
                continent='Oceania'
            for(let i of this.r_data){
                if(i["Continent"]==continent){
                    this.filtered_data[ind]=i
                    ind++
                    //console.log(i)
                }
            }
        }
       
        console.log(this.filtered_data)
        this.pcp_data=[...this.filtered_data]
        this.scatter_data=[...this.filtered_data]
        this.drawScatterplot()
        this.plotpcp()
        let columnName = this.selectedColumn == 'Continent' ? 'Population' : this.selectedColumn
        this.drawMap(this.geo_data,columnName)
        this.drawRadialChart("Continent")
        this.drawRadar()
    }

    plotpcp(){

        d3.select("#plotpcp").remove();
        d3.select("#d4")
        .append('div')
        .attr('id', 'plotpcp')
        //.style('border','1px solid black')
        .append('h6')
        .text("Parallel Coordinate Plot")
        .style('text-align','center')
        .append('div')
  
      //   if(this.scatter_data.length == 0){
      //     this.drawScatterplot()
      //   }
      
        var margin = {top: 60, right: 50, bottom: 60, left: 40},
        width = 905 - margin.left - margin.right, //650
        height = 330 - margin.top - margin.bottom;
    
        var svg = d3.select("#plotpcp")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");
        
       let dimensionaxis:any={}
       let activeBrushes:any = {}
       let pd:any= {}
       let d3axis:any={}
      let y:any ={}
      let t_data:any = this.filtered_data
    
      this.isdrag = []
      const formatMillions:any = d3.format(".2s");
      
      if(this.filtered_data.length <= 1)
            t_data = this.r_data

      for (let i in this.dimensions) {
        let name :any = this.dimensions[i]
        if(!this.cat_options.includes(name)){
          y[name] = d3.scaleLinear()
          .domain(d3.extent(t_data, function(d:any) { return +d[name]; }) as [any, any] )
          .range([height, 0])
          .nice()
        }else{
            let cdata = this.r_data
            y[name]= d3.scaleBand()
            .domain(cdata.map((d:any,i:any)=>{return d[name]}))
            .range([height, 0])
        }
       
      }
      //if(this.filtered_data.length <= 1)
        t_data = this.filtered_data
    
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
    
      let self:any = this
    
     
    
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
      
      //let tempclusterData=this.clusteredData;
      const colorScale:any = d3.scaleOrdinal(d3.schemeCategory10)
      const colors = ["skyblue", "lightsalmon", "lightgreen", "green", "orange","red", "cornflowerblue", "lightcoral", "limegreen", "mediumseagreen"];
    
     for(let i of this.continents_list){
        let ind = this.continents_list.indexOf(i)
        colorScale(ind)
     }
      const pathGroup=svg.selectAll("myPath")
        .data(t_data)
        .enter().append("path")
        .attr("d",  path)
        .style("fill", "none")// "#69b3a2"
        .style("stroke",(d:any,i:any)=> {
          let ind = this.continents_list.indexOf(d['Continent'])
          return colorScale(ind)
        })
        .style("opacity", 0.3)
    
    
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
      const brushed = (event:any, dimension:any) => {
        this.filtered_data =this.pcp_data
        console.log(activeBrushes)
        if(Object.entries(activeBrushes).length === 0){
            console.log("entered")
            svg.selectAll("path:not(.domain)")
            .style("opacity", function (d:any,i:any) {
                return 0.3; // Highlight all points
            })
            
            //return;
        }
        for(let i of this.dimensions){
            dimension =  i
            //console.log(i)
            let a = activeBrushes[i]
            if(a != null)
            {
                self.isdrag[dimension] = false
                const selection = activeBrushes[i].selection;
                if (!selection) return;
            
                // Get the range of the brushed area
                const [start, end] = selection;
            
                // Define a filter function based on the brushed range
                const filterFunction = function (d:any) {
                    const yValue = y[dimension].bandwidth ?  y[dimension](d[dimension]) + y[dimension].bandwidth()/2 : y[dimension](d[dimension]);
                    return yValue >= start && yValue <= end;
                };
            
                // Filter the data based on the brushed range
                //console.log(this.filtered_data)
                const filteredData = this.filtered_data.filter(filterFunction); // t_data
                this.filtered_data = filteredData
                console.log(filteredData)
        
            
                //Update the visualization to highlight the selected data points
                svg.selectAll("path:not(.domain)")
                    // .style("stroke", function (d:any,i:any) {
                    //     return filteredData.includes(d) ? "lightgreen" : "none"; // colors[tempclusterData[i]
                    // })
                    .style("opacity", function (d:any,i:any) {
                        return filteredData.includes(d) ? 0.6 : 0;
                    })
                    // .style("display", function (d:any,i:any) {
                    //     return filteredData.includes(d) ? "block" : "none";
                    // })
        
            }
        }  
         //update other plots
            // if(this.filtered_data.length == 0)
            //     this.filtered_data = this.r_data
            this.drawScatterplot()
            if(self.selectedColumn == 'Continent'){
                self.updateMap(self.geo_data,self.mapdata,'Population');
                this.drawMap(this.geo_data,'Population')
            }
            else{
                self.updateMap(self.geo_data,self.mapdata,self.selectedColumn);
                this.drawMap(this.geo_data,self.selectedColumn)
            }
            self.drawRadialChart("abc") 
        
      }
      
      //--
    
      
    
    
     let firstChecked:any
     
    
      // Draw the axis:
      let axes=svg.selectAll("myAxis")
        // For each dimension of the dataset I add a 'g' element:
        .data(this.dimensions).enter()
        .append("g")
        .attr("transform", function(d:any,i:any) { return "translate(" + Number(x(d)) + ")"; })
        .each(function(d:any,i:any) {
          if(false){ //self.cat_options.includes(d)
              d3.select(this).call(d3.axisLeft(y[d]))
              .call(brush(d))
              .call(drag)
          } 
          else{
              d3.select(this).call(!self.cat_options.includes(d) ?  d3.axisLeft(y[d]).tickFormat(formatMillions):  d3.axisLeft(y[d]))
              .call(brush(d))
              .call(drag)
              .append("foreignObject")
              .attr("x", -0)
              .attr("y", -35)
              .attr("width", 30)
              .attr("height", 30)
              .append("xhtml:input")
              .attr("type", "checkbox")
              .attr("class","check"+i)
              .on("change", function () {
                    if(self.sp_options[0] == d || self.sp_options[1] == d){
                        d3.select('.'+"check"+i).property('checked',true)
                        return;
                    }
                  if(self.sp_options.length==2){
                      d3.select('.'+"check"+self.dimensions.indexOf(self.sp_options[0])).property('checked',false)
                      self.sp_options.shift()
                  } 
                  self.sp_options.push(d)
                  self.drawScatterplot()
              });
              if(self.sp_options.includes(d)){
                  d3.select('.'+"check"+i).property('checked',true)
              }
          } 
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
          //d3.select("rect.selection").remove()
            return d3.brushY()
                .extent([[0, 0], [20, height]]) // Adjust the brush extent as needed
                .on("brush", function (event) {
                    self.pcp_brushed = true;
                    activeBrushes[dimension]=event 
                    brushed(event, dimension); 
                })
                .on("end", function(event){
                    if (event.selection !== null) return;
                    self.pcp_brushed = false;
                    //activeBrushes.delete(dimension)
                    delete activeBrushes[dimension]
                    console.log(activeBrushes)
                    brushed(event, dimension);
                })
        }
          
    
    }

    reset(){
        this.zoomTo("Continent")
    }

    
      



}
