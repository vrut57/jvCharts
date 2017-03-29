'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.scatterplot = {
    paint: paint,
    setData: setData
};

jvCharts.prototype.generateScatter = generateScatter;
jvCharts.prototype.createLineGuide = createLineGuide;

/************************************************ Scatter functions ******************************************************/

/**setScatterData
 *  gets scatter data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData(chart) {
    chart.data.legendData = setScatterLegendData(chart.data);
    chart.data.xAxisData = setScatterAxisData(chart.data, 'x', chart._vars);
    chart.data.yAxisData = setScatterAxisData(chart.data, 'y', chart._vars);
    chart.data.zAxisData = chart.data.dataTable.hasOwnProperty('z') ? setScatterAxisData(chart.data, 'z', chart._vars) : {};
    //define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

/**setScatterLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setScatterLegendData(data) {
    var legendArray = [];
    if (data.dataTable.hasOwnProperty('series')) {
        var item = data.dataTable.series;
        for (var value in data.chartData) {
            var legendElement = data.chartData[value][item];
            if (legendArray.indexOf(legendElement) === -1) {
                legendArray.push(legendElement);
            }
        }
    } else if (data.dataTable.hasOwnProperty('label')) {
        legendArray.push(data.dataTable.label);
    }
    if (typeof legendArray[0] === 'undefined') {
        legendArray = [];
        legendArray.push(data.dataTable.label);
    }
    //order legend data in alphabetical order
    legendArray.sort();
    return legendArray;
}

/**setScatterAxisData
 *  gets z axis data based on the chartData
 *
 * @params data, dataTable
 * @returns object with label and values
 */
function setScatterAxisData(data, axis, _vars) {
    //declare vars
    var axisData = [],
        chartData = data.chartData,
        scatterLabel = data.dataTable[axis],
        min = scatterLabel ? chartData[0][scatterLabel] : 0,
        max = scatterLabel ? chartData[0][scatterLabel] : 0,
        dataType;
    
    for (var j = 0; j < data.dataTableKeys.length; j++) {
        if (data.dataTableKeys[j].vizType === axis) {
            dataType = data.dataTableKeys[j].type;
            break;
        }
    }
    //loop over data to find max and min
    //also determines the y axis total if the data is stacked
    for (var i = 1; i < chartData.length; i++) {
        if (chartData[i].hasOwnProperty(scatterLabel)) {
            var num = chartData[i][scatterLabel];
            if (!isNaN(num)) {
                num = parseFloat(num);
                if (num > max) {
                    max = num;
                } else if (num < min) {
                    min = num;
                }
            }
        }
    }
    if (axis !== 'z') {
        min *= 0.9;
        max *= 1.1;
    }

    if (_vars.yMin && !isNaN(_vars.yMin) && axis === 'y') {
        min = _vars.yMin;
    }
    if (_vars.yMax && !isNaN(_vars.yMax) && axis === 'y') {
        max = _vars.yMax;
    }
    if (_vars.xMin && !isNaN(_vars.xMin) && axis === 'x') {
        min = _vars.xMin;
    }
    if (_vars.xMax && !isNaN(_vars.xMax) && axis === 'x') {
        max = _vars.xMax;
    }

    axisData.push(min);
    axisData.push(max);
    return {
        'label': scatterLabel,
        'values': axisData,
        'dataType': 'NUMBER',
        'min': min,
        'max': max
    };
}

function paint(chart) {
    var dataObj = {};

    dataObj.chartData = chart.data.chartData;
    dataObj.legendData = chart.data.legendData;
    dataObj.dataTable = chart.data.dataTable;
    chart._vars.color = chart.data.color;
    dataObj.xAxisData = chart.data.xAxisData;
    dataObj.yAxisData = chart.data.yAxisData;
    dataObj.zAxisData = chart.data.zAxisData;
    chart.currentData = dataObj;

    //generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);

    //TODO remove these from draw object
    chart.generateXAxis(chart.currentData.xAxisData);
    chart.generateYAxis(chart.currentData.yAxisData);
    chart.generateLegend(chart.currentData.legendData, 'generateScatter');

    chart.generateScatter();
    chart.createLineGuide();

    if (typeof dataObj.xAxisScale.ticks === "function") {
        chart.formatXAxisLabels(dataObj.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(dataObj.xAxisScale.domain().length);
    }
}

function calculateMean(data, type) {
    return d3.mean(data, function (value) {
        return +value[type];
    });
}

function createLineGuide() {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        chartData = chart.currentData.chartData,
        dataTable = chart.currentData.dataTable,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData;

    var xLineVal = calculateMean(chartData, dataTable.x);
    var yLineVal = calculateMean(chartData, dataTable.y);

    var x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars);
    var y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars);

    svg.selectAll('g.lineguide.x').remove();
    svg.selectAll('g.lineguide.y').remove();

    var lineGroup = svg.append('g')
        .attr('class', 'line-group');

    //x line group for crosshair
    var lineGuideX = lineGroup.append('g')
        .attr('class', 'lineguide x')
        .append('line')
        .style('stroke', 'gray')
        .style('stroke-dasharray', ('3, 3'))
        .style('opacity', function () {
            if (chart._vars.lineGuide) {
                return 1;
            }
            return 0;
        })
        .style('fill', 'black');

    //y line group for crosshair
    var lineGuideY = lineGroup.append('g')
        .attr('class', 'lineguide y')
        .append('line')
        .style('stroke', 'gray')
        .style('stroke-dasharray', ('3, 3'))
        .style('opacity', function () {
            if (chart._vars.lineGuide) {
                return 1;
            }
            return 0;
        })
        .style('fill', 'black');

    //create crosshair based on median x (up/down) 'potentially' passed with data
    lineGuideX
        .attr('x1', x(xLineVal))
        .attr('y1', 0)
        .attr('x2', x(xLineVal))
        .attr('y2', container.height);

    //create crosshair based on median y (left/right) 'potentially' passed with data
    lineGuideY
        .attr('x1', 0)
        .attr('y1', y(yLineVal))
        .attr('x2', container.width)
        .attr('y2', y(yLineVal));

    return lineGroup;
}
/**generateScatter
 *
 * creates and draws a scatter plot on the svg element
 * @params svg, scatterData, _vars, xAxisData, yAxisData, zAxisData, container, dataTable legendData, chartName
 * @returns {{}}
 */
function generateScatter() {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        scatterData = chart.currentData.chartData,
        dataTable = chart.currentData.dataTable,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        zAxisData = chart.currentData.zAxisData,
        legendData = chart.currentData.legendData,
        colors = chart._vars.color,
        scatterDataNew = JSON.parse(JSON.stringify(scatterData));

    if (!chart._vars.NODE_MIN_SIZE) {
        chart._vars.NODE_MIN_SIZE = 4.5;
    }
    if (!chart._vars.NODE_MAX_SIZE) {
        chart._vars.NODE_MAX_SIZE = 25;
    }

    //set clip path rectangle
    svg.append('clipPath')
        .attr('id', 'scatter-area')
        .append('rect')
        .attr('x', 1)
        .attr('width', container.width - 1)
        .attr('height', container.height)
        .attr('fill', chart._vars.backgroundColor);

    svg.selectAll('g.scatter-container').remove();
    svg.selectAll('g.scatter-container.editable-scatter').remove();        

    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }

    var dataHeaders = chart._vars.legendHeaders;
    var legendElementToggleArray = jvCharts.getLegendElementToggleArray(dataHeaders, legendData);
    var scatterDataFiltered = [];

    if (legendElementToggleArray) {
        for (var j = 0; j < scatterDataNew.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (typeof scatterDataNew[j][dataTable.label] === 'undefined' || scatterDataNew[j][dataTable.label] === '') {
                    if (legendElementToggleArray[i].toggle === false) {
                        scatterDataNew[j][dataTable.x] = -1;
                        scatterDataNew[j][dataTable.y] = -1;
                        scatterDataNew[j][dataTable.z] = -1;
                    }
                } else if (legendElementToggleArray[i].element === scatterDataNew[j][dataTable.series] && legendElementToggleArray[i].toggle === false) {
                    scatterDataNew[j][dataTable.x] = -1;
                    scatterDataNew[j][dataTable.y] = -1;
                    scatterDataNew[j][dataTable.z] = -1;
                }
            }
        }
    }

    for (var j = 0; j < scatterDataNew.length; j++) {
        if (scatterDataNew[j][dataTable.x] !== -1 && scatterDataNew[j][dataTable.y] !== -1) {
            scatterDataFiltered.push(scatterDataNew[j]);
        }
    }

    var x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars);
    var y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars);

    if (zAxisData && typeof zAxisData === 'object' && Object.keys(zAxisData).length > 0) {
        console.log(zAxisData);
        var z = jvCharts.getZScale(zAxisData, container, chart._vars);
    }


    var cxTranslate,
        cyTranslate;

    cxTranslate = function (d, i) {
        return x(scatterDataFiltered[i][xAxisData.label]);
    };
    cyTranslate = function (d, i) {
        return y(scatterDataFiltered[i][yAxisData.label]);
    };

    var scatters = svg.append('g')
        .attr('class', 'scatter-container')
        .selectAll('g');
    var tempMouseOver;
    scatters
        .data(function () {
            return scatterDataFiltered;
        })
        .enter()
        .append('circle')
        .attr('clip-path', 'url(#scatter-area)')
        .attr('class', function (d, i) {
            return 'editable editable-scatter scatter-circle-' + i + ' highlight-class';
        })
        .attr('cx', function (d, i) {
            return cxTranslate(d, i);
        })
        .attr('cy', function (d, i) {
            return cyTranslate(d, i);
        })
        // .attr("clip-path", "url(.line-group)")
        .attr("opacity", 0.8)
        .attr('r', function (d, i) {
            if (dataTable.hasOwnProperty('z')) {
                if (chart._vars.toggleZ && zAxisData && typeof zAxisData === 'object' && Object.keys(zAxisData).length > 0 && scatterDataFiltered[i][dataTable.z]) {
                    return z(scatterDataFiltered[i][dataTable.z]);
                }
            }
            return chart._vars.NODE_MIN_SIZE;
        })
        .on('mouseover', function (d, i, j) {
            if (chart.draw.showToolTip) {
                this.setAttribute('clip-path', '');
                var tipData = chart.setTipData(d, i);

                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on('mousemove', function (d, i) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
                //Get tip data
                var tipData = chart.setTipData(d, i);
                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on('mouseout', function () {
            if (chart.draw.showToolTip) {
                this.setAttribute('clip-path', 'url(#scatter-area)');
                chart.tip.hideTip();
            }
        })
        .attr('fill', function (d, i) {
            var color;
            if (dataTable.hasOwnProperty('series')) {
                color = jvCharts.getColors(colors, i, scatterDataFiltered[i][dataTable.series]);
            } else {
                color = jvCharts.getColors(colors, i, scatterDataFiltered[i][dataTable.label]);
            }
            return color;
        });

    return scatters;
}

module.exports = jvCharts;
