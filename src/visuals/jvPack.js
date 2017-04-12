'use strict';
var jvCharts = require('../jvCharts.js');


jvCharts.prototype.circlepack = {
    paint: paint,
    setData: setData
};

jvCharts.prototype.generatePack = generatePack;

/************************************************ Pack functions ******************************************************/

/**setPackChartData
 *  gets pack data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData(chart) {
    chart.data.legendData = setPackLegendData(chart.data.dataTable);
    //define color object for chartData
    chart.data.color = chart.colors;
}

/**setPackLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setPackLegendData(dataTable) {
    var legendArray = [];
    var label = ''
    for (var key in dataTable) {
        if (dataTable.hasOwnProperty(key)) {
            if (key === 'value') {
                label = dataTable[key];
            } else {
                legendArray.push(dataTable[key]);
            }

        }
    }
    legendArray.unshift(label);
    return legendArray;
}

function paint(chart) {
    chart._vars.color = chart.data.color;

    chart.currentData = chart.data;//Might have to move into method bc of reference/value relationship

    var packMargins = {
        top: 30,
        right: 20,
        bottom: 15,
        left: 20
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, packMargins);
    chart.generateVerticalLegend('generatePack');
    chart.generatePack(chart.currentData);
};

/** generatePack
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
        diameter = r * 2;

    chart.children = chart.data.chartData;

    var color = d3.scaleOrdinal()
        .range(chart.data.color
            .map(function (c) { c = d3.rgb(c); c.opacity = 0.8; return c; }));

    //  assigns the data to a hierarchy using parent-child relationships
    var root = d3.hierarchy(chart.children, function (d) {
        return d.children;
    });

    var pack = d3.pack()
        .size([container.width, container.height])
        .padding(2);

    pack(root
        .sum(function (d) {
            return d.hasOwnProperty('children') ? 0 : d.name;
        })
        .sort(function (a, b) {
            return b.height - a.height || b.value - a.value;
        }))
        .descendants();

    svg.selectAll(".pack").remove();

    var vis = svg.append("g")
        .attr("class", "pack")
        .attr("transform", "translate(" + (w / 2) + "," + r + ")");

    var circle = vis.selectAll("circle")
        .data(root.descendants())
        .enter().append("circle")
        .attr("class", function (d) {
            return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
        })
        .style("fill", function (d) {
            d.color = color(d.depth);
            return d.children ? color(d.depth) : null;
        })
        .on("click", function (d) {
            if (focus !== d) {
                zoom(d), d3.event.stopPropagation();
            }
        })
        .on("mouseover", function (d, i) {
            //Get tip data
            var tipData = chart.setTipData(d, i);
            //Draw tip line
            chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
            chart.tip.d = d;
            chart.tip.i = i;
        })
        .on("mousemove", function (d,i) {
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
        .on("mouseout", function (d) {
            chart.tip.hideTip();
        });

    // var text = vis.selectAll("text")
    //     .data(root.descendants())
    //     .enter().append("text")
    //     .attr("class", "label")
    //     .style("display", function(d) {
    //         return d.parent === root ? "inline" : "none";
    //     });

    var node = svg.selectAll("circle,text");

    d3.select("body")
        .on("click", function () {
            zoom(root);
        });

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoom(d) {
        var focus = d;

        d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", function (d) {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function (t) {
                    zoomTo(i(t));
                };
            });

        // transition.selectAll("text")
        //     .filter(function(d) {
        //         return d.parent === focus || this.style.display === "inline";
        //     })
        //     .style("fill-opacity", function(d) {
        //         return d.parent === focus ? 1 : 0;
        //     })
        //     .style("display", function(d) {
        //         return d.parent === focus ? "inline" : "none";
        //     })
        //     .each("start", function(d) {
        //         if (d.parent === focus) {
        //            this.style.display = "inline";
        //         }
        //     })
        //     .each("end", function(d) {
        //         if (d.parent !== focus) {
        //           this.style.display = "none";
        //         }
        //     });
    }
    var view;
    function zoomTo(v) {
        var k = diameter / v[2];

        //set global zoom
        view = v;

        node.attr("transform", function (d) {
            if (d && d.x && d.y) {
                return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
            }
        });

        circle.attr("r", function (d) {
            return d.r * k;
        });
    }
}

module.exports = jvCharts;
