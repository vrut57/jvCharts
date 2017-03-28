'use strict';
var jvCharts = require('../jvCharts.js');


jvCharts.prototype.line = {
    paint: paint,
    setData: setData
};

jvCharts.prototype.generateLine = generateLine;
jvCharts.prototype.setLineThresholdData = setLineThresholdData;

/************************************************ Line functions ******************************************************/

/**setLineData
 *  gets line data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData(chart) {

    //sort chart data if there is a sort type and label in the options
    if (chart.options.sortType) {
        if (chart.options.sortLabel && chart.options.sortType !== 'default') {
            chart.organizeChartData(chart.options.sortLabel, chart.options.sortType, dataTableKeys);
        }
    }
    chart.data.legendData = setBarLineLegendData(chart.data);
    chart.data.xAxisData = chart.setAxisData('x', chart.data);
    chart.data.yAxisData = chart.setAxisData('y', chart.data);

    //define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart.options.color, chart.data.legendData, chart.colors);
};
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
            if (item !== 'label') {
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
function paint(chart) {
    //Uses the original data and then manipulates it based on any existing options
    var dataObj = chart.getBarDataFromOptions();

    //assign current data which is used by all bar chart operations
    chart.currentData = dataObj;

    //generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);
    chart.generateXAxis(dataObj.xAxisData);
    chart.generateYAxis(dataObj.yAxisData);
    chart.generateLegend(dataObj.legendData, 'generateLine');
    if(chart.options.rotateAxis) {
        chart.formatXAxisLabels(dataObj.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(dataObj.xAxisScale.domain().length);
    }

    chart.generateLine(dataObj);
};

/**
 * The initial starting point for the area chart. Similar to line chart logic with the addition of a fill area function.
 */
function paintAreaChart() {
    var chart = this;
    chart.paintLineChart();
}

/**
 *
 */
function fillArea(lineData) {

    var chart = this,
        svg = chart.svg,
        options = chart.options,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        legendData = chart.currentData.legendData,
        //lineData = chart.currentData.chartData,
        container = chart.config.container,
        colors = options.color;

    //If a legend element is toggled off, use the new list of headers
    if (options.hasOwnProperty('legendHeaders')) {
        legendData = options.legendHeaders;
    }

    //Get the X and Y Scale
    var x = jvCharts.getAxisScale('x', xAxisData, container, options, 'no-padding');
    var y = jvCharts.getAxisScale('y', yAxisData, container, options, 'no-padding');

    //If axis are normal
    if (!options.rotateAxis) {
        var area = d3.area()
            .x(function (d) {
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
                    if (!options.rotateAxis) {
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
                if (!options.rotateAxis) {
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

    var ii = 0;
    for (var i in data) {
        svg.append("path")
            .datum(data[i])
            .attr("class", function (d) {
                if (chart.options.colorLine == true && chart.options.thresholds != 'none' && chart.options.colorChart != false) {
                    return "area area-threshold"
                } else {
                    return "area";
                }
            })
            .attr("d", area)
            .attr("fill", function (d) {
                return jvCharts.getColors(colors, k, i);
            })
            .attr("opacity", 0.6)
            .attr("transform", function (d, i) {
                if (options.rotateAxis) {
                    var translation = container.height / lineData.length / 2;
                    return "translate(0, " + translation + ")";
                }
                else {
                    var translation = container.width / lineData.length / 2;
                    return "translate(" + translation + ", 0)";
                }
            })
            .attr("pointer-events", "none");
        ii++;
    }
}

/** generateLine
 *
 * Paints the lines
 * @params lineData
 */
function generateLine(lineData) {
    var chart = this,
        svg = chart.svg,
        options = chart.options,
        container = chart.config.container;


    svg.selectAll("g.line-container").remove();

    //Used to draw line that appears when tool tips are visible
    var tipLineX = 0,
        tipLineWidth = 0,
        tipLineHeight = 0,
        tipLineY = 0;

    var colors = options.color, x, y;

    svg.selectAll("g.line-container").remove();
    var lines = svg.append("g")
        .attr("class", "line-container")
        .selectAll("g");

    var dataHeaders = chart.options.seriesFlipped ? chart.options.flippedLegendHeaders ? chart.options.flippedLegendHeaders : lineData.legendData : chart.options.legendHeaders ? chart.options.legendHeaders : lineData.legendData;
    var lineDataNew = jvCharts.getToggledData(lineData, dataHeaders);

    //If it's an area chart, add the area
    if (chart.config.type === 'area') {
        chart.fillArea(lineDataNew);
    }

    var lineGroups = generateLineGroups(lines, lineDataNew, chart);
    var eventGroups = jvCharts.generateEventGroups(lines, lineDataNew, chart);

    eventGroups
        .on("mouseover", function (d, i, j) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.draw.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);

                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mousemove", function (d, i) {
            chart.tip.hideTip();
            svg.selectAll(".tip-line").remove();

            if (chart.draw.showToolTip) {
                var tipData = chart.setTipData(d, i);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on("mouseout", function (d) {
            chart.tip.hideTip();
            svg.selectAll(".tip-line").remove();
        });

    chart.displayValues();
    chart.generateClipPath();
    chart.generateLineThreshold();

    return lines;
};

/** generateLineGroups
 *
 * Paints the groups of the lines
 * @params chartContainer, barData, chart
 */
function generateLineGroups(lineContainer, lineData, chart) {
    var container = chart.config.container,
        options = chart.options,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        legendData = chart.currentData.legendData,
        colors = options.color,
        lines;

    //Get Position Calculations
    var x = jvCharts.getAxisScale('x', xAxisData, container, options, 'no-padding');
    var y = jvCharts.getAxisScale('y', yAxisData, container, options, 'no-padding');

    var xTranslate,
        yTranslate;

    if (options.rotateAxis === true) {
        xTranslate = function (d, i) {
            return x(d);
        };
        yTranslate = function (d, i) {
            return (y(lineData[i][yAxisData.label])) + (container.height / (lineData.length) / 2);// + container.height / (lineData.length) / 2  - y.paddingInner());
        };
    } else {
        xTranslate = function (d, i) {
            return (x(lineData[i][xAxisData.label])) + (container.width / (lineData.length) / 2);// + container.width / (lineData.length) / 2 - x.paddingInner());
        };
        yTranslate = function (d, i) {
            return y(d);
        };
    }

    //Append lines and circles

    var data = {};

    for (var i = 0; i < lineData.length; i++) {
        for (var k = 0; k < legendData.length; k++) {

            if (typeof options.legendOptions !== "undefined") {//Accounting for legend toggles
                if (options.legendOptions[k].toggle === false) {
                    //Don't write anything to data
                    continue;
                }
                else {
                    //Write something to data
                    if (!data[legendData[k]]) {
                        data[legendData[k]] = [];
                    }
                    data[legendData[k]].push(parseFloat(lineData[i][legendData[k]]));
                }
            }
            else {//Initial creation of visualization w/o legend options
                if (!data[legendData[k]]) {
                    data[legendData[k]] = [];
                }
                if (data[legendData[k]].length < lineData.length) {
                    data[legendData[k]].push(parseFloat(lineData[i][legendData[k]]));
                }
            }
        }

    }

    chart.svg.selectAll(".lines").remove();

    chart.svg.selectAll(".line").remove();
    chart.svg.selectAll(".circle").remove();
    chart.svg.selectAll("#line-gradient").remove();

    lines = chart.svg.selectAll(".line-container");

    var valueline = {};
    var circles = {};
    var index = 0;
    var lineColors = [];
    var max;
    var min;
    var thresholding = false;
    for (var k in data) {
        //Create path generator for each series
        if (data.hasOwnProperty(k)) {
            valueline[k] = d3.line()//line drawing function
                .x(function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return xTranslate(d, i);
                })
                .y(function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return yTranslate(d, i);
                });



            //Add lines to the line-container
            lines
                .append('g')
                .attr('class', 'line ' + (k))
                .append("path")//draws the line
                .attr('stroke', function (d, i, j) {
                    var colorObj = jvCharts.getColors(colors, i, k);
                    lineColors.push(colorObj);
                    return colorObj;
                })   // fills the bar with color
                .attr("stroke-width", "2")
                .attr("fill", "none")
                .attr("d", valueline[k](data[k]));

            //Color Thresholding for each tier
            if (chart.options.thresholds != 'none' && chart.options.colorChart != false) {
                if (chart.options.colorLine) {
                    var thresholdPercents = [];
                    if (chart.options.rotateAxis) {
                        var zero = { percent: 0, color: lineColors[index] };
                        thresholdPercents.push(zero);

                        for (var z = 0; z < Object.keys(chart.options.thresholds).length; z++) {
                            var pCent = ((chart.options.thresholds[z].threshold) * 100) / (xAxisData.max - xAxisData.min);
                            var temp = { percent: pCent, color: chart.options.thresholds[z].thresholdColor };
                            thresholdPercents.push(temp);
                        }
                    } else {
                        var zero = { percent: 0, color: lineColors[index] };
                        thresholdPercents.push(zero);

                        for (var z = 0; z < Object.keys(chart.options.thresholds).length; z++) {
                            var pCent = ((chart.options.thresholds[z].threshold) * 100) / (yAxisData.max - yAxisData.min);
                            var temp = { percent: pCent, color: chart.options.thresholds[z].thresholdColor };
                            thresholdPercents.push(temp);
                        }
                    }


                    var thresholdData = chart.setLineThresholdData(chart, thresholdPercents, lineColors[index]);

                    lines.selectAll("path").attr("class", "line-threshold");

                    if (chart.options.rotateAxis) {
                        chart.svg.append("linearGradient")
                            .attr("id", "line-gradient")
                            .attr("gradientUnits", "userSpaceOnUse")
                            .attr("x1", xTranslate(xAxisData.min))
                            .attr("y1", 0)
                            .attr("x2", xTranslate(xAxisData.max))
                            .attr("y2", 0)
                            .selectAll("stop")
                            .data(thresholdData)
                            .enter().append("stop")
                            .attr("offset", function (d) { return d.offset; })
                            .attr("stop-color", function (d) { return d.color; });
                    } else {
                        chart.svg.append("linearGradient")
                            .attr("id", "line-gradient")
                            .attr("gradientUnits", "userSpaceOnUse")
                            .attr("x1", 0)
                            .attr("y1", yTranslate(yAxisData.min))
                            .attr("x2", 0)
                            .attr("y2", yTranslate(yAxisData.max))
                            .selectAll("stop")
                            .data(thresholdData)
                            .enter().append("stop")
                            .attr("offset", function (d) { return d.offset; })
                            .attr("stop-color", function (d) { return d.color; });
                    }
                }
                thresholding = true;
            }

            //Add circles at joints in the lines
            circles[k] = lines
                .append('g')
                .attr('class', 'circle ' + (k))
                .selectAll('circle')
                .data(data[k])
                .enter()
                .append("circle")//Circles for the joints in the line
                .attr('class', function (d, i) {
                    return 'circle-' + chart.currentData.chartData[i][chart.currentData.dataTable.label] + ' highlight-class-' + i;
                })
                .attr("cx", function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return xTranslate(d, i);
                })
                .attr("cy", function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return yTranslate(d, i);
                })
                .attr('fill', function (d, i, j) {
                    if (isNaN(d)) {
                        return null;
                    } else if (thresholding == true) {
                        var length = Object.keys(chart.options.thresholds).length - 1;
                        if (chart.options.rotateAxis) {
                            for (var z = length; z > -1; z--) {
                                var threshold = chart.options.thresholds[z];
                                if (d >= threshold.threshold) {
                                    return threshold.thresholdColor;
                                }
                            }
                        } else {
                            for (var z = length; z > -1; z--) {
                                var threshold = chart.options.thresholds[z];
                                if (d >= threshold.threshold) {
                                    return threshold.thresholdColor;
                                }
                            }
                        }
                    }

                    return jvCharts.getColors(colors, i, k);
                })
                .attr('opacity', function (d, i, j) {
                    if (isNaN(d)) {
                        return 0;
                    }
                    return 1;
                })
                .attr("r", 2.5);

            index++;
        }
    }

    //Return line groups
    return lines.selectAll(".circle");
}

function setLineThresholdData(chart, thresholds, color) {
    var data = [];
    for (var k = 0; k < thresholds.length; k++) {
        var gradient;
        var gradientOne = { offset: thresholds[k].percent + "%", color: thresholds[k].color };
        data.push(gradientOne);

        if (k + 1 < thresholds.length) {
            var gradientTwo = { offset: thresholds[k + 1].percent + "%", color: thresholds[k].color };
            data.push(gradientTwo);
        }

        if (k == thresholds.length - 1) {
            var last = { offset: "100%", color: thresholds[k].color };
            data.push(last);
        }
    }

    return data;
}
 module.exports = jvCharts;
