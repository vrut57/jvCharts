'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.bar = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};


jvCharts.prototype.generateBarThreshold = generateBarThreshold;
jvCharts.prototype.generateBars = generateBars;


/**paint
 *
 * The initial starting point for bar chart, begins the drawing process. Must already have the data stored in the chart
 * object
 */
function paint(transitionTime) {
    var chart = this;
    if (transitionTime || transitionTime === 0) {
        chart._vars.transitionTime = transitionTime;
    } else if (!chart._vars.transitionTime) {
        chart._vars.transitionTime = 800;
    }
    //Uses the original data and then manipulates it based on any existing options
    var dataObj = chart.getBarDataFromOptions();

    //assign current data which is used by all bar chart operations
    chart.currentData = dataObj;

    //generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);
    chart.generateXAxis(dataObj.xAxisData);
    chart.generateYAxis(dataObj.yAxisData);
    chart.generateLegend(dataObj.legendData, 'generateBars');
    chart.generateBars(dataObj);

    if (typeof dataObj.xAxisScale.ticks === 'function') {
        chart.formatXAxisLabels(dataObj.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(dataObj.xAxisScale.domain().length);
    }
}


/**Sets the data for the bar chart prior to painting
 *  @function
 * @params {Object} data - Data passed into the chart
 * @params {Object} dataTable - Shows which data column is associated with each field in visual panel
 * @params {Object} dataTableKeys - Contains the data type for each column of data
 * @params {Object} colors - Colors object used to color the bars
 */
function setData() {
    var chart = this;
    //sort chart data if there is a sort type and label in the _vars
    if (chart._vars.hasOwnProperty('sortType') && chart._vars.sortType) {
        if (chart._vars.sortLabel && chart._vars.sortType !== 'default') {
            chart.organizeChartData(chart._vars.sortLabel, chart._vars.sortType);
        }
    }
    chart.data.legendData = setBarLineLegendData(chart.data);
    chart.data.xAxisData = chart.setAxisData('x', chart.data);
    chart.data.yAxisData = chart.setAxisData('y', chart.data);
    if (chart._vars.seriesFlipped) {
        chart.setFlippedSeries(chart.data.dataTableKeys);
        chart.flippedData.color = jvCharts.setChartColors(chart._vars.color, chart.flippedData.legendData, chart.colors);
    }

    //define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}


function getEventData(event) {
    var chart = this;
    if (event.target.classList.value.split('bar-col-')[1]) {
        return {
            data: {
                [chart.currentData.dataTable.label]: [event.target.classList.value.split('bar-col-')[1].replace(/_/g, ' ').replace(/_dot_/g, '.')]
            },
            node: event.target
        };
    }
    return {};
}

/**setBarLineLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
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

/************************************************ Bar functions ******************************************************/
function generateBarThreshold() {
    var chart = this,
        svg = chart.svg,
        width = chart.config.container.width,
        height = chart.config.container.height,
        thresholds = chart._vars.thresholds,
        length = thresholds !== 'none' ? Object.keys(thresholds).length : 0;

    var x = chart.currentData.xAxisScale;
    var y = chart.currentData.yAxisScale;

    if (thresholds !== 'none') {
        for (var i = 0; i < length; i++) {
            var threshold = thresholds[i];
            if (!chart._vars.xAxisThreshold) {
                if (chart._vars.rotateAxis) {
                    if (chart._vars.yMin === 'none') {
                        svg.append('line')
                            .style('stroke', threshold.thresholdColor)
                            .attr('x1', x(threshold.threshold))
                            .attr('y1', 0)
                            .attr('x2', x(threshold.threshold))
                            .attr('y2', height)
                            .attr('stroke-dasharray', ('3, 3'));
                    } else {
                        if (threshold.threshold > chart._vars.yMin) {
                            svg.append('line')
                                .style('stroke', threshold.thresholdColor)
                                .attr('x1', x(threshold.threshold))
                                .attr('y1', 0)
                                .attr('x2', x(threshold.threshold))
                                .attr('y2', height)
                                .attr('stroke-dasharray', ('3, 3'));
                        }
                    }
                } else {
                    if (chart._vars.yMin === 'none') {
                        svg.append('line')
                            .style('stroke', threshold.thresholdColor)
                            .attr('x1', 0)
                            .attr('y1', y(threshold.threshold))
                            .attr('x2', width)
                            .attr('y2', y(threshold.threshold))
                            .attr('stroke-dasharray', ('3, 3'));
                    } else {
                        if (threshold.threshold > chart._vars.yMin) {
                            svg.append('line')
                                .style('stroke', threshold.thresholdColor)
                                .attr('x1', 0)
                                .attr('y1', y(threshold.threshold))
                                .attr('x2', width)
                                .attr('y2', y(threshold.threshold))
                                .attr('stroke-dasharray', ('3, 3'));
                        }
                    }
                }
            }

            if (chart._vars.colorChart == true) {
                var thresholdRects = d3.selectAll('rect.rect-' + i);
                thresholdRects.attr('fill', threshold.thresholdColor);
            }
        }
    }
}

/**generateBars
 *
 * Does the actual painting of bars on the bar chart
 * @params barData
 */

function generateBars(barData) {
    var chart = this,
        svg = chart.svg;

    //Used to draw line that appears when tool tips are visible
    var tipLineX = 0,
        tipLineWidth = 0,
        tipLineHeight = 0,
        tipLineY = 0;

    //Removes any existing bar containers and creates a new one
    svg.selectAll('g.bar-container').remove();
    var bars = svg.append('g')
        .attr('class', 'bar-container')
        .selectAll('g');

    //Add logic to filter bardata
    var dataHeaders = barData.legendData;

    if (chart._vars.seriesFlipped && chart._vars.flippedLegendHeaders) {
        dataHeaders = chart._vars.flippedLegendHeaders;
    } else if (chart._vars.legendHeaders) {
        dataHeaders = chart._vars.legendHeaders;
    }

    var barDataNew = jvCharts.getToggledData(barData, dataHeaders);

    generateBarGroups(bars, barDataNew, chart);

    var eventGroups = jvCharts.generateEventGroups(bars, barDataNew, chart);

    //Add listeners

    eventGroups
        .on('mouseover', function (d, i, j) { //Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d, i);

                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                chart.tip.d = d;
                chart.tip.i = i;
                svg.selectAll('.tip-line').remove();

                var mouseItem = d3.select(this);
                tipLineX = mouseItem.node().getBBox().x;
                tipLineWidth = mouseItem.node().getBBox().width;
                tipLineHeight = mouseItem.node().getBBox().height;
                tipLineY = mouseItem.node().getBBox().y;

                //Draw line in center of event-rect
                svg
                    .append('line')
                    .attr('class', 'tip-line')
                    .attr('x1', function () {
                        return chart._vars.rotateAxis ? 0 : tipLineX + tipLineWidth / 2;
                    })
                    .attr('x2', function () {
                        return chart._vars.rotateAxis ? tipLineWidth : tipLineX + tipLineWidth / 2;
                    })
                    .attr('y1', function () {
                        return chart._vars.rotateAxis ? tipLineY + tipLineHeight / 2 : 0;
                    })
                    .attr('y2', function () {
                        return chart._vars.rotateAxis ? tipLineY + tipLineHeight / 2 : tipLineHeight;
                    })
                    .attr('fill', 'none')
                    .attr('shape-rendering', 'crispEdges')
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1px');
            }
        })
        .on('mousemove', function (d, i) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip();
                } else {
                    //Get tip data
                    var tipData = chart.setTipData(d, i);
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                }
            }
        })
        .on('mouseout', function (d) {
            if (chart.showToolTip) {
                chart.tip.hideTip();
                svg.selectAll('line.tip-line').remove();
            }
        });

    chart.displayValues();
    chart.generateClipPath();
    chart.generateBarThreshold();
}

/**generateBarGroups
 *
 * Paints the groups of the bars
 * @params chartContainer, barData, chart
 */
function generateBarGroups(chartContainer, barData, chart) {
    var container = chart.config.container,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        colors = chart._vars.color;


    var x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars);
    var y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars);

    var posCalc = jvCharts.getPosCalculations(barData, chart._vars, xAxisData, yAxisData, container, chart);


    var dataToPlot = jvCharts.getPlotData(barData, chart);

    var barGroups;
    if (xAxisData.dataType === 'STRING' || !xAxisData.hasOwnProperty('min')) {
        //Creates bar groups
        barGroups = chartContainer
            .data(dataToPlot)
            .enter()
            .append('g')
            .attr('class', 'bar-group')
            .attr('transform', function (d, i) {
                //Translate the bar groups by (outer padding * step) and the width of the bars (container.width / barData.length * i)
                return 'translate(' + ((x.paddingOuter() * x.step()) + (x.step() * i)) + ',0)';
            });
    } else if (xAxisData.dataType === 'NUMBER') {
        //Creates bar groups
        barGroups = chartContainer
            .data(dataToPlot)
            .enter()
            .append('g')
            .attr('class', 'bar-group')
            .attr('transform', function (d, i) {
                //Translate the bar groups by (outer padding * step) and the width of the bars (container.width / barData.length * i)
                return 'translate(0,' + ((y.paddingOuter() * y.step()) + (y.step() * i)) + ')';
            });
    }


    //Creates bars within bar groups
    var externalCounterForJ = -1;
    var bars = barGroups.selectAll('rect')
        .data(function (d) {
            return d;
        })
        .enter()
        .append('rect')
        .attr('class', function (d, i, j) {
            if (i === 0) {
                externalCounterForJ++;
            }
            var keys = Object.keys(barData[0]);
            var filteredKeys = [];
            for (var k = 0; k < keys.length; k++) {
                if (keys[k] !== chart.currentData.dataTable.label) {
                    filteredKeys.push(keys[k]);
                }
            }
            var label = String(barData[externalCounterForJ][chart.currentData.dataTable.label]).replace(/\s/g, '_').replace(/\./g, '_dot_');
            var legendVal = String(filteredKeys[i]).replace(/\s/g, '_').replace(/\./g, '_dot_');
            var thresholdDir;

            if (chart._vars.xAxisThreshold) {
                thresholdDir = chart.setThreshold(barData[externalCounterForJ][chart.currentData.dataTable.label]);
            } else {
                thresholdDir = chart.setThreshold(d);
            }

            return 'editable editable-bar bar-col-' + label + '-index-' + legendVal + ' highlight-class-' + label + ' rect ' + thresholdDir;
        })
        .attr('x', function (d, i) {
            return posCalc.startx(d, i);
        })
        .attr('y', function (d, i) {
            return posCalc.starty(d, i);
        })
        .attr('width', function (d, i) {
            return posCalc.startwidth(d, i);
        })
        .attr('height', function (d, i) {
            return posCalc.startheight(d, i);
        })
        .attr('fill', function (d, i) {
            if (chart._vars.seriesFlipped) {
                return jvCharts.getColors(colors, i, chart._vars.flippedLegendHeaders[i]);
            }
            return jvCharts.getColors(colors, i, chart._vars.legendHeaders[i]);
        })
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('opacity', 0.9)
        .attr('clip-path', function (d) {
            if (d > 30000000) {
                return 'url(#clip-above)';
            }
            return 'url(#clip-below)';
        });
    if (chart._vars.transitionTime > 0) {
        bars
            .transition()
            .duration(800)
            .ease(d3.easePolyOut)
            .attr('x', function (d, i, j) {
                return posCalc.x(d, i, j);
            })
            .attr('y', function (d, i, j) {
                return posCalc.y(d, i, j);
            })
            .attr('width', function (d, i) {
                return posCalc.width(d, i);
            })
            .attr('height', function (d, i) {
                return posCalc.height(d, i);
            });
    } else {
        bars
            .attr('x', function (d, i, j) {
                return posCalc.x(d, i, j);
            })
            .attr('y', function (d, i, j) {
                return posCalc.y(d, i, j);
            })
            .attr('width', function (d, i) {
                return posCalc.width(d, i);
            })
            .attr('height', function (d, i) {
                return posCalc.height(d, i);
            });
    }


    return barGroups;//returns the bar containers
}

module.exports = jvCharts;
