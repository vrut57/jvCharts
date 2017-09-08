'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.gantt = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generateGanttBars = generateGanttBars;
jvCharts.prototype.setGanttLegendData = setGanttLegendData;
jvCharts.prototype.setGanttAxisData = setGanttAxisData;

/************************************************ Gantt functions ******************************************************/

    /**
 *
 * @param data
 * @param dataTable
 * @param colors
 */
function setData() {
    var chart = this;
    chart.data.legendData = chart.setGanttLegendData(chart.data);
    chart.data.xAxisData = chart.setGanttAxisData(chart, 'x');
    chart.data.yAxisData = chart.setGanttAxisData(chart, 'y');
    //define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

function getEventData(event) {
    var chart = this;
    var ele = event.target.classList.value.split('bar-col-')[1];
    if (ele) {
        return {
            data: {
                [chart.currentData.dataTable.group]: [ele.replace(/_/g, ' ').replace(/_colon_/g, ':').replace(/_dot_/g, '.')]
            },
            node: event.target
        };
    }
    return {};
}

function setGanttLegendData(data) {
    var legendArray = [];
    for (var i = 1; i <= Object.keys(data.dataTable).length; i++) {
        if (data.dataTable.hasOwnProperty(["start " + i])) {
            //check to make sure it has a matching end date
            if (data.dataTable.hasOwnProperty(["end " + i])) {
                legendArray.push(data.dataTable["start " + i]);
            }
        }

    }
    return legendArray;
}

function setGanttAxisData(chart, axis) {
    var axisData = [],
        data = chart.data,
        chartData = data.chartData,
        dataType;

    if (axis === 'x') {
        var label = data.dataTable.group;
        dataType = 'DATE';

        var numBars = data.legendData.length;
        //Loop through dataTable and assign labels based on how many groups there are
        var valueContainer = [];
        valueContainer.push(data.dataTable["start 1"]);
        valueContainer.push(data.dataTable["end 1"]);
        for (var i = 1; i < numBars; i++) {
            valueContainer.push(data.dataTable["start " + (i + 1)]);
            valueContainer.push(data.dataTable["end " + (i + 1)]);
        }

        //Get all the start and end dates and add them to axis data
        for (var i = 0; i < valueContainer.length; i++) {
            for (var ii = 0; ii < chartData.length; ii++) {
                if (chartData[ii][valueContainer[i]] != null) {
                    axisData.push(chartData[ii][valueContainer[i]]);
                }
            }
        }

        //Add any axis formatting to this object, need to use when painting
        chart._vars.xAxisFormatting = {};

    } else {
        dataType = "STRING";
        var label = data.dataTable.group;

        //Add any axis formatting to this object, need to use when painting
        chart._vars.yAxisFormatting = {};

        for (var i = 0; i < chartData.length; i++) {
            axisData.push(chartData[i][label]);
        }
    }

    return {
        'label': label,
        'values': axisData,
        'dataType': dataType
    };
}

function paint() {
    var chart = this;

    chart._vars.color = chart.data.color;

    chart.currentData = chart.data;

    chart.generateSVG(chart.currentData.legendData);
    chart.generateXAxis(chart.currentData.xAxisData);
    chart.generateYAxis(chart.currentData.yAxisData);
    chart.generateLegend(chart.currentData.legendData, 'generateGanttBars');
    chart.drawGridlines(chart.currentData.xAxisData);
    chart.generateGanttBars(chart.currentData);
    if (typeof chart.currentData.xAxisScale.ticks === "function") {
        chart.formatXAxisLabels(chart.currentData.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(chart.currentData.xAxisScale.domain().length);
    }
}

function generateGanttBars(ganttData) {
    var chart = this,
        svg = chart.svg,
        colors = ganttData.color,
        container = chart.config.container,
        yAxisData = ganttData.yAxisData;

    //Remove existing bars from page
    svg.selectAll("g.gantt-container").remove();
    var bars = svg.append("g")
        .attr("class", "gantt-container"),
        dataHeaders = chart._vars.legendHeaders ? chart._vars.legendHeaders : ganttData.legendData,
        ganttDataNew = jvCharts.getToggledData(ganttData, dataHeaders),
        x = jvCharts.getAxisScale('x', ganttData.xAxisData, container, chart._vars),
        y = jvCharts.getAxisScale('y', ganttData.yAxisData, container, chart._vars),
        sampleData = ganttDataNew;

    chart._vars.rotateAxis = true;

    var numBars = ganttData.legendData.length;
    var ganttBars = [];
    //create array of start dates and end dates to iterate through
    var startDates = [];
    var endDates = [];
    for (var i = 1; i <= numBars; i++) {
        startDates.push(chart.currentData.dataTable["start " + i]);
        endDates.push(chart.currentData.dataTable["end " + i]);
    }
    
    for (var ii = 0; ii < numBars; ii++) {
        var externalCounterForJ = -1;
        ganttBars[ii] = bars.selectAll(".gantt-bar" + ii)
            .data(sampleData)
            .enter()
            .append("rect")
            .attr('class', function (d, i, j) {
                externalCounterForJ++;
                var label = String(sampleData[externalCounterForJ][chart.currentData.dataTable.group]).replace(/\s/g, '_').replace(/:/g, '_colon_').replace(/\./g, '_dot_');

                return 'gantt-bar' + ii + ' editable editable-bar bar-col-' + label + '-index-' + ii + ' highlight-class-' + label + ' rect ';
            })
            .attr("width", 0)
            .attr("height", y.bandwidth() / numBars)
            .attr("x", function (d, i) {
                if (d[startDates[ii]]) {
                    return x(new Date(d[startDates[ii]]));
                }
                return 0;
            })
            .attr("y", function (d, i) {
                return y(d[yAxisData.label]) + (y.bandwidth() / numBars * ii);
            })
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("fill", function (d, i, j) {
                var typeVal = chart.currentData.dataTable["Type" + (ii + 1)];
                if (chart._vars.legendHeaders) {
                    var color = jvCharts.getColors(colors, 0, chart._vars.legendHeaders[ii]);
                } else {
                    var color = jvCharts.getColors(colors, 0, chart.currentData.legendData[ii]);
                }
                return color;
            });


        ganttBars[ii].transition()
            .duration(400)
            .delay(100)
            .attr("width", function (d, i) {
                var width = x(new Date(d[endDates[ii]])) - x(new Date(d[startDates[ii]]));//(x(d.StartDate) - x(d.EndDate));
                if (width >= 0) {
                    return width;
                }
                else {
                    return 0;
                }
            });
    }
    var externalCounterForJJ = -1;
    var dataToPlot = jvCharts.getPlotData(ganttDataNew, chart);
    var eventGroups = bars.selectAll(".event-rect")
        .data(dataToPlot)
        .enter()
        .append('rect')
        .attr("class", "event-rect")
        .attr('class', function (d, i, j) {
            externalCounterForJJ++;
            var label = String(sampleData[externalCounterForJJ][chart.currentData.dataTable.group]).replace(/\s/g, '_').replace(/:/g, '_colon_').replace(/\./g, '_dot_');
            return 'event-rect bar-col-' + label;
        })
        .attr("x", 0)
        .attr("y", function (d, i) {
            return container.height / ganttDataNew.length * i;
        })
        .attr("width", container.width)
        .attr("height", function (d, i) {
            return container.height / ganttDataNew.length;
        })
        .attr("fill", "transparent")
        .attr("transform", "translate(0,0)");
    eventGroups
        .on("mouseover", function (d, i, j) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);
                //Draw tip
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                chart.tip.d = d;
                chart.tip.i = i;
            }

        })
        .on("mousemove", function (d, i) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(d3.event);
                } else {
                    //Get tip data
                    var tipData = chart.setTipData(d, i);
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                }
            }
        })
        .on("mouseout", function (d) {
            if (chart.showToolTip) {
                chart.tip.hideTip();
            }
        });

    var currentDate = new Date();
    var dateData = [currentDate];
    //Draws a line representing the current date
    svg.selectAll(".currentDateLine")
        .data(dateData)
        .enter()
        .append("line")
        .attr("x1", function (d, i) {
            return x(d);
        })
        .attr("x2", function (d, i) {
            return x(d);
        })
        .attr("y1", function (d, i) {
            return "0px";
        })
        .attr("y2", function (d, i) {
            return chart.config.container.height;
        })
        .attr("class", "currentDateLine")
        .attr("stroke", chart._vars.axisColor)
        .attr("stroke-width", chart._vars.STROKE_WIDTH)
        .attr("stroke-dasharray", ("3, 3"));


    svg.selectAll(".currentDateLabel")
        .data(dateData)
        .enter()
        .append("text")
        .text(function () {
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!

            var yyyy = today.getFullYear();
            if (dd < 10) {
                dd = '0' + dd
            }
            if (mm < 10) {
                mm = '0' + mm
            }
            var today = mm + '/' + dd + '/' + yyyy;
            return today;
        })
        .attr("x", function (d, i) {
            return x(d);
        })
        .attr("y", function (d, i) {
            return "-10px";
        })
        .attr("text-anchor", "middle")
        .attr('fill', chart._vars.fontColor);
}

module.exports = jvCharts;