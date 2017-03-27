'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.gantt = {
    paint: paint,
    setData: setData
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
function setData(chart) {
    chart.data.legendData = chart.setGanttLegendData(chart.data);
    chart.data.xAxisData = chart.setGanttAxisData(chart, 'x');
    chart.data.yAxisData = chart.setGanttAxisData(chart, 'y');
    //define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart.options.color, chart.data.legendData, chart.colors);
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
        chart.options.xAxisFormatting = {};

    } else {
        dataType = "STRING";
        var label = data.dataTable.group;

        //Add any axis formatting to this object, need to use when painting
        chart.options.yAxisFormatting = {};

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

function paint(chart) {
    chart.options.color = chart.data.color;

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
        options = chart.options,
        container = chart.config.container,
        yAxisData = ganttData.yAxisData;

    //Remove existing bars from page
    svg.selectAll("g.bar-container").remove();
    var bars = svg.append("g")
        .attr("class", "bar-container"),
        dataHeaders = chart.options.legendHeaders ? chart.options.legendHeaders : ganttData.legendData,
        ganttDataNew = jvCharts.getToggledData(ganttData, dataHeaders),
        x = jvCharts.getAxisScale('x', ganttData.xAxisData, container, null, null),
        y = jvCharts.getAxisScale('y', ganttData.yAxisData, container, null, null),
        sampleData = ganttDataNew;

    options.rotateAxis = true;

    //Create num bars variable and loop through to draw bars based on how many groups there are
    //var keys = Object.keys(ganttData.dataTable);
    //var count = 0;
    //for (var i = 0; i < keys.length; i++) {
    //    if (ganttData.dataTable[keys[i]] != null && ganttData.dataTable[keys[i]] != "") {
    //        count++;
    //    }
    //}
    //var numBars = Math.floor((count - 1) / 2);
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
        ganttBars[ii] = bars.selectAll(".gantt-bar" + ii)
            .data(sampleData)
            .enter()
            .append("rect")
            .attr("class", "gantt-bar" + ii)
            .attr("width", function (d, i) {
                return 0;
            })
            .attr("height", function (d, i) {
                return y.bandwidth() / numBars;
            })
            .attr("x", function (d, i) {
                if (d[startDates[ii]]) {
                    return x(new Date(d[startDates[ii]]));
                }
                else {
                    return 0;
                }
            })
            .attr("y", function (d, i) {
                return y(d[yAxisData.label]) + (y.bandwidth() / numBars * ii);
            })
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("fill", function (d, i, j) {
                var typeVal = chart.currentData.dataTable["Type" + (ii + 1)];
                if (chart.options.legendHeaders) {
                    var color = jvCharts.getColors(colors, 0, chart.options.legendHeaders[ii]);
                }
                else {
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

    var dataToPlot = jvCharts.getPlotData(ganttDataNew, chart);
    var eventGroups = bars.selectAll(".event-rect")
        .data(dataToPlot)
        .enter()
        .append('rect')
        .attr("class", "event-rect")
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
            if (chart.draw.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);
                //Draw tip
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }

        })
        .on("mousemove", function (d, i) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
                //Get tip data
                var tipData = chart.setTipData(d, i);
                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }

        })
        .on("mouseout", function (d) {
            if (chart.draw.showToolTip) {
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
        .attr("stroke", "black")
        .attr("stroke-width", "2px")
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
        .attr("text-anchor", "middle");
}

module.exports = jvCharts;