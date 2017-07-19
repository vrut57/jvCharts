'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.clustergram = {
    paint: paint,
    setData: setData,
    getEventData: null
};

jvCharts.prototype.generateClustergram = generateClustergram;

/************************************************ Clustergram functions ******************************************************/

/**setClustergramData
 *  gets heatmap data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;

    var leftTreeData = chart.data.chartData[0];
    var rightTreeData = chart.data.chartData[1];

    chart.leftLabels = {};
    chart.leftLabels.values = [];
    for(var k = 0; k < leftTreeData.children.length; k++){
        if(leftTreeData.children[k].name){
            chart.leftLabels.values.push(leftTreeData.children[k].name);
        }
    }

    chart.rightLabels = {};
    chart.rightLabels.values = [];
    for(var k = 0; k < rightTreeData.children.length; k++){
        if(rightTreeData.children[k].name){
            chart.rightLabels.values.push(rightTreeData.children[k].name);
        }
    }

    //define color object for chartData
}

function paint() {
    var chart = this;
    chart._vars.color = chart.data.color;
    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship
    var customMargin = {
        top: 20,
        right: 40,
        left: 0,
        bottom: 20
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, customMargin);
    //chart.generateLegend(chart.currentData.legendData, 'generateClustergram');
    chart.generateClustergram();
}

/**generateClustergram
 *
 * paints the Clustergram on the chart
 * @params ClustergramData
 */
function generateClustergram() {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container;
    
    var leftTreeData = chart.data.chartData[0];
    var rightTreeData = chart.data.chartData[1];
    var gridData = chart.data.chartData[2];

    var size = gridData.length * 10;
    if(container.width > container.height) {
        if(size < container.width) {
            size = container.width;
        }
    } else {
        if(size < container.height) {
            size = container.height;
        }
    }

    //remove svg elements
    svg.selectAll("*").remove();

    // svg.append("rect")
    //     .attr("width", size)
    //     .attr("height", size)
    //     .style("fill", "none")
    //     .style("pointer-events", "all")
    //     .call(d3.zoom()
    //         .scaleExtent([1, 8])
    //         .on("zoom", zoomed));

    var vis = svg.append('g').attr('transform', 'translate(' + 0 + ',' + 0 + ')').attr('class', 'heatmap'),
        leftG = vis.append("g").attr("id", "left-tree"),
        bottomG = vis.append("g").attr("id", "bottom-tree"),
        heatG = vis.append("g").attr('class', 'clustergram-container').attr("id", "heat");

    var div = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    //calc new width and height
    var newWidth = size / 4;
    var newHeight = size / 4;

    var leftTree = d3.cluster()
        .size([newHeight, newWidth]);

    var root = d3.hierarchy(leftTreeData);
        leftTree(root);

    var className = "";
    var leftLink = leftG.selectAll(".cluster-link")
        .data(root.descendants().slice(1))
        .enter().append("path")
        .attr("class", function(d) {          
            return "cluster-link " + className;
        })
        .attr("d", function(d) {
            return "M" + d.y/4 + "," + d.x
                + "V" + d.parent.x + "H" + d.parent.y/4;
        });

    //childCount
    var leftChildCount = 0;
    var leftNode = leftG.selectAll(".cluster-node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function(d) { 
            return "cluster-node" + (d.children ? " cluster-node--internal" : " cluster-node--leaf"); 
        })
        .attr("transform", function(d) { 
            return "translate(" + d.y/4 + "," + d.x + ")"; 
        });

    leftNode.append("line")
        .style("stroke", "#999")
        .attr("x1", function(d) { 
            return d.children ?  0 : 0; 
        })
        .attr("x2", function(d) { 
            return d.children ? 0 : 15;
        });

    leftNode.append("text")
        .attr("dy", 3)
        .attr("x", function(d) { 
            return d.children ? -8 : 0; 
        })
        .style("text-anchor", function(d) { 
            return "end";
        })
        .text(function(d) { 
            d.children ? "" : leftChildCount++;
            // return d.data.name;
            if(d.data.name === "root") {
                return "";
            }
            return d.children ? d.data.name : "";

        });


    //bottom Tree
    var topTree = d3.cluster()
        .size([newHeight, newWidth]);

        var root = d3.hierarchy(rightTreeData);
        topTree(root);

        var topLink = bottomG.selectAll(".cluster-link")
        .data(root.descendants().slice(1))
        .enter().append("path")
        .attr("class", "cluster-link")
        .attr("d", function(d) {
            return "M" + d.y/4 + "," + d.x
                + "V" + d.parent.x + "H" + d.parent.y/4;
        });

    //childCount
    var rightChildCount = 0;
    var rightNode = bottomG.selectAll(".cluster-node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function(d) { 
            return "cluster-node" + (d.children ? " cluster-node--internal" : " cluster-node--leaf"); 
        })
        .attr("transform", function(d) { 
            return "translate(" + d.y/4 + "," + d.x + ")"; 
        })

    rightNode.append("line")
        .style("stroke", "#999")
        .attr("x1", function(d) { 
            return d.children ?  0 : 0; 
        })
        .attr("x2", function(d) { 
            return d.children ? 0 : 15;
        });

    rightNode.append("text")
        .attr("dy", 3)
        .attr("x", function(d) { 
            return d.children ? -8 : 8; 
        })
        .style("text-anchor", function(d) { 
            return d.children ? "end" : "start"; 
        })
        .text(function(d) { 
            d.children ? "" : rightChildCount++;
            if(d.data.name === "root") {
                return "";
            }
            return d.children ? d.data.name : ""; 
        });

    var heatScores = [];
    for(var i = 0; i < gridData.length; i++) {
        var cell = gridData[i];
        heatScores.push(cell.value);
    }

    //heat variables
    var color = d3.scaleThreshold()
        .domain(heatScores)
        .range(["#fbf2d2", "#fee7a0", "#ffc665", "#fea743", "#fd8c3c", "#fb4b29", "#ea241e", "#d60b20", "#b10026", "#620023"]);

    var gridHeight = newHeight / leftChildCount;
    var gridWidth = newWidth / rightChildCount;

    //grid
    var heat = heatG.selectAll(".heat")
        .data(gridData)
    .enter().append("rect")
        .attr("class", function(d) {           
            return "rect";
        })
        .attr("x", function(d) { 
            return d.x_index * gridWidth;
        })
        .attr("y", function(d) {
            return d.y_index * gridHeight;
        })
        .attr("width", function(d) { 
            return gridWidth;
        })
        .attr("height", function(d) { 
            return gridHeight;
        })
        .attr("stroke", function(d) { 
            return "#E6E6E6";
        })
        .attr("stroke-width", function(d) { 
            return "1px";
        })
        .style("fill", function(d) { 
            return color(d.value); 
        })
        .on("mouseover", function(d) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(d3.event);
                } else {
                    //Get tip data
                    var tipData = chart.setTipData(d, i);
                    tipData.color = color(d.value); 
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
                }
            }
        })
        .on('mouseout', function (d) {
            chart.tip.hideTip();
        });

    svg.call(d3.zoom()
        .scaleExtent([1 / 2, 8])
        .on("zoom", zoomed));

    // align G tags
    var leftTreeWidth = leftG.node().getBBox().width;
    var topTreeWidth = bottomG.node().getBBox().width;
    var heatWidth = heatG.node().getBBox().width;
    leftG.attr("transform", "translate(" + 0 + "," + (topTreeWidth) + ")");
    bottomG.attr("transform", "translate(" + (leftTreeWidth+heatWidth) + "," + 0 + ")rotate(90)");
    heatG.attr("transform", "translate(" + leftTreeWidth + "," + (topTreeWidth) + ")");

    function zoomed() {
        // var transform = d3.zoomTransform(svg.node());
        vis.attr("transform", d3.event.transform);
    }

}

module.exports = jvCharts;


