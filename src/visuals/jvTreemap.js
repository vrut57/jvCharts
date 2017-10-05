'use strict';
import jvCharts from 'jvCharts.js';

jvCharts.prototype.treemap = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generateTreeMap = generateTreeMap;
/************************************************ TreeMap functions ******************************************************/

/**setTreeMapData
 *  gets treemap data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    if (!chart.data.chartData.hasOwnProperty('children')) {
        chart.data.chartData = jvCharts.convertTableToTreemap(chart.data.chartData, chart.data.dataTable);
    }
    chart.data.legendData = setTreeMapLegendData(chart.data);
    //define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

function getEventData() {
    return {};
}

/**setTreeMapLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setTreeMapLegendData(data) {
    var legendArray = [],
        series = data.dataTable.series;
    for (let childEle of data.chartData.children) {
        if (legendArray.indexOf(childEle[series]) === -1) {
            legendArray.push((childEle[series]));
        }
    }
    return legendArray;
}

function paint() {
    var chart = this,
        treeMapMargins = {
            top: 45,
            right: 50,
            left: 50,
            bottom: 130
        };
    chart._vars.color = chart.data.color;
    chart.currentData = chart.data;

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, treeMapMargins);
    chart.generateLegend(chart.currentData.legendData, 'generateTreeMap');
    chart.generateTreeMap(chart.currentData);
}

/**generateTreeMap
 *
 * paints the treemap on the chart
 * @params treeMapData
 */
function generateTreeMap(treeMapData) {
    var chart = this,
        svg = chart.svg,
        colors = treeMapData.color,
        container = chart.config.container,
        relationMap = chart.data.dataTable,
        data = chart.currentData.chartData,
        dataHeaders,
        legendElementToggleArray,
        treeMapDataFiltered,
        root,
        treemapFunc,
        node,
        textNode;

    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = chart.currentData.legendData;
    }

    dataHeaders = chart._vars.legendHeaders;
    legendElementToggleArray = jvCharts.getLegendElementToggleArray(dataHeaders, chart.data.legendData);

    if (legendElementToggleArray) {
        for (let childEle of data.children) {
            for (let legendEle of legendElementToggleArray) {
                if (legendEle.element === childEle[relationMap.series] && legendEle.toggle === false) {
                    childEle.show = false;
                }
            }
        }
    }

    treeMapDataFiltered = {
        Parent: 'Top Level',
        children: []
    };

    for (let childEle of data.children) {
        if (childEle.show !== false) {
            treeMapDataFiltered.children.push(childEle);
        }
    }

    //assigns the data to a hierarchy using parent-child relationships
    root = d3.hierarchy(treeMapDataFiltered, d => d.children);

    treemapFunc = d3.treemap()
        .size([container.width, container.height])
        .padding(2);

    treemapFunc(root
        .sum(d => d[relationMap.size])
        .sort((a, b) => b.height - a.height || b.value - a.value))
        .descendants();

    //Remove existing bars from page
    svg.selectAll('g.treemap').remove();
    svg.append('g').attr('class', 'treemap');

    node = svg.select('.treemap')
        .selectAll('g')
        .data(root.leaves())
        .enter().append('g')
        .attr('transform', 'translate(0,0)');

    node.append('rect')
        .attr('x', d => d.x0 + 'px')
        .attr('y', d => d.y0 + 'px')
        .attr('width', d => d.x1 - d.x0 + 'px')
        .attr('height', d => d.y1 - d.y0 + 'px')
        .attr('fill', (d, i) => jvCharts.getColors(colors, i, d.data[relationMap.series]))
        .attr('fill-opacity', 0.8)
        .attr('stroke', chart._vars.white)
        .attr('stroke-width', chart._vars.strokeWidth)
        .on('mouseover', function (d, i) {
            //Get tip data
            let tipData = chart.setTipData(d.data, i);
            //Draw tip line
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
                    let tipData = chart.setTipData(d, i);
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                }
            }
        })
        .on('mouseout', function () {
            chart.tip.hideTip();
        });

    node.append('text')
        .attr('x', d => d.x0 + 'px')
        .attr('y', d => d.y0 + 'px')
        .attr('width', d => d.x1 - d.x0 + 'px')
        .attr('height', d => d.y1 - d.y0 + 'px')
        .attr('transform', 'translate(3, 18)')
        .text(d => {
            if (d.dy !== 0 && !d.children) {
                return d.data[relationMap.label];
            }
            return null;
        });

    /*Don't display text if text is wider than rect */
    textNode = node.selectAll('text');
    textNode.attr('style', function (d) {
        let bbox = this.getBBox();
        if (bbox.width >= (d.x1 - d.x0) - 5 || bbox.height >= (d.y1 - d.y0) - 5) {
            return 'display:none';
        }
        return '';
    });
}
module.exports = jvCharts;
