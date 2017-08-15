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

    //Set data if a 'bucket' is specified--paints # specified, groups rest into other category
    if (chart._vars.hasOwnProperty('buckets') && parseInt(chart._vars.buckets, 10) !== 0) {
        //bucket the data
        let data = chart.data,
            other = {},
            categorizedData = [], i;

        data.chartData.sort((a, b) => b[data.dataTable.value] - a[data.dataTable.value]);
        other[data.dataTable.label] = 'Other';
        other[data.dataTable.value] = 0;
        for (i = 0; i < data.chartData.length; i++) {
            if (i < chart._vars.buckets) {
                categorizedData.push(data.chartData[i]);
            } else {
                other[data.dataTable.value] += data.chartData[i][data.dataTable.value];
            }
        }
        categorizedData.push(other);
        data.chartData = categorizedData;
    }
    //Set legend data after determining if the data is bucketed
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
    var chart = this,
        customMargins = {
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
        legendData = chart.currentData.legendData,
        colors = chart._vars.color,
        w = container.width,
        h = container.height,
        r = Math.min(h / 2, w / 3),
        data = [],
        total = 0,
        pieDataNew,
        legendElementToggleArray,
        vis,
        pie,
        arc,
        arcs;

    //define variables to change attr's
    svg.select('g.pie-container').remove();

    for (let i = 0; i < pieData.length; i++) {
        let obj = {};
        for (let j in chart.data.dataTable) {
            if (chart.data.dataTable.hasOwnProperty(j)) {
                obj[j] = pieData[i][chart.data.dataTable[j]];
            }
        }
        data[i] = obj;
    }

    pieDataNew = data;

    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }

    legendElementToggleArray = jvCharts.getLegendElementToggleArray(chart._vars.legendHeaders, legendData);

    if (legendElementToggleArray) {
        for (let slice of pieDataNew) {
            for (let legendEle of legendElementToggleArray) {
                if (legendEle.element === slice.label && legendEle.toggle === false) {
                    slice.value = 0;
                }
            }
        }
    }


    for (let slice of pieDataNew) {
        total += parseFloat(slice.value);
    }

    vis = svg
        .append('g')
        .data([pieDataNew])
        .attr('class', 'pie-container')
        .attr('height', 200)
        .attr('transform', `translate(${w / 2}, ${r})`);

    pie = d3.pie().value(d => d.value);

    //declare an arc generator function
    arc = d3.arc()
        .innerRadius(0)//Normal pie chart when this = 0, can be changed to create donut chart
        .outerRadius(r);

    //select paths, use arc generator to draw
    arcs = vis
        .selectAll('g.slice')
        .data(pie)
        .enter().append('g').attr('class', 'slice');

    arcs.append('path')
        .attr('fill', (d, i) => jvCharts.getColors(colors, i, d.data.label))
        .attr('d', d => arc(d))
        .attr('class', (d, i) => `editable editable-pie pie-slice-${i} highlight-class-${i} pie-data-${d.data.label.replace(/\s/g, '_').replace(/\./g, '_dot_')}`)
        .attr('stroke', chart._vars.pieBorder)
        .attr('stroke-width', chart._vars.pieBorderWidth)
        .on('mouseover', function (d, i) {
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
        .on('mouseout', function () {
            chart.tip.hideTip();
        });

    arcs.append('svg:text')
        .attr('class', 'sliceLabel')
        .attr('transform', (d) => {
            let centroid = arc.centroid(d);
            centroid[0] = centroid[0] * 1.6;
            centroid[1] = centroid[1] * 1.6;
            return `translate(${centroid})`;
        })
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .text((d, i) => {
            var percent = pieDataNew[i].value / total * 100;
            percent = d3.format('.1f')(percent);
            if (percent > 1) {
                return percent + '%';
            }
        })
        .attr('font-size', chart._vars.fontSize)
        .attr('fill', chart._vars.pieTextColor)
        .attr('pointer-events', 'none');
}

module.exports = jvCharts;
