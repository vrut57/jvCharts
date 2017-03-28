'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.singleaxis = {
    paint: paint,
    setData: setData
};

jvCharts.prototype.getSingleAxisData = getSingleAxisData;
jvCharts.prototype.getSingleAxisZ = getSingleAxisZ;
jvCharts.prototype.generatePoints = generatePoints;


/************************************************ Single Axis Cluster functions ******************************************************/

function setData(chart) {
    chart.currentData = { chartData: chart.data.chartData, dataTable: chart.data.dataTable };

    //Set the legend Data to the label from dataTable Keys
    chart.currentData.legendData = [chart.currentData.dataTable.x];
    chart.currentData.xAxisData = chart.getSingleAxisData(chart.currentData.chartData, chart.currentData.dataTable);

    if (chart.currentData.dataTable.hasOwnProperty('size')) {
        chart.currentData.zAxisData = chart.getSingleAxisZ(chart.currentData.chartData);
    }

    chart.currentData.color = 'red';//chart.setChartColors (chart._vars.color, chart.data.legendData, colors);
}

function paint(chart) {
        var splitData = {},//If there is a split, the data that has been split
        numVizzes,//If there is a split, the number of single axis clusters that are created
        customSize = {},//If there is a split, the svg needs to be a custom predefined height
        margin = {
            top: 40,
            left: 100,
            right: 75,
            bottom: 50,
        };

    //If there is a split on the viz, run through this logic
    if (chart._vars.splitData != "" && chart._vars.splitData != "none") {
        //Check to see how many vizzes need to be created because of the split
        debugger
        var splitDataKeys = [];
        var splitOptionName = chart._vars.splitData.replace(/_/g, " ");

        for (var i = 0; i < chart.currentData.chartData.length; i++) {
            var addToKeys = true;
            for (var j = 0; j < splitDataKeys.length; j++) {
                if (chart.currentData.chartData[i][splitOptionName] === splitDataKeys[j]) {
                    addToKeys = false;
                    break;
                }
            }
            if (addToKeys) {
                splitDataKeys.push(chart.currentData.chartData[i][splitOptionName]);
            }
        }

        //Create Object with keys and assign each element of the data array to corresponding object
        for (var i = 0; i < splitDataKeys.length; i++) {
            splitData[splitDataKeys[i]] = [];//Assign empty array to each location
        }

        //Assign Data elements to appropriate place in splitData object
        for (var i = 0; i < chart.currentData.chartData.length; i++) {
            splitData[chart.currentData.chartData[i][splitOptionName]].push(chart.currentData.chartData[i]);
        }

        numVizzes = splitDataKeys.length;

        customSize = {};

        customSize.height = (numVizzes) * 300;

        chart.generateSVG(chart.currentData.legendData, margin, customSize);
        chart.generateXAxis(chart.currentData.xAxisData);
        chart.drawGridlines(chart.currentData.xAxisData);

        for (var i = 0; i < numVizzes; i++) {
            chart.generatePoints(splitData[splitDataKeys[i]], i);

        }
    }
    //When there isn't a split, the base case
    else {
        chart.generateSVG(chart.currentData.legendData, margin);
        chart.generateXAxis(chart.currentData.xAxisData);
        chart.drawGridlines(chart.currentData.xAxisData);
        chart.generatePoints(chart.currentData.chartData);
    }
    
    if(typeof chart.currentData.xAxisScale.ticks === "function") {
        chart.formatXAxisLabels(chart.currentData.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(chart.currentData.xAxisScale.domain().length);
    }
}

function getSingleAxisZ(data) {
    var chart = this,
        size = chart.currentData.dataTable.size,
        min = data[0][size],
        max = data[0][size];
    //Find min and max of the data
    for (var i = 0; i < data.length; i++) {
        var num = data[i][size];
        if (num > max) {
            max = num;
        }
        else if (num < min) {
            min = num;
        }
    }

    return {
        'min': min,
        'max': max,
        'label': size
    }
}

function generatePoints(data, yLevel) {
    var chart = this,
        svg = chart.svg,
        width = chart.config.container.width,
        height = chart.config.container.height,
        dataTable = chart.currentData.dataTable,
        xAxisData = chart.currentData.xAxisData,
        zAxisData = chart.currentData.zAxisData,
        container = chart.config.container,
        pointColor = "#609cdb",
        coloredPoint = "#e88a17";

    var x = jvCharts.getAxisScale('x', xAxisData, chart.config.container, chart._vars);

    const SPLIT_CLUSTER_HEIGHT = 300;
    const TRANSLATE_SPLIT_CLUSTER = 150;


    //If there's a split, account for the multiple axes
    var currentAxisHeight;
    if (yLevel != null) {
        currentAxisHeight = (yLevel * SPLIT_CLUSTER_HEIGHT) + TRANSLATE_SPLIT_CLUSTER;//Each height is 100px
    }
    else {
        currentAxisHeight = height / 2;
    }

    if (!chart._vars.NODE_MIN_SIZE) {
        chart._vars.NODE_MIN_SIZE = 4.5;
    }
    if (!chart._vars.NODE_MAX_SIZE) {
        chart._vars.NODE_MAX_SIZE = 25;
    }

    //Add a path line through the height of the axis
    if (yLevel != null) {
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", container.width)
            .attr("y1", currentAxisHeight)
            .attr("y2", currentAxisHeight)
            .attr("stroke", "white")
            .attr("stroke-width", "20px")
            .attr("transform", "translate(0, " + TRANSLATE_SPLIT_CLUSTER + ")");

        svg.append("text")
            .datum(data)
            .attr("x", 0)
            .attr("y", currentAxisHeight)
            .text(function (d, i) {
                return d[0][chart._vars.splitData.replace(/_/g, ' ')];
            })
            .attr("transform", "translate(-85, 0)");
    }




    var simulation = d3.forceSimulation(data)
        .alphaDecay(.05)
        .force("x", d3.forceX(function (d) {
            return x(d[dataTable.x]);
        }).strength(1))
        .force("y", d3.forceY(currentAxisHeight))
        .force("collide", d3.forceCollide(function (d, i) {
            //Set collision radius equal to the radius of the circle
            if (dataTable.hasOwnProperty('size')) {
                var norm = (d[dataTable.size] - zAxisData.min) / (zAxisData.max - zAxisData.min);
                var val = (chart._vars.NODE_MAX_SIZE - chart._vars.NODE_MIN_SIZE) * norm + chart._vars.NODE_MIN_SIZE;
            }
            else {
                var val = chart._vars.NODE_MIN_SIZE;
            }
            return val;
        }).strength(1))
        .force("charge", d3.forceManyBody().strength(-6))
        .stop();
    //

    //On Draw Move Points
    function moveTowardDataPosition(alpha) {
        return function (d) {
            d.x += (x(d.x) - d.x) * .1 * alpha;
            d.y += (y(d.y) - d.y) * .05 * alpha;
        };
    }

    for (var i = 0; i < 120; ++i) simulation.tick();

    var cell = svg.append("g")
        .attr("class", "cells")
        .selectAll("g")
        .data(d3.voronoi()
            .extent([[0, 0], [width, height]])
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            })
            .polygons(data)
        )
        .enter().append("g").attr("class", "cell-container");

    cell
        .append("circle")
        .attr("r", function (d, i, j) {
            if (dataTable.hasOwnProperty('size') && d != null && d.hasOwnProperty('data')) {
                var norm = (d.data[dataTable.size] - zAxisData.min) / (zAxisData.max - zAxisData.min);
                if (!isNaN(norm)) {
                    var val = (chart._vars.NODE_MAX_SIZE - chart._vars.NODE_MIN_SIZE) * norm + chart._vars.NODE_MIN_SIZE;
                }
                else {//If there is only 1 node on the chart
                    var val = chart._vars.NODE_MIN_SIZE;
                }

            }
            else if (d == null) {
                var val = 0;//Don't display undefined nodes
            }
            else {
                var val = chart._vars.NODE_MIN_SIZE;//Default node size of 15
            }
            //val = 3;
            return val;
        })
        .attr("cx", function (d) {
            if (d == null) {
                return;
            }
            else {
                return d.data.x;
            }
        })
        .attr("cy", function (d) {
            if (d == null) {
                return;
            }
            else {
                return d.data.y;
            }
        })
        .attr("fill", function (d) {
            if (d != null && d.data[chart._vars.colorDataCategory] === chart._vars.colorDataInstance) {
                return coloredPoint;
            }
            else {
                return pointColor;
            }
        })
        .attr("opacity", .8)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .on("mouseenter", function (d, i) {
            if (chart.draw.showToolTip) {
                var tipData = chart.setTipData(d, i);
                chart.tip.generateSimpleTip(tipData, dataTable, d3.event);
            }
            d3.select(this)
                .attr("fill", "red");
        })
        .on("mouseleave", function (d, i) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
            }
            d3.select(this)
                .attr("fill", function (d) {
                    if (d != null && d.data[chart._vars.colorDataCategory] === chart._vars.colorDataInstance) {
                        return coloredPoint;
                    }
                    else {
                        return pointColor;
                    }
                });
        });
}

function getSingleAxisData(data, dataTable) {
    var chart = this;
    var label,
        dataType,
        min,
        max,
        values = [];

    if (dataTable) {
        if (dataTable.hasOwnProperty('x')) {
            label = dataTable.x;
        }
    }

    dataType = 'NUMBER';

    for (var i = 0; i < data.length; i++) {
        values.push(data[i][dataTable.x]);
    }

    min = Math.min.apply(null, values);
    max = Math.max.apply(null, values);

    //Add a 10% buffer to both sides
    min = Math.floor(min - ((max - min) * .10));
    max = Math.ceil(max + ((max - min) * .10));

    //For axis min/max widget
    if (chart._vars.hasOwnProperty('xMin') && chart._vars.xMin != 'none') {
        min = chart.options.xMin;
    }
    if (chart._vars.hasOwnProperty('xMax') && chart._vars.xMax != 'none') {
        max = chart._vars.xMax;
    }

    return {
        'label': label,
        'values': values,
        'dataType': dataType,
        'min': min,
        'max': max
    }

}

module.exports = jvCharts;