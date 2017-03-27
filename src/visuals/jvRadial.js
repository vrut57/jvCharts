'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.radial = {
    paint: paint,
    setData: setData
};

jvCharts.prototype.generateRadial = generateRadial;

/************************************************ Radial Data functions ******************************************************/
/**setRadialChartData
 *  gets bar data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData(chart) {
    chart.data.legendData = setRadialLegendData(chart.data);
    //define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart.options.color, chart.data.legendData, chart.colors);
}

function paint(chart) {
    chart.options.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var radialMargins = {
        top: 40,
        right: 20,
        bottom: 20,
        left: 20
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, radialMargins);
    chart.generateVerticalLegend('generateRadial');
    chart.generateRadial();
}

/**setRadialLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setRadialLegendData(data) {
    var legendArray = [];
    for (var i = 0; i < data.chartData.length; i++) {
        if (legendArray.indexOf(data.chartData[i][data.dataTable.label]) == -1) {
            legendArray.push((data.chartData[i][data.dataTable.label]));
        }
    }
    return legendArray;
}

/**generateRadial
 *
 * paints the radil bar chart on the chart
 * @params radialData
 */

function generateRadial() {
    var chart = this,
        svg = chart.svg,
        colors = chart.options.color,
        container = chart.config.container,
        legendData = chart.data.legendData,
        radialData = chart.data.chartData,
        tickNumber = 3,
        barHeight = container.height / 2 - 40,
        width = container.width,
        height = container.height,
        r = Math.min(height / 2, width / 3),
        data = [],
        allKeys = [chart.data.dataTable.label, chart.data.dataTable.value],
        radialDataNew,
        dataHeaders,
        legendElementToggleArray = [],
        radialDataFiltered;

    for (var i = 0; i < radialData.length; i++) {
        data[i] = { label: radialData[i][allKeys[0]], value: radialData[i][allKeys[1]] };
        //total += parseFloat(radialData[i][keys[1]]);
    }

    radialDataNew = JSON.parse(JSON.stringify(data));//copy of pie data


    if (!chart.options.legendHeaders) {
        chart.options.legendHeaders = legendData;
    }

    dataHeaders = chart.options.legendHeaders;
    legendElementToggleArray = jvCharts.getLegendElementToggleArray(dataHeaders, legendData);
    radialDataFiltered = [];

    if (legendElementToggleArray) {
        for (var j = 0; j < radialDataNew.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (legendElementToggleArray[i].element === radialDataNew[j].label && legendElementToggleArray[i].toggle === false) {
                    radialDataNew[j].value = -1;
                }
            }
        }
    }

    for (var j = 0; j < radialDataNew.length; j++) {
        if (radialDataNew[j].value !== -1) {
            radialDataFiltered.push(radialDataNew[j]);
        }
    }

    radialDataFiltered.sort(function (a, b) {
        return b.value - a.value;
    });

    //Remove existing bars from page
    svg.selectAll('g.radial-container').remove();


    var vis = svg
        .append('g')
        .attr('class', 'radial-container')
        .attr('height', height)
        .attr('transform', 'translate(' + (width / 2) + ',' + r + ')');

    var extent = d3.extent(radialDataFiltered, function (d) {
        return d.value;
    });

    //commas and 0 decimals
    var formatNumber = d3.format(',.0f');
    if (extent[1] >= 1000000) {
        //millions
        var p = d3.precisionPrefix(1e5, 1.3e6);
        formatNumber = d3.formatPrefix('.' + p, 1.3e6);
    } else if (extent[1] <= 100) {
        //2 decimals
        formatNumber = d3.format(',.2f');
    }


    if (extent[0] !== 0) {
        extent[0] = 0;
    }
    var barScale = d3.scaleLinear()
        .domain(extent)
        .range([0, barHeight]);

    var keys = radialDataFiltered.map(function (d, i) {
        return d.label;
    });
    var numBars = keys.length;

    var x = d3.scaleLinear()
        .domain(extent)
        .range([0, -barHeight]);

    //create xAxis drawing function
    var xAxis = d3.axisLeft()
        .scale(x)
        .ticks(tickNumber)
        .tickFormat(formatNumber);

    vis.selectAll('circle')
        .data(x.ticks(3))
        .enter().append('circle')
        .attr('r', function (d) {
            return barScale(d);
        })
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-dasharray', '2,2')
        .style('stroke-width', '.5px');

    var arc = d3.arc()
        .startAngle(function (d, i) {
            return (i * 2 * Math.PI) / numBars;
        })
        .endAngle(function (d, i) {
            return ((i + 1) * 2 * Math.PI) / numBars;
        })
        .innerRadius(0);

    var segments = vis.selectAll('path')
        .data(radialDataFiltered)
        .enter().append('g')
        //.attr("class", "label")
        .append('path')
        .each(function (d) {
            d.outerRadius = 0;
        })
        .style('fill', function (d, i) {
            return jvCharts.getColors(colors, i, d.label);
        })
        .attr('d', arc)
        .on('mousemove', function (d, i) {
            if (chart.draw.showToolTip) {
                //chart.tip.hideTip();
                //Get tip data
                var tipData = chart.setTipData(d, i);
                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            }
        })
        .on('mouseout', function (d) {
            if (chart.draw.showToolTip) {
                chart.tip.hideTip();
                svg.selectAll('line.tip-line').remove();
            }
        });

    segments.transition().duration(800).ease(d3.easeElastic).delay(function (d, i) {
        return 750 - 50 * i;
    })
        .attrTween('d', function (d, index) {
            var i = d3.interpolate(d.outerRadius, barScale(+d.value));
            return function (t) {
                d.outerRadius = i(t);
                return arc(d, index);
            };
        });

    vis.append('circle')
        .attr('r', barHeight)
        .classed('outer', true)
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-width', '1.5px');

    vis.selectAll('line')
        .data(keys)
        .enter().append('g')
        .attr('class', 'label')
        .append('line')
        .attr('y2', -barHeight - 20)
        .style('stroke', 'black')
        .style('stroke-width', '.5px')
        .attr('transform', function (d, i) {
            return 'rotate(' + (i * 360 / numBars) + ')';
        });

    var axisGroup = vis.append('g')
        .attr('class', 'xAxis')
        .style('pointer-events', 'none')
        .call(xAxis);
    var yAxisClass = 'yAxisLabels editable editable-yAxis editable-text editable-num';

    axisGroup.selectAll('text')
        .attr('fill', 'black')//Customize the color of axis labels
        .attr('class', yAxisClass)
        .attr('transform', function (d) {
            if (d === xAxis.scale().ticks(tickNumber)[tickNumber]) {
                return 'translate(0, 10)';
            }
            return 'translate(0,0)';
        })
        .attr('font-size', chart.options.fontSize)
        .append('svg:title');
}

module.exports = jvCharts;