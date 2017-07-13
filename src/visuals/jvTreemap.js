'use strict';
var jvCharts = require('../jvCharts.js');

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
    var legendArray = [];
    for (var i = 0; i < data.chartData.children.length; i++) {
        if (legendArray.indexOf(data.chartData.children[i][data.dataTable.series]) == -1) {
            legendArray.push((data.chartData.children[i][data.dataTable.series]));
        }
    }
    return legendArray;
}

function paint() {
    var chart = this;
    chart._vars.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var treeMapMargins = {
        top: 45,
        right: 50,
        left: 50,
        bottom: 130
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, treeMapMargins);
    chart.generateLegend(chart.currentData.legendData, 'generateTreeMap');
    chart.generateTreeMap(chart.currentData);


};

/** generateTreeMap
 *
 * paints the treemap on the chart
 * @params treeMapData
 */
function generateTreeMap(treeMapData) {

    var chart = this,
        svg = chart.svg,
        colors = treeMapData.color,
        container = chart.config.container,
        allFilterList = [],
        relationMap = chart.data.dataTable,
        treemap = null;

    chart.children = chart.data.chartData;

    var newData = JSON.parse(JSON.stringify(chart.children));//copy of pie data

    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }

    var dataHeaders = chart._vars.legendHeaders;

    var legendElementToggleArray = jvCharts.getLegendElementToggleArray(dataHeaders, chart.data.legendData);



    if (legendElementToggleArray) {
        for (var j = 0; j < newData.children.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (legendElementToggleArray[i].element === newData.children[j][relationMap.series] && legendElementToggleArray[i].toggle === false) {
                    newData.children[j].show = false;
                }
            }
        }
    }

    var treeMapDataFiltered = {};
    treeMapDataFiltered["Parent"] = "Top Level";
    treeMapDataFiltered.children = [];

    for (var j = 0; j < newData.children.length; j++) {
        if (newData.children[j].show !== false) {
            treeMapDataFiltered.children.push(newData.children[j]);
        }
    }

    //  assigns the data to a hierarchy using parent-child relationships
    var root = d3.hierarchy(treeMapDataFiltered, function (d) {
        return d.children;
    });

    var treemap = d3.treemap()
        .size([container.width, container.height])
        .padding(2);

    var nodes = treemap(root
        .sum(function (d) {
            return d[relationMap.size];
        })
        .sort(function (a, b) {
            return b.height - a.height || b.value - a.value;
        }))
        .descendants();

    //Remove existing bars from page
    svg.selectAll("g.treemap").remove();
    svg.append("g").attr("class", "treemap");

    var node = svg.select(".treemap")
        .selectAll("g")
        .data(root.leaves())
        .enter().append('g')
        .attr('transform', function (d) {
            return 'translate(0,0)';
        });

    node.append('rect')
        // .call(position)
        .attr("x", function (d) {
            return d.x0 + "px";
        })
        .attr("y", function (d) {
            return d.y0 + "px";
        })
        .attr("width", function (d) {
            return d.x1 - d.x0 + "px";
        })
        .attr("height", function (d) {
            return d.y1 - d.y0 + "px";
        })
        .attr("fill", function (d, i) {
            return jvCharts.getColors(colors, i, d.data[relationMap.series]);
        })
        .attr("fill-opacity", .8)
        .attr("stroke", chart._vars.white)
        .attr("stroke-width", chart._vars.strokeWidth)
        .on("mouseover", function (d, i) {
            //Get tip data
            var tipData = chart.setTipData(d.data, i);
            //Draw tip line
            chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
            chart.tip.d = d;
            chart.tip.i = i;

            // var rect = d3.select(this);
            // rect.attr("fill", chart._vars.light);
            // rect.transition().duration(200);
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
        .on("mouseout", function (d) {
            chart.tip.hideTip();
            // var rect = d3.select(this);
            // rect.attr("fill", function (d, i) {
            //     return jvCharts.getColors(colors, i, d.data[relationMap.series]);
            // });
            // rect.transition().duration(200);
        });

    node.append('text')
        // .call(position)
        .attr("x", function (d) {
            return d.x0 + "px";
        })
        .attr("y", function (d) {
            return d.y0 + "px";
        })
        .attr("width", function (d) {
            return d.x1 - d.x0 + "px";
        })
        .attr("height", function (d) {
            return d.y1 - d.y0 + "px";
        })
        .attr("transform", "translate(3, 18)")
        .text(function (d) {
            if (d.dy !== 0) {
                return d.children ? null : d.data[relationMap.label];
            }
        });


    /* Don't display text if text is wider than rect */
    var temp = svg.select(".treemap").selectAll("g").selectAll("text");
    temp.attr("style", function (d) {
        if (this.getBBox().width >= (d.x1 - d.x0) - 5) {
            return "display:none";
        }
        if (this.getBBox().height >= (d.y1 - d.y0) - 5) {
            return "display:none";
        }
    });
};
module.exports = jvCharts;
