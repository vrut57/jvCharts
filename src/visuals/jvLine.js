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
    //sort chart data if there is a sort type and label in the _vars
    if (chart._vars.sortType) {
        if (chart._vars.sortLabel && chart._vars.sortType !== 'default') {
            chart.organizeChartData(chart._vars.sortLabel, chart._vars.sortType);
        }
    }
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
            if (item !== 'label') {
                legendArray.push(data.dataTable[item]);
            }
        }
    }
    return legendArray;
}
/**paintLineChart
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
    if (chart._vars.rotateAxis) {
        chart.formatXAxisLabels(dataObj.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(dataObj.xAxisScale.domain().length);
    }

    chart.generateLine(dataObj);
}

/**generateLine
 *
 * Paints the lines
 * @params lineData
 */
function generateLine(lineData) {
    var chart = this,
        svg = chart.svg;

    svg.selectAll('g.line-container').remove();
    var lines = svg.append('g')
        .attr('class', 'line-container')
        .selectAll('g');

    var dataHeaders = chart._vars.seriesFlipped ? chart._vars.flippedLegendHeaders ? chart._vars.flippedLegendHeaders : lineData.legendData : chart._vars.legendHeaders ? chart._vars.legendHeaders : lineData.legendData;
    var lineDataNew = jvCharts.getToggledData(lineData, dataHeaders);

    //If it's an area chart, add the area
    if (chart.config.type === 'area') {
        chart.fillArea(lineDataNew);
    }

    generateLineGroups(lines, lineDataNew, chart);
    var eventGroups = jvCharts.generateEventGroups(lines, lineDataNew, chart);

    eventGroups
        .on('mouseover', function (d, i, j) { //Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.draw.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);

                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on('mousemove', function (d, i) {
            chart.tip.hideTip();
            svg.selectAll('.tip-line').remove();

            if (chart.draw.showToolTip) {
                var tipData = chart.setTipData(d, i);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on('mouseout', function (d) {
            chart.tip.hideTip();
            svg.selectAll('.tip-line').remove();
        });

    chart.displayValues();
    chart.generateClipPath();
    chart.generateLineThreshold();

    return lines;
}

/**generateLineGroups
 *
 * Paints the groups of the lines
 * @params chartContainer, barData, chart
 */
function generateLineGroups(lineContainer, lineData, chart) {
    var container = chart.config.container,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        legendData = chart.currentData.legendData,
        colors = chart._vars.color,
        lines;

    //Get Position Calculations
    var x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars, 'no-padding');
    var y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars, 'no-padding');

    var xTranslate,
        yTranslate;

    if (chart._vars.rotateAxis === true) {
        xTranslate = function (d, i) {
            if (d === '' ) {
                return x('EMPTY_STRING');
            }
            return x(d);
        };
        yTranslate = function (d, i) {
            return (y(lineData[i][yAxisData.label])) + (container.height / (lineData.length) / 2);//+ container.height / (lineData.length) / 2  - y.paddingInner());
        };
    } else {
        xTranslate = function (d, i) {
            if (lineData[i][xAxisData.label] === '') {
                lineData[i][xAxisData.label] = 'EMPTY_STRING';
            }
            return (x(lineData[i][xAxisData.label])) + (container.width / (lineData.length) / 2);//+ container.width / (lineData.length) / 2 - x.paddingInner());
        };
        yTranslate = function (d, i) {
            return y(d);
        };
    }

    //Append lines and circles

    var data = {};

    for (var i = 0; i < lineData.length; i++) {
        for (var k = 0; k < legendData.length; k++) {
            if (typeof chart._vars.legendOptions !== 'undefined') {//Accounting for legend toggles
                if (chart._vars.legendOptions[k].toggle === false) {
                    //Don't write anything to data
                    continue;
                }                else {
                    //Write something to data
                    if (!data[legendData[k]]) {
                        data[legendData[k]] = [];
                    }
                    data[legendData[k]].push(parseFloat(lineData[i][legendData[k]]));
                }
            }            else {//Initial creation of visualization w/o legend options
                if (!data[legendData[k]]) {
                    data[legendData[k]] = [];
                }
                if (data[legendData[k]].length < lineData.length) {
                    data[legendData[k]].push(parseFloat(lineData[i][legendData[k]]));
                }
            }
        }
    }

    chart.svg.selectAll('.lines').remove();

    chart.svg.selectAll('.line').remove();
    chart.svg.selectAll('.circle').remove();
    chart.svg.selectAll('#line-gradient').remove();

    lines = chart.svg.selectAll('.line-container');

    //curves object
    var curves = {
        'linear': d3.curveLinear,
        'step': d3.curveStep,
        'stepBefore': d3.curveStepBefore,
        'stepAfter': d3.curveStepAfter,
        'basis': d3.curveBasis,
        'cardinal': d3.curveCardinal,
        'monotoneX': d3.curveMonotoneX,
        'catmullRom': d3.curveCatmullRom
    };
    console.log(chart._vars.lineCurveType);

    var valueline = {};
    var circles = {};
    var index = 0;
    var lineColors = [];
    var thresholding = false;
    for (var k in data) {
        //Create path generator for each series
        if (data.hasOwnProperty(k)) {
            if (data[k] === '') {
                data[k] = 'EMPTY_STRING';
            }

            valueline[k] = d3.line()//line drawing function
                .curve(curves[chart._vars.lineCurveType])
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
                .append('path')//draws the line
                .attr('stroke', function (d, i, j) {
                    var colorObj = jvCharts.getColors(colors, i, k);
                    lineColors.push(colorObj);
                    return colorObj;
                })   //fills the bar with color
                .attr('stroke-width', '2')
                .attr('fill', 'none')
                .attr('d', valueline[k](data[k]));

            //Color Thresholding for each tier
            if (chart._vars.thresholds != 'none' && chart._vars.colorChart != false) {
                if (chart._vars.colorLine) {
                    var thresholdPercents = [];
                    if (chart._vars.rotateAxis) {
                        var zero = { percent: 0, color: lineColors[index] };
                        thresholdPercents.push(zero);

                        for (var z = 0; z < Object.keys(chart._vars.thresholds).length; z++) {
                            var pCent = ((chart._vars.thresholds[z].threshold) * 100) / (xAxisData.max - xAxisData.min);
                            var temp = { percent: pCent, color: chart._vars.thresholds[z].thresholdColor };
                            thresholdPercents.push(temp);
                        }
                    } else {
                        var zero = { percent: 0, color: lineColors[index] };
                        thresholdPercents.push(zero);

                        for (var z = 0; z < Object.keys(chart._vars.thresholds).length; z++) {
                            var pCent = ((chart._vars.thresholds[z].threshold) * 100) / (yAxisData.max - yAxisData.min);
                            var temp = { percent: pCent, color: chart._vars.thresholds[z].thresholdColor };
                            thresholdPercents.push(temp);
                        }
                    }


                    var thresholdData = chart.setLineThresholdData(chart, thresholdPercents, lineColors[index]);

                    lines.selectAll('path').attr('class', 'line-threshold');

                    if (chart._vars.rotateAxis) {
                        chart.svg.append('linearGradient')
                            .attr('id', 'line-gradient')
                            .attr('gradientUnits', 'userSpaceOnUse')
                            .attr('x1', xTranslate(xAxisData.min))
                            .attr('y1', 0)
                            .attr('x2', xTranslate(xAxisData.max))
                            .attr('y2', 0)
                            .selectAll('stop')
                            .data(thresholdData)
                            .enter().append('stop')
                            .attr('offset', function (d) { return d.offset; })
                            .attr('stop-color', function (d) { return d.color; });
                    } else {
                        chart.svg.append('linearGradient')
                            .attr('id', 'line-gradient')
                            .attr('gradientUnits', 'userSpaceOnUse')
                            .attr('x1', 0)
                            .attr('y1', yTranslate(yAxisData.min))
                            .attr('x2', 0)
                            .attr('y2', yTranslate(yAxisData.max))
                            .selectAll('stop')
                            .data(thresholdData)
                            .enter().append('stop')
                            .attr('offset', function (d) { return d.offset; })
                            .attr('stop-color', function (d) { return d.color; });
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
                .append('circle')//Circles for the joints in the line
                .attr('class', function (d, i) {
                    return 'circle-' + chart.currentData.chartData[i][chart.currentData.dataTable.label] + ' highlight-class-' + i;
                })
                .attr('cx', function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return xTranslate(d, i);
                })
                .attr('cy', function (d, i) {
                    if (isNaN(d)) {
                        return null;
                    }
                    return yTranslate(d, i);
                })
                .attr('fill', function (d, i, j) {
                    if (isNaN(d)) {
                        return null;
                    } else if (thresholding == true) {
                        var length = Object.keys(chart._vars.thresholds).length - 1;
                        if (chart._vars.rotateAxis) {
                            for (var z = length; z > -1; z--) {
                                var threshold = chart._vars.thresholds[z];
                                if (d >= threshold.threshold) {
                                    return threshold.thresholdColor;
                                }
                            }
                        } else {
                            for (var z = length; z > -1; z--) {
                                var threshold = chart._vars.thresholds[z];
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
                .attr('r', 2.5);

            index++;
        }
    }

    //Return line groups
    return lines.selectAll('.circle');
}

function setLineThresholdData(chart, thresholds) {
    var data = [];
    for (var k = 0; k < thresholds.length; k++) {
        var gradientOne = { offset: thresholds[k].percent + '%', color: thresholds[k].color };
        data.push(gradientOne);

        if (k + 1 < thresholds.length) {
            var gradientTwo = { offset: thresholds[k + 1].percent + '%', color: thresholds[k].color };
            data.push(gradientTwo);
        }

        if (k == thresholds.length - 1) {
            var last = { offset: '100%', color: thresholds[k].color };
            data.push(last);
        }
    }

    return data;
}

module.exports = jvCharts;
