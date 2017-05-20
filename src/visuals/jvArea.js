'use strict';
var jvCharts = require('../visuals/jvLine.js');

jvCharts.prototype.area = {
    paint: paint,
    setData: setData
};

jvCharts.prototype.fillArea = fillArea;

/************************************************ Line functions ******************************************************/

/**setLineData
 *  gets line data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    //sort chart data if there is a sort type and label in the _vars
    if (chart._vars.sortType) {
        if (chart._vars.sortLabel && chart._vars.sortType !== 'default') {
            chart.organizeChartData(chart._vars.sortLabel, chart._vars.sortType);
        }
    }

    //remove if we add non linear to area chart
    chart._vars.lineCurveType = 'Linear';

    chart.data.legendData = setBarLineLegendData(chart.data);
    chart.data.xAxisData = chart.setAxisData('x', chart.data);
    chart.data.yAxisData = chart.setAxisData('y', chart.data);

    //define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

/**setBarLineLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend tex
 */
function setBarLineLegendData(data) {
    var legendArray = [];
    for (var item in data.dataTable) {
        if (data.dataTable.hasOwnProperty(item)) {
            if (item !== 'label' && item.indexOf('tooltip') === -1) {
                legendArray.push(data.dataTable[item]);
            }
        }
    }
    return legendArray;
}
/** paintLineChart
 *
 * The initial starting point for line chart, begins the drawing process. Must already have the data stored in the chart
 * object
 */
function paint() {
    var chart = this;
    //Uses the original data and then manipulates it based on any existing options
    var dataObj = chart.getBarDataFromOptions();

    //assign current data which is used by all bar chart operations
    chart.currentData = dataObj;

    //Overwrite any pre-existing zoom
    chart.config.zoomEvent = null;

    //generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);
    chart.generateXAxis(dataObj.xAxisData);
    chart.generateYAxis(dataObj.yAxisData);
    chart.generateLegend(dataObj.legendData, 'generateLine');

    if (typeof dataObj.xAxisScale.ticks === "function") {
        chart.formatXAxisLabels(dataObj.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(dataObj.xAxisScale.domain().length);
    }

    chart.generateLine(dataObj);
}


/**
 *
 */
function fillArea(lineData) {

    var chart = this,
        svg = chart.svg,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        legendData = chart.currentData.legendData,
        //lineData = chart.currentData.chartData,
        container = chart.config.container,
        colors = chart._vars.color;

    //If a legend element is toggled off, use the new list of headers
    if (chart._vars.hasOwnProperty('legendHeaders')) {
        legendData = chart._vars.legendHeaders;
    }

    //Get the X and Y Scale
    var x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars, 'no-padding');
    var y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars, 'no-padding');

    //If axis are normal
    if (!chart._vars.rotateAxis) {
        var area = d3.area()
            .x(function (d) {
                if (d.x === '' ) {
                    return x('EMPTY_STRING');
                }
                return x(d.x);
            })
            .y0(container.height)
            .y1(function (d) {
                return y(d.y);
            });
    }
    else {
        var area = d3.area()
            .y(function (d) {
                return y(d.y);
            })
            .x1(0)
            .x0(function (d) {
                return x(d.x);
            });
    }


    var data = {};

    for (var i = 0; i < lineData.length; i++) {
        for (var k = 0; k < legendData.length; k++) {
            if (typeof legendData !== "undefined") {//Accounting for legend toggles
                if (legendData[k].toggle === false) {
                    //Don't write anything to data
                    continue;
                }
                else {
                    if (!data[legendData[k]]) {
                        data[legendData[k]] = [];
                    }
                    if (!chart._vars.rotateAxis) {
                        data[legendData[k]].push({
                            'x': lineData[i][xAxisData.label],
                            'y': parseFloat(lineData[i][legendData[k]])
                        });
                    }
                    else {
                        data[legendData[k]].push({
                            'y': lineData[i][yAxisData.label],
                            'x': parseFloat(lineData[i][legendData[k]])
                        });
                    }
                }
            }
            else {//Initial creation of visualization w/o legend options
                if (!data[legendData[k]]) {
                    data[legendData[k]] = [];
                }
                if (!chart._vars.rotateAxis) {
                    data[legendData[k]].push({
                        'x': lineData[i][xAxisData.label],
                        'y': parseFloat(lineData[i][legendData[k]])
                    });
                }
                else {
                    data[legendData[k]].push({
                        'y': lineData[i][yAxisData.label],
                        'x': parseFloat(lineData[i][legendData[k]])
                    });
                }
            }
        }
    }

    svg.selectAll(".area").remove();

    for (var i in data) {
        svg.append("path")
            .datum(data[i])
            .attr("class", function (d) {
                if (chart._vars.colorLine == true && chart._vars.thresholds != 'none' && chart._vars.colorChart != false) {
                    return "area area-threshold"
                } else {
                    return "area";
                }
            })
            .attr("d", area)
            .attr("fill", jvCharts.getColors(colors, k, i))
            .attr("opacity", 0.6)
            .attr("transform", function (d, i) {
                if (chart._vars.rotateAxis) {
                    var translation = container.height / lineData.length / 2;
                    return "translate(0, " + translation + ")";
                }
                else {
                    var translation = container.width / lineData.length / 2;
                    return "translate(" + translation + ", 0)";
                }
            })
            .attr("pointer-events", "none");
    }
}


module.exports = jvCharts;