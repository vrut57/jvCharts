'use strict';
var jvCharts = require('../jvCharts.js');


jvCharts.prototype.circlepack = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generatePack = generatePack;

/************************************************ Pack functions ******************************************************/

/**setPackChartData
 *  gets pack data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    chart.data.legendData = setPackLegendData(chart.data.dataTable);
    if (!chart.data.chartData.hasOwnProperty('children')) {
        chart.data.chartData = jvCharts.convertTableToTree(chart.data.chartData, chart.data.dataTable);
    }

    //define color object for chartData
    chart.data.color = chart.colors;
}

function getEventData() {
    return {};
}

/**setPackLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setPackLegendData(dataTable) {
    var legendArray = [],
        label = '';
    for (let key in dataTable) {
        if (dataTable.hasOwnProperty(key)) {
            if (key === 'value') {
                label = dataTable[key];
            } else if (key !== 'tooltip 1') {
                legendArray.push(dataTable[key]);
            }
        }
    }
    legendArray.unshift(label);
    return legendArray;
}

function paint() {
    var chart = this,
        packMargins = {
            top: 30,
            right: 20,
            bottom: 15,
            left: 20
        };
    chart._vars.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, packMargins);
    chart.generateVerticalLegend('generatePack');
    chart.generatePack(chart.currentData);
}

/**generatePack
 *
 * paints the pack on the chart
 * @params packData
 */
function generatePack() {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        w = container.width,
        h = container.height,
        r = Math.min(h / 2, w / 3),
        margin = 20,
        diameter = r * 2,
        color,
        root,
        pack,
        vis,
        circle,
        node,
        view;

    chart.children = chart.data.chartData;

    color = d3.scaleOrdinal()
        .range(chart.data.color
            .map(c => {
                c = d3.rgb(c);
                c.opacity = 0.8;
                return c;
            }));

    //assigns the data to a hierarchy using parent-child relationships
    root = d3.hierarchy(chart.children, d => d.children);

    pack = d3.pack()
        .size([container.width, container.height])
        .padding(2);

    pack(root
        .sum(d => d.hasOwnProperty('children') ? 0 : d.name)
        .sort((a, b) => b.height - a.height || b.value - a.value))
        .descendants();

    svg.selectAll('.pack').remove();

    vis = svg.append('g')
        .attr('class', 'pack')
        .attr('transform', 'translate(' + (w / 2) + ',' + r + ')');

    circle = vis.selectAll('circle')
        .data(root.descendants())
        .enter().append('circle')
        .attr('class', d => d.parent ? d.children ? 'node' : 'node node--leaf' : 'node node--root')
        .style('fill', d => {
            d.color = color(d.depth);
            return d.children ? color(d.depth) : null;
        })
        .on('click', function (d) {
            if (focus !== d) {
                zoom(d);
                d3.event.stopPropagation();
            }
        })
        .on('mouseover', function (d, i) {
            //Get tip data
            var tipData = chart.setTipData(d, i);
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
                    var tipData = chart.setTipData(d, i);
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                }
            }
        })
        .on('mouseout', function () {
            chart.tip.hideTip();
        });

    node = svg.selectAll('circle,text');

    d3.select('body')
        .on('click', function () {
            zoom(root);
        });

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoom(d) {
        var focus = d;
        d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween('zoom', function (d) {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function (t) {
                    zoomTo(i(t));
                };
            });
    }
    function zoomTo(v) {
        var k = diameter / v[2];

        //set global zoom
        view = v;

        node.attr('transform', d => {
            if (d && d.x && d.y) {
                return 'translate(' + (d.x - v[0]) * k + ',' + (d.y - v[1]) * k + ')';
            }
            return '';
        });

        circle.attr('r', d => d.r * k);
    }
}

module.exports = jvCharts;
