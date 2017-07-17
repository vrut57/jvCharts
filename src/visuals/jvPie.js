'use strict';
 var jvCharts = require('../jvCharts.js');

jvCharts.prototype.pie = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generatePie = generatePie;

/************************************************ Pie Data functions ******************************************************/

/**setPieData
 *  gets pie data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    chart.data.legendData = setPieLegendData(chart.data);
    //define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

function getEventData(event) {
    var chart = this,
        ele = event.target.classList.value.split('pie-data-')[1];
    if (ele) {
        return {
            data: {
                [chart.currentData.dataTable.label]: [ele.replace(/_/g, ' ').replace(/_dot_/g, '.')]
            },
            node: event.target
        };
    } else if (event.target.classList.value.indexOf('pie-container') > -1) {
        return {
            data: {}
        };
    }
    return {
        data: false
    };
}

/**setPieLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setPieLegendData(data) {
    var legendArray = [];
    for (var i = data.chartData.length - 1; i >= 0; i--) {
        legendArray.push((data.chartData[i][data.dataTable.label]));
    }
    return legendArray;
}

function paint() {
    var chart = this;
    var customMargins = {
        top: 40,
        right: 20,
        bottom: 20,
        left: 20
    };

    chart.currentData = chart.data;
    chart._vars.color = chart.data.color;
    chart.legendData = chart.data.legendData;
    chart.generateSVG(chart.data.legendData, customMargins);

    //If the container size is small, don't generate a legend
    if (chart.config.container.width > 550) {
        chart.generateVerticalLegend('generatePie');
    }

    chart.generatePie(chart.currentData);
}

/**generatePie
 *
 * creates and draws a pie chart on the svg element
 * @params svg, pieData, _vars, container
 * @returns {{}}
 */
function generatePie(currentData) {
    var chart = this,
        svg = chart.svg,
        pieData = currentData.chartData,
        container = chart.config.container,
        legendData = chart.currentData.legendData;

    //define variables to change attr's
    svg.select('g.pie-container').remove();

    var colors = chart._vars.color;

    var w = container.width;
    var h = container.height;
    var r = Math.min(h / 2, w / 3);

    var data = [];
    var total = 0;

    for (var i = 0; i < pieData.length; i++) {
        var obj = {};
        for(let j in chart.data.dataTable) {
            obj[j] = pieData[i][chart.data.dataTable[j]];
        }
        data[i] = obj;
    }

    var pieDataNew = data;//copy of pie data


    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }

    var dataHeaders = chart._vars.legendHeaders;

    var legendElementToggleArray = jvCharts.getLegendElementToggleArray(dataHeaders, legendData);

    if (legendElementToggleArray) {
        for (var j = 0; j < pieDataNew.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (legendElementToggleArray[i].element === pieDataNew[j].label && legendElementToggleArray[i].toggle === false) {
                    //pieDataNew.splice(j,1);
                    pieDataNew[j].value = 0;
                }
            }
        }
    }


    for (var i = 0; i < pieDataNew.length; i++) {
        total += parseFloat(pieDataNew[i].value);
    }

    var vis = svg
        .append('g')
        .data([pieDataNew])
        .attr('class', 'pie-container')
        .attr('height', 200)
        .attr('transform', 'translate(' + (w / 2) + ',' + r + ')');

    var pie = d3.pie().value(function (d) {
        return d.value;
    });

    //declare an arc generator function
    var arc = d3.arc()
        .innerRadius(0)//Normal pie chart when this = 0, can be changed to create donut chart
        .outerRadius(r);

    // var arcOver = d3.arc()
    //     .innerRadius(0)
    //     .outerRadius(r + 15);

    //select paths, use arc generator to draw
    var arcs = vis
        .selectAll('g.slice')
        .data(pie)
        .enter().append('g').attr('class', 'slice');

    arcs.append('path')
        .attr('fill', function (d, i) {
            return jvCharts.getColors(colors, i, d.data.label);
        })
        .attr('d', function (d) {
            return arc(d);
        })
        .attr('class', function (d, i) {
            var label = d.data.label.replace(/\s/g, '_').replace(/\./g, '_dot_');
            return 'editable editable-pie pie-slice-' + i + ' highlight-class-' + i + ' pie-data-' + label;
        })
        .attr('stroke', chart._vars.pieBorder)
        .attr('stroke-width', chart._vars.pieBorderWidth)
        .on('mouseover', function (d, i, j) {
            if (chart.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d.data, i);
                // Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                chart.tip.d = d;
                chart.tip.i = i;
            }
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

    arcs.append('svg:text')
        .attr('class', 'sliceLabel')
        .attr('transform', function (d) {
            var test = arc.centroid(d);
            test[0] = test[0] * 1.6;
            test[1] = test[1] * 1.6;
            return 'translate(' + test + ')';
        })
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .text(function (d, i) {
            var percent = pieDataNew[i].value / total * 100;
            percent = d3.format('.1f')(percent);
            if (percent > 5) {
                return percent + '%';
            }
        })
        .attr('font-size', chart._vars.fontSize)
        .attr('fill', chart._vars.pieTextColor)
        .attr('pointer-events', 'none');
}

module.exports = jvCharts;
