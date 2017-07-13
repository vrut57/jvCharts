'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.clustergrammer = {
    paint: paint,
    setData: setData,
    getEventData: null
};

jvCharts.prototype.generateClustergrammer = generateClustergrammer;

/************************************************ Clustergrammer functions ******************************************************/

function quantized(chart, min, max) {
    var bucketCount = chart._vars.buckets;
    var sectionValue = (max - min) / bucketCount;
    var quantizedArray = [];
    for (var i = 0; i < bucketCount; i++) {
        quantizedArray[i] = min + i * sectionValue;
    }
    return quantizedArray;
}

/**setClustergrammerData
 *  gets heatmap data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    var axisNames = setHeatAxisNames(chart.data);
    chart.data.xAxisData = axisNames.xAxisData;
    chart.data.yAxisData = axisNames.yAxisData;
    chart.data.processedData = setProcessedData(chart, chart.data, chart.data.xAxisData.values, chart.data.yAxisData.values);
    //define color object for chartData
    chart._vars.color = jvCharts.setChartColors(chart._vars.clusterColors, chart.data.xAxisData.values, chart.colors);
    chart.data.heatData = setClustergrammerLegendData(chart, chart.data);
}

function setClustergrammerLegendData(chart, data) {
    var heatData;
    var bucketMapper = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var bucketCount;
    chart._vars.clusterColors = organizeColors(chart);

    data.heatScores.sort(function(a, b) {
        return a - b;
    });

    chart.data.colorScale = d3.scaleQuantile()
        .domain(data.heatScores)
        .range(chart._vars.clusterColors);

    if (chart._vars.quantiles === true) {
        var temp = chart.data.colorScale.quantiles();
        if(temp[0] === 0){
            heatData = chart.data.colorScale.quantiles();
        } else {
            heatData = [0].concat(chart.data.colorScale.quantiles());
        }
    } else {
        bucketCount = bucketMapper[chart._vars.buckets - 1];
        heatData = quantized(chart, data.heatScores[0], data.heatScores[data.heatScores.length - 1]);
    }
    
    return heatData;
}

function organizeColors(chart) {
    var colorSelectedBucket = [];
    for (var c in chart._vars.clusterColors) {
        colorSelectedBucket.push(chart._vars.clusterColors[c]);
    }

    var sValue = chart._vars.buckets;
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

function setProcessedData(chart, data, xAxisArray, yAxisArray) {
    var chartData = data.chartData;
    var xAxisName = data.dataTable.x;
    var yAxisName = data.dataTable.y;
    var heat = data.dataTable.heat;
    var xCat = data.dataTable.x_category;
    var yCat = data.dataTable.y_category;
    var dataArray = [];
    data.heatScores = [];
        /*Assign each name a number and place matrix coordinates inside of dataArray */
    for (var i = 0; i < chartData.length; i++) {
        dataArray.push({
            value: chartData[i][heat],
            xAxisName: chartData[i][xAxisName],
            yAxisName: chartData[i][yAxisName],
            xAxisCat: chartData[i][xCat],
            yAxisCat: chartData[i][yCat]
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
    // if(xCat || yCat){
    //     let seenX = new Set();
    //     chart.dupsValuesX = [];
    //     var hasDuplicates = chartData.some(function(currentObject) {
    //         if(seenX.size === seenX.add(currentObject[xCat]).size) {
    //             // chart.dupsValuesX[currentObject[xCat]] = true;
    //         } else {
    //             // chart.dupsValuesX[currentObject[xCat]] = false;
    //             chart.dupsValuesX.push(currentObject[xCat]);
    //         }
    //     });

    //     let seenY = new Set();
    //     chart.dupsValuesY = [];
    //     var hasDuplicates = chartData.some(function(currentObject) {
    //         if(seenY.size === seenY.add(currentObject[yCat]).size) {
    //             chart.dupsValuesY[currentObject[yCat]] = true;
    //         } else {
    //             chart.dupsValuesY[currentObject[yCat]] = false;
    //         }
    //     });
    // }

    return dataArray;
}

function paint() {
    var chart = this;
    chart._vars.color = chart.data.color;
    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship
    var customMargin = {
        top: 0,
        right: 40,
        left: 0,
        bottom: 20
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, customMargin);
    //chart.generateLegend(chart.currentData.legendData, 'generateClustergrammer');
    chart.generateClustergrammer();
}

/**generateClustergrammer
 *
 * paints the Clustergrammer on the chart
 * @params ClustergrammerData
 */
function generateClustergrammer() {
    var chart = this,
        svg = chart.svg,
        colors = chart._vars.clusterColors,
        container = chart.config.container,
        minContainer = 300,
        quantiles = chart._vars.quantiles,
        data = chart.data.processedData,
        toggleLegend = !chart._vars.toggleLegend,
        clustergrammerData = chart.currentData,
        gridSize = chart._vars.heatGridSize,
        legendSpacing = chart._vars.heatLegendSpacing;

    var div = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    var vis = svg.append('g').attr('transform', 'translate(0,0)').attr('class', 'heatmap');

    var yAxisTitle = vis.selectAll('.heatmap')
        .data([clustergrammerData.dataTable.y]);

    yAxisTitle.enter().append('text')
        .attr('class', 'axisLabels bold')
        .attr('x', -21)
        .attr('y', -5)
        .attr('text-anchor', 'end')
        .attr('transform', function (d, i) {
            return 'translate(-' + (chart._vars.heatmapYmargin+10) + ',' + 0 + ')rotate(-90)';
        })
        .text(function (d) {
            return d;
        });

    yAxisTitle.exit().remove();
    var formatType = jvCharts.jvFormatValueType(chart.currentData.yAxisData.values, chart.currentData.yAxisData.dataType);

    var yAxisSection = vis.append('svg:g')
        .attr('class', 'yAxisSection')
        .attr('transform', function() {
            if(data[0].xAxisCat) {
                return 'translate(0,15)';
            }
        });

    var yAxis = yAxisSection.selectAll('.xAxis')
        .data(clustergrammerData.yAxisData.values)
        .enter().append('svg:g');

    yAxis.append('text')
        .text(function (d) {
            var str = jvCharts.jvFormatValue(d, formatType);
            if(str.length > 15) {
                return str.substring(0,14)+'...';
            }
            return str;
        })
        .attr('x', 0)
        .attr('y', function (d, i) {
            return i * gridSize;
        })
        .style('text-anchor', 'end')
        .style('font-size', chart._vars.fontSize)
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
            var paint = true;
            if(d === chart._vars.selectedX) {
                chart._vars.selectedX = '';
                paint = false;
            } else {
                chart._vars.selectedX = d;
            }

            //fade all rects except in this row
            d3.selectAll('.heat').classed('rect-highlight', function (r, ri) {
                for (var i = 0; i < chart.currentData.yAxisData.values.length; i++) {
                    if (chart.currentData.yAxisData.values[i] === d && d) {
                        if (r.yAxis != i && paint) {
                            return true;
                        }
                    }
                }
            });
        })
        
    yAxis.append('title')
        .text(function (d) {
            return d;
        });

    var catColor = d3.scaleOrdinal(d3.schemeCategory20);

    if(data[0].xAxisCat){

        let seenX = new Set();
        chart.dupsValuesX = [];
        
        var xAxisCat = vis.selectAll('.xAxisCat')
            .data(data);
        
        xAxisCat.enter().append('rect')
            .attr('x', function (d) {
                if(seenX.size === seenX.add((d.xAxis) * gridSize).size) {
                    chart.dupsValuesX[(d.xAxis) * gridSize] = true;
                } else {
                    chart.dupsValuesX[(d.xAxis) * gridSize] = false;
                }
                return (d.xAxis) * gridSize;
            })
            .attr('y', function (d) {
                return 0;
            })
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('class', 'xAxisCat')
            .attr('transform', function() {
                if(data[0].yAxisCat) {
                    return 'translate(15,0)';
                }
            })
            .attr('width', gridSize - 1)
            .attr('height', gridSize / 2)
            .style('fill', function (d) {
                if(chart.dupsValuesX[(d.xAxis) * gridSize] === true) {
                    return "Black";
                } else {
                    return catColor(d.xAxisCat);
                }
            })
            .on('mouseover', function (d, i) {
                //Get tip data
                var tipData = chart.setTipData(d, i);
                if(chart.dupsValuesX[(d.xAxis) * gridSize] === true) {
                    tipData.color = "Black";
                    tipData.xAxisCat = "Multiple";
                } else {
                    tipData.color = catColor(d.xAxisCat);
                    tipData.xAxisCat = d.xAxisCat;
                }
                

                //Draw tip
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                chart.tip.d = d;
                chart.tip.i = i;
            })
            .on('mousemove', function (d, i) {
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
            .on('mouseout', function (d) {
                chart.tip.hideTip();
            });
    }

    if(data[0].yAxisCat){

        let seenY = new Set();
        chart.dupsValuesY = [];

        var yAxisCat = vis.selectAll('.yAxisCat')
            .data(data);
        
        yAxisCat.enter().append('rect')
            .attr('x', function (d) {
                return 0;
            })
            .attr('y', function (d) {
                if(seenY.size === seenY.add((d.yAxis) * gridSize).size) {
                    chart.dupsValuesY[(d.yAxis) * gridSize] = true;
                } else {
                    chart.dupsValuesY[(d.yAxis) * gridSize] = false;
                }
                return (d.yAxis) * gridSize;
            })
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('class', 'yAxisCat')
            .attr('transform', function() {
                if(data[0].xAxisCat) {
                    return 'translate(0,15)';
                }
            })
            .attr('width', gridSize / 2)
            .attr('height', gridSize - 1)
            .style('fill', function (d) {
                if(chart.dupsValuesY[(d.yAxis) * gridSize] === true) {
                    return "Black";
                } else {
                    return catColor(d.yAxisCat);
                }
            })
            .on('mouseover', function (d, i) {
                //Get tip data
                var tipData = chart.setTipData(d, i);
                if(chart.dupsValuesY[(d.yAxis) * gridSize] === true) {
                    tipData.color = "Black";
                    tipData.yAxisCat = "Multiple";
                } else {
                    tipData.color = catColor(d.yAxisCat);
                    tipData.yAxisCat = d.yAxisCat;
                }

                //Draw tip
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                chart.tip.d = d;
                chart.tip.i = i;
            })
            .on('mousemove', function (d, i) {
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
            .on('mouseout', function (d) {
                chart.tip.hideTip();
            });
    }
    

    var xAxisTitle = vis.selectAll('.xAxisTitle')
        .data([clustergrammerData.dataTable.x]);

    xAxisTitle.enter().append('text')
        .attr('class', 'axisLabels bold')
        .attr('x', 6)
        .attr('y', 9)
        .attr('transform', function (d, i) {
            return 'translate(' + 0 + ', -' + (chart._vars.heatmapXmargin-10) +')';
        })
        .text(function (d) {
            return d;
        });

    xAxisTitle.exit().remove();

    var xAxisSection = vis.append('svg:g')
        .attr('class', 'xAxisSection')
        .attr('transform', function() {
            if(data[0].yAxisCat) {
                return 'translate(15,0)';
            }
        });

    var xAxis = xAxisSection.selectAll('.xAxis')
        .data(clustergrammerData.xAxisData.values)
        .enter().append('svg:g');

    formatType = jvCharts.jvFormatValueType(chart.currentData.xAxisData.values, chart.currentData.xAxisData.dataType);

    xAxis.append('text')
        .text(function (d) {
            var str = jvCharts.jvFormatValue(d, formatType);
            if(str.length > 15) {
                return str.substring(0,14)+'...';
            }
            return str;
        })
        .style('text-anchor', 'start')
        .attr('x', 6)
        .attr('y', 7)
        .attr('class', function (d, i) { return 'colLabel pointer'; })
        .attr('transform', function (d, i) {
            return 'translate(' + ((i * gridSize)) + ', -6)rotate(-45)';
        })
        .attr('title', function(d) {
            return d;
        })
        .style('font-size', chart._vars.fontSize)
        .on('click', function (d) {
            //removing styling
            d3.selectAll('.rowLabel').classed('text-highlight', false);
            d3.selectAll('.colLabel').classed('text-highlight', false);
            d3.selectAll('.heat').classed('rect-highlight', false);
            d3.selectAll('.heat').classed('rect-border', false);
        })
        .on('click', function (d) {
            var paint = true;
            if(d === chart._vars.selectedX) {
                chart._vars.selectedX = '';
                paint = false;
            } else {
                chart._vars.selectedX = d;
            }
            //fade all rects except in this column
            d3.selectAll('.heat').classed('rect-highlight', function (r, ri) {
                for (var i = 0; i < chart.currentData.xAxisData.values.length; i++) {
                    if (chart.currentData.xAxisData.values[i] === d) {
                        if (r.xAxis !== i && paint) {
                            return true;
                        }
                    }
                }
            });
        });

    xAxis.append('title')
        .text(function (d) {
            return d;
        });

    var width = clustergrammerData.xAxisData.values.length * gridSize;
    var height = clustergrammerData.yAxisData.values.length * gridSize;
    var formatValueType = jvCharts.jvFormatValueType(chart.data.heatData);

    //vertical lines
    var vLine = vis.append('svg:g')
        .attr('class', 'vLineSection')
        .attr('transform', function() {
            if(data[0].xAxisCat && data[0].yAxisCat){
                return 'translate(15,15)';
            } else if(data[0].xAxisCat) {
                return 'translate(0,15)';
            } else if(data[0].yAxisCat) {
                return 'translate(15,0)';
            }
        });

    vLine.selectAll('.vLineSection')
        .data(d3.range(clustergrammerData.xAxisData.values.length + 1))
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
        .style('stroke', chart._vars.axisColor);

    //horizontal lines
    var hLine = vis.append('svg:g')
        .attr('class', 'hLineSection')
        .attr('transform', function() {
            if(data[0].xAxisCat && data[0].yAxisCat){
                return 'translate(15,15)';
            } else if(data[0].xAxisCat) {
                return 'translate(0,15)';
            } else if(data[0].yAxisCat) {
                return 'translate(15,0)';
            }
        });

    hLine.selectAll('.hLineSection')
        .data(d3.range(clustergrammerData.yAxisData.values.length + 1))
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
        .style('stroke', chart._vars.axisColor);

    var clustergrammer = vis.append('svg:g')
        .attr('class', 'heatSection')
        .attr('transform', function() {
            if(data[0].xAxisCat && data[0].yAxisCat){
                return 'translate(15,15)';
            } else if(data[0].xAxisCat) {
                return 'translate(0,15)';
            } else if(data[0].yAxisCat) {
                return 'translate(15,0)';
            }
        });

    clustergrammer.selectAll('.heatSection')
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
        .attr('fill-opacity', chart._vars.opacity)
        .style('fill', function (d) {
            if (quantiles === true) {
                if (chart._vars.domainArray.length === 0 || (d.value >= chart._vars.domainArray[0] && d.value <= chart._vars.domainArray[1])) {
                    return chart.data.colorScale(d.value);
                }
                return 'white';
            }
            if (chart._vars.domainArray.length == 0 || (d.value >= chart._vars.domainArray[0] && d.value <= chart._vars.domainArray[1])) {
                return getQuantizedColor(chart.data.heatData, d.value);
            }
            return 'white';
        })
        .on('mouseover', function (d, i) {
            //Get tip data
            var tipData = chart.setTipData(d, i);
            tipData.color = chart.data.colorScale(d.value);

            //Draw tip
            chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
            chart.tip.d = d;
            chart.tip.i = i;

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
        })
        .on('mousemove', function (d, i) {
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
        .on('mouseout', function (d) {
            chart.tip.hideTip();

            //removing styling
            d3.selectAll('.rowLabel').classed('text-highlight', false);
            d3.selectAll('.colLabel').classed('text-highlight', false);
            d3.selectAll('.heat').classed('rect-highlight', false);
            d3.selectAll('.heat').classed('rect-border', false);
        });

    
    chart.chartDiv.select("svg.heatLegend").remove();

    if (toggleLegend) {
        var legendContainer = chart.chartDiv.append('svg')
            .style('top', chart.config.margin.top + 'px')
            .style('background', chart._vars.backgroundColor)
            .attr('class', 'heatLegend')
            .attr('width', chart.config.heatWidth);

        var legend = legendContainer.selectAll('.legend')
            .data(chart.data.heatData)
            .enter().append('g')
            .attr('transform', function (d, i) {
                var height = gridSize + legendSpacing;
                var offset = height * chart.data.colorScale.domain().length / 2;
                var horz = -2 * gridSize;
                var vert = i * height - offset;
                return 'translate(' + 0 + ',' + (gridSize * i) + ')';
            });

        legend.append('rect')
            .attr('class', 'legend')
            .attr('width', gridSize)
            .attr('height', gridSize)
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
            .attr('x', gridSize + legendSpacing)
            .attr('y', gridSize - legendSpacing)
            .text(function (d) {
                if (isNaN(d)) {
                    return d;
                }
                return jvCharts.jvFormatValue(d, formatValueType);
            })
            .style('fill', chart._vars.black);
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

