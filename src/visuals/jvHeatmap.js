'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.heatmap = {
    paint: paint,
    setData: setData
};

jvCharts.prototype.generateHeatMap = generateHeatMap;

/************************************************ HeatMap functions ******************************************************/

function quantized(chart, min, max) {
    var bucketCount = chart.options.buckets;
    var sectionValue = (max - min) / bucketCount;
    var quantizedArray = [];
    for (var i = 0; i < bucketCount; i++) {
        quantizedArray[i] = min + i * sectionValue;
    }
    return quantizedArray;
}

/**setHeatMapData
 *  gets heatmap data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData(chart) {
    var axisNames = setHeatAxisNames(chart.data);
    chart.data.xAxisData = axisNames.xAxisData;
    chart.data.yAxisData = axisNames.yAxisData;
    chart.data.processedData = setProcessedData(chart.data, chart.data.xAxisData.values, chart.data.yAxisData.values);
    //define color object for chartData
    chart.options.color = jvCharts.setChartColors(chart.options.color, chart.data.xAxisData.values, chart.colors);
    chart.data.heatData = setHeatmapLegendData(chart, chart.data);
}

function setHeatmapLegendData(chart, data) {
    var heatData;
    var bucketMapper = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var bucketCount;
    chart.options.colors = organizeColors(chart);

    data.heatScores.sort(function(a, b) {
        return a - b;
    });

    chart.data.colorScale = d3.scaleQuantile()
        .domain(data.heatScores)
        .range(chart.options.colors);

    if (chart.options.quantiles === true) {
        var temp = chart.data.colorScale.quantiles();
        if(temp[0] === 0){
            heatData = chart.data.colorScale.quantiles();
        } else {
            heatData = [0].concat(chart.data.colorScale.quantiles());
        }
    } else {
        bucketCount = bucketMapper[chart.options.buckets - 1];
        heatData = quantized(chart, data.heatScores[0], data.heatScores[data.heatScores.length - 1]);
    }
    
    return heatData;
}

function organizeColors(chart) {
    var colorSelectedBucket = [];
    for (var c in chart.options.colors) {
        colorSelectedBucket.push(chart.options.colors[c]);
    }

    var sValue = chart.options.buckets;
    var newColors = [];
    var bucketMapper = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var bucketCount = bucketMapper[sValue - 1];
    for (var i = 0; i < bucketCount; i++) {
        if (i >= bucketCount / 2) {
            newColors[i] = colorSelectedBucket[Math.round((i + 1) / bucketCount * 20) - 1];
        } else {
            newColors[i] = colorSelectedBucket[Math.round((i) / bucketCount * 20)];
        }
    }
    var colors = newColors.slice(0);
    return colors;
}

function setHeatAxisNames(data) {
    var chartData = data.chartData;
    var xAxisName = data.dataTable.x;
    var yAxisName = data.dataTable.y;
    var xAxisArray = [];
    var yAxisArray = [];
    var returnObj = {};
    for (var i = 0; i < data.dataTableKeys.length; i++) {
        if (data.dataTableKeys[i].vizType === 'x') {
            returnObj.xAxisData = {};
            returnObj.xAxisData.dataType = data.dataTableKeys[i].type;
            returnObj.xAxisData.label = data.dataTable.x;
        }
        if (data.dataTableKeys[i].vizType === 'y') {
            returnObj.yAxisData = {};
            returnObj.yAxisData.dataType = data.dataTableKeys[i].type;
            returnObj.yAxisData.label = data.dataTable.y;
        }
    }

    for (var i = 0; i < chartData.length; i++) {
        if (xAxisArray.indexOf(chartData[i][xAxisName]) === -1) {
            xAxisArray.push(chartData[i][xAxisName]);
            //TODO make into 1 function for min max... waste of space
            if (returnObj.xAxisData.dataType === 'NUMBER') {
                //push min and max info
                if (!returnObj.xAxisData.min) {
                    returnObj.xAxisData.min = chartData[i][xAxisName];
                } else if (chartData[i][xAxisName] < returnObj.xAxisData.min) {
                    returnObj.xAxisData.min = chartData[i][xAxisName];
                }

                if (!returnObj.xAxisData.max) {
                    returnObj.xAxisData.max = chartData[i][xAxisName];
                } else if (chartData[i][xAxisName] < returnObj.xAxisData.max) {
                    returnObj.xAxisData.max = chartData[i][xAxisName];
                }
            }
        }
        if (yAxisArray.indexOf(chartData[i][yAxisName]) === -1) {
            yAxisArray.push(chartData[i][yAxisName]);
            if (returnObj.yAxisData.dataType === 'NUMBER') {
                //push min and max info
                if (!returnObj.yAxisData.min) {
                    returnObj.yAxisData.min = chartData[i][yAxisName];
                } else if (chartData[i][yAxisName] < returnObj.yAxisData.min) {
                    returnObj.yAxisData.min = chartData[i][yAxisName];
                }

                if (!returnObj.yAxisData.max) {
                    returnObj.yAxisData.max = chartData[i][yAxisName];
                } else if (chartData[i][yAxisName] < returnObj.yAxisData.max) {
                    returnObj.yAxisData.max = chartData[i][yAxisName];
                }
            }
        }
    }
    returnObj.xAxisData.values = xAxisArray;
    returnObj.yAxisData.values = yAxisArray;

    return returnObj;
}

function setProcessedData(data, xAxisArray, yAxisArray) {
    var chartData = data.chartData;
    var xAxisName = data.dataTable.x;
    var yAxisName = data.dataTable.y;
    var heat = data.dataTable.heat;
    var dataArray = [];
    data.heatScores = [];
        /*Assign each name a number and place matrix coordinates inside of dataArray */
    for (var i = 0; i < chartData.length; i++) {
        dataArray.push({
            value: chartData[i][heat],
            xAxisName: chartData[i][xAxisName],
            yAxisName: chartData[i][yAxisName]
        });
        //This array stores the values as numbers
        data.heatScores.push(chartData[i][heat]);
        for (var j = 0; j < xAxisArray.length; j++) {
            if (xAxisArray[j] === dataArray[i].xAxisName) {
                dataArray[i].xAxis = j;
                break;
            }
        }
        for (var j = 0; j < yAxisArray.length; j++) {
            if (yAxisArray[j] === dataArray[i].yAxisName) {
                dataArray[i].yAxis = j;
                break;
            }
        }
    }
    return dataArray;
}

function paint(chart) {
    chart.options.color = chart.data.color;
    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship
    var customMargin = {
        top: 0,
        right: 40,
        left: 0,
        bottom: 20
    };
    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, customMargin);
    //chart.generateLegend(chart.currentData.legendData, 'generateHeatMap');
    chart.generateHeatMap();
}

/**generateHeatMap
 *
 * paints the HeatMap on the chart
 * @params HeatMapData
 */
function generateHeatMap() {
    var chart = this,
        svg = chart.svg,
        colors = chart.options.colors,
        container = chart.config.container,
        minContainer = 300,
        quantiles = chart.options.quantiles,
        data = chart.data.processedData,
        toggleLegend = !chart.options.toggleLegend,
        scaleByMinCategory,
        scaleByContainer,
        heatMapData = chart.currentData;

    if (heatMapData.xAxisData.values.length > heatMapData.yAxisData.values.length) {
        scaleByMinCategory = heatMapData.xAxisData.values.length;
    } else {
        scaleByMinCategory = heatMapData.yAxisData.values.length;
    }

    if (container.width < minContainer || container.height < minContainer) {
        scaleByContainer = minContainer;
    }
    //else if(container.width > maxContainer && container.height > maxContainer){
    //scaleByContainer = maxContainer;
    //}
    else if (container.height > container.width) {
        scaleByContainer = container.width;
    } else {
        scaleByContainer = container.height;
    }

    var div = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    var gridSize = Math.floor(scaleByContainer / scaleByMinCategory);

    //Remove Scaling for right now
    //if (gridSize < 15) {
    //gridSize = 15;
    //} else if (gridSize > 115) {

    //}
    gridSize = 20;

    var vis = svg.append('g').attr('transform', 'translate(0,0)').attr('class', 'heatmap');

    var yAxisTitle = vis.selectAll('.heatmap')
        .data([heatMapData.dataTable.y]);

    yAxisTitle.enter().append('text')
        .attr('class', 'axisLabels bold')
        .attr('x', -21)
        .attr('y', -5)
        .attr('text-anchor', 'end')
        .text(function (d) {
            return d;
        });

    yAxisTitle.exit().remove();
    var formatType = jvCharts.jvFormatValueType(chart.currentData.yAxisData.values);

    var yAxis = vis.selectAll('.yAxis')
        .data(heatMapData.yAxisData.values)
        .enter().append('text')
        .text(function (d) {
            return jvCharts.jvFormatValue(d, formatType);
        })
        .attr('x', 0)
        .attr('y', function (d, i) {
            return i * gridSize;
        })
        .style('text-anchor', 'end')
        .style('font-size', chart.options.fontSize)
        .attr('transform', 'translate(-6,' + gridSize / 1.5 + ')')
        .attr('class', function (d, i) { return 'rowLabel pointer'; })
        .on('click', function (d) {
            //removing styling
            d3.selectAll('.rowLabel').classed('text-highlight', false);
            d3.selectAll('.colLabel').classed('text-highlight', false);
            d3.selectAll('.heat').classed('rect-highlight', false);
            d3.selectAll('.heat').classed('rect-border', false);
        })
        .on('click', function (d) {
            console.log(d);
            //fade all rects except in this row
            d3.selectAll('.heat').classed('rect-highlight', function (r, ri) {
                for (var i = 0; i < chart.currentData.yAxisData.values.length; i++) {
                    if (chart.currentData.yAxisData.values[i] === d && d) {
                        if (r.yAxis != i) {
                            return true;
                        }
                    }
                }
            });
        });

    var xAxisTitle = vis.selectAll('.xAxisTitle')
        .data([heatMapData.dataTable.x]);

    xAxisTitle.enter().append('text')
        .attr('class', 'axisLabels bold')
        .attr('x', 6)
        .attr('y', 9)
        .attr('transform', function (d, i) {
            return 'translate(' + -gridSize + ', -20)rotate(-45)';
        })
        .text(function (d) {
            return d;
        });

    xAxisTitle.exit().remove();

    var xAxis = vis.selectAll('.xAxis')
        .data(heatMapData.xAxisData.values)
        .enter().append('svg:g');

    formatType = jvCharts.jvFormatValueType(chart.currentData.xAxisData.values);

    xAxis.append('text')
        .text(function (d) {
            return jvCharts.jvFormatValue(d, formatType);
        })
        .style('text-anchor', 'start')
        .attr('x', 6)
        .attr('y', 7)
        .attr('class', function (d, i) { return 'colLabel pointer'; })
        .attr('transform', function (d, i) {
            return 'translate(' + ((i * gridSize)) + ', -6)rotate(-45)';
        })
        .style('font-size', chart.options.fontSize)
        .on('click', function (d) {
            //removing styling
            d3.selectAll('.rowLabel').classed('text-highlight', false);
            d3.selectAll('.colLabel').classed('text-highlight', false);
            d3.selectAll('.heat').classed('rect-highlight', false);
            d3.selectAll('.heat').classed('rect-border', false);
        })
        .on('click', function (d) {
            //fade all rects except in this column
            d3.selectAll('.heat').classed('rect-highlight', function (r, ri) {
                for (var i = 0; i < chart.currentData.xAxisData.values.length; i++) {
                    if (chart.currentData.xAxisData.values[i] === d) {
                        if (r.xAxis !== i) {
                            return true;
                        }
                    }
                }
            });
        });

    var width = heatMapData.xAxisData.values.length * gridSize;
    var height = heatMapData.yAxisData.values.length * gridSize;
    var formatValueType = jvCharts.jvFormatValueType(chart.data.heatData);

    //vertical lines
    var vLine = vis.selectAll('.vline')
        .data(d3.range(heatMapData.xAxisData.values.length + 1))
        .enter().append('line')
        .attr('x1', function (d) {
            return d * gridSize;
        })
        .attr('x2', function (d) {
            return d * gridSize;
        })
        .attr('y1', function (d) {
            return 0;
        })
        .attr('y2', function (d) {
            return height;
        })
        .style('stroke', '#eee');

    //horizontal lines
    var hLine = vis.selectAll('.hline')
        .data(d3.range(heatMapData.yAxisData.values.length + 1))
        .enter().append('line')
        .attr('y1', function (d) {
            return d * gridSize;
        })
        .attr('y2', function (d) {
            return d * gridSize;
        })
        .attr('x1', function (d) {
            return 0;
        })
        .attr('x2', function (d) {
            return width;
        })
        .style('stroke', '#eee');

    var heatMap = vis.selectAll('.heat')
        .data(data)
        .enter().append('rect')
        .attr('x', function (d) {
            return (d.xAxis) * gridSize;
        })
        .attr('y', function (d) {
            return (d.yAxis) * gridSize;
        })
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('class', 'heat')
        .attr('width', gridSize - 1)
        .attr('height', gridSize - 1)
        .style('fill', function (d) {
            if (quantiles === true) {
                if (chart.options.domainArray.length === 0 || (d.value >= chart.options.domainArray[0] && d.value <= chart.options.domainArray[1])) {
                    return chart.data.colorScale(d.value);
                }
                return 'white';
            }
            if (chart.options.domainArray.length == 0 || (d.value >= chart.options.domainArray[0] && d.value <= chart.options.domainArray[1])) {
                return getQuantizedColor(chart.data.heatData, d.value);
            }
            return 'white';
        })
        .on('mouseover', function (d, i) {
            //Get tip data
            var tipData = chart.setTipData(d, i);
            tipData.color = chart.data.colorScale(d.value);

            //Draw tip
            chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
        })
        .on('mouseout', function (d) {
            chart.tip.hideTip();
        })
        .on('click', function (d) {
            //removing styling
            d3.selectAll('.rowLabel').classed('text-highlight', false);
            d3.selectAll('.colLabel').classed('text-highlight', false);
            d3.selectAll('.heat').classed('rect-highlight', false);
            d3.selectAll('.heat').classed('rect-border', false);
        })
        .on('dblclick', function (d) {
            //border around selected rect
            d3.select(this).classed('rect-border', true);

            //Fade row labels
            d3.selectAll('.rowLabel').classed('text-highlight', function (r, ri) {
                if (!(ri == (d.yAxis))) {
                    return true;
                }
            });

            //fade column labels
            d3.selectAll('.colLabel').classed('text-highlight', function (r, ri) {
                if (!(ri == (d.xAxis))) {
                    return true;
                }
            });

            //fade all rects except selected
            d3.selectAll('.heat').classed('rect-highlight', function (r, ri) {
                if (r.yAxis != d.yAxis || r.xAxis != d.xAxis) {
                    return true;
                }
            });
        });

    
    chart.chartDiv.select("svg.heatLegend").remove();

    if (toggleLegend) {
        var legendContainer = chart.chartDiv.append('svg')
            .style('top', chart.config.margin.top + 'px')
            .style('background', chart.options.backgroundColor)
            .attr('class', 'heatLegend')
            .attr('width', chart.config.heatWidth);

        var legendTranslation = { x: 0, y: 15 },
            legendRectSize = gridSize,
            legendSpacing = 2,
            legendElementWidth = 20;

        if (gridSize > 20) {
            legendRectSize = 20;
        }

        var legend = legendContainer.selectAll('.legend')
            .data(chart.data.heatData)
            .enter().append('g')
            .attr('transform', function (d, i) {
                var height = legendRectSize + legendSpacing;
                var offset = height * chart.data.colorScale.domain().length / 2;
                var horz = -2 * legendRectSize;
                var vert = i * height - offset;
                return 'translate(' + 0 + ',' + (legendRectSize * i) + ')';
            });

        legend.append('rect')
            .attr('class', 'legend')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', function (d, i) {
                return colors[i];
            })
            .on('click', function (d) {
                //removing styling
                d3.selectAll('.heat').classed('rect-highlight', false);
            })
            .on('dblclick', function (d) {
                //removing styling
                //fade all rects except selected
                d3.selectAll('.heat').classed('rect-highlight', function (r, ri) {
                    if (r.value < d) {
                        return true;
                    }
                });
            });

        legend.append('text')
            .attr('class', 'legendText')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function (d) {
                if (isNaN(d)) {
                    return d;
                }
                return jvCharts.jvFormatValue(d, formatValueType);
            })
            .style('fill', 'black');
    }

    function getQuantizedColor(quantizedArray, value) {
        for (var i = 1; i < quantizedArray.length; i++) {
            if (value < quantizedArray[i]) {
                return colors[i - 1];
            }
        }
        return colors[quantizedArray.length - 1];
    }
}

module.exports = jvCharts;


