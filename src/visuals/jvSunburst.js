'use strict';
var jvCharts = require('../jvCharts.js');

jvCharts.prototype.sunburst = {
    paint: paint,
    setData: setData
};

jvCharts.prototype.generateSunburst = generateSunburst;

/************************************************ Sunburst functions ******************************************************/

/**setSunburstChartData
 *  gets sunburst data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    chart.data.color = chart.colors;
}

function paint() {
    var chart = this;
    chart._vars.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var sunburstMargins = {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, sunburstMargins);
    //chart.generateLegend(chart.currentData.legendData, 'generateSunburst');
    chart.generateSunburst(chart.currentData);
}

/**generateSunburst
 *
 * paints the sunburst on the chart
 * @params sunburstData
 */
function generateSunburst(sunburstData) {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        allFilterList = [],
        relationMap = chart.data.dataTable,
        chartName = chart.config.name,
        width = container.width,
        height = container.height,
        radius = (Math.min(width, height) / 2) - 10;

    chart.children = chart.data.chartData;

    var newData = JSON.parse(JSON.stringify(chart.children));//copy of pie data

    var formatNumber = d3.format(',d');

    var x = d3.scaleLinear()
        .range([0, 2 * Math.PI]);

    var y = d3.scaleSqrt()
        .range([0, radius]);

    var color = d3.scaleOrdinal()
        .range(chart.data.color
            .map(function (c) { c = d3.rgb(c); c.opacity = 1; return c; }));

    //var color = d3.scaleOrdinal(d3.schemeCategory10);

    var partition = d3.partition();

    var arc = d3.arc()
        .startAngle(function (d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
        })
        .endAngle(function (d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
        })
        .innerRadius(function (d) {
            return Math.max(0, y(d.y0));
        })
        .outerRadius(function (d) {
            return Math.max(0, y(d.y1));
        });

    //assigns the data to a hierarchy using parent-child relationships
    var root = d3.hierarchy(chart.children, function (d) {
        return d.children;
    });

    root.sum(function (d) {
        return d.value;
    });

    var vis = svg.append('g')
        .attr('class', 'sunburst')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(' + width / 2 + ',' + (height / 2) + ')');


    vis.selectAll('path')
        .data(partition(root).descendants())
        .enter().append('g').attr('class', 'node');

    var path = vis.selectAll('.node')
        .append('path')
        .attr('d', arc)
        .style('fill', function (d) {
            if (d.data.name === 'root') {
                d.color = chart._vars.backgroundColor;
                return chart._vars.backgroundColor;
            }
            d.color = color(d.data.name);
            return color(d.data.name);
        })
        .on('mouseover', function (d, i, j) {
            if (chart.draw.showToolTip) {
                // var tData = chart.data.tipData.get(d.data.name);
                // tData.name = d.data.name;
                // tData.color = d.color;
                var tipData = chart.setTipData(d, i);

                //Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
                chart.tip.d = d;
                chart.tip.i = i;
            }
        })
        .on('mousemove', function (d, i) {
            if (chart.draw.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(d3.event);
                } else {
                    //Get tip data
                    var tipData = chart.setTipData(d, i);
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
                }
            }
        })
        .on('click', click)
        .on('mouseout', function (d) {
            chart.tip.hideTip();
        });

    if (chart._vars.displayValues) {
        var text = vis.selectAll('.node')
            .append('text')
            .attr('transform', function (d) {
                return 'rotate(' + computeTextRotation(d) + ')';
            })
            .attr('x', function (d) {
                return y(d.y0);
            })
            .attr('dx', '6') //margin
            .attr('dy', '.35em') //vertical-align
            .text(function (d) {
                return d.data.name === 'root' ? '' : d.data.name;
            });
    }


    function click(d) {
        //fade out all text elements
        if (chart._vars.displayValues) {
            text.transition().attr('opacity', 0);
        }

        vis.transition()
            .duration(750)
            .tween('scale', function () {
                var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(y.domain(), [d.y0, 1]),
                    yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);

                return function (t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
            })
            .selectAll('path')
            .attrTween('d', function (d) {
                return function () {
                    return arc(d);
                };
            })
            .on('end', function (e, i) {
                if (chart._vars.displayValues) {
                    //check if the animated element's data e lies within the visible angle span given in d
                    if (e.x0 > d.x0 && e.x0 < d.x1) {
                        //get a selection of the associated text element
                        var arcText = d3.select(this.parentNode).select('text');
                        //fade in the text element and recalculate positions
                        arcText.transition().duration(750)
                            .attr('opacity', 1)
                            .attr('class', 'visible')
                            .attr('transform', function () { return 'rotate(' + computeTextRotation(e) + ')'; })
                            .attr('x', function (d) { return y(d.y0); })
                            .text(function (d) {
                                return d.data.name === 'root' ? '' : d.data.name;
                            });
                    }
                }
            });
    }

    function computeTextRotation(d) {
        return (x((d.x0 + d.x1) / 2) - Math.PI / 2) / Math.PI * 180;
    }
}

module.exports = jvCharts;
