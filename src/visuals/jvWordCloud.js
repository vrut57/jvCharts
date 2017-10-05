'use strict';
import jvCharts from 'jvCharts.js';

jvCharts.prototype.cloud = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generateCloud = generateCloud;

/************************************************ Cloud functions ******************************************************/

/**setCloudData
 *  gets cloud data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    //define color object for chartData
    chart.data.color = chart.colors;
}

function getEventData() {
    return {};
}

/**setCloudLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setCloudLegendData(data) {
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
    if (!chart.smallerFontRepaint) {
        chart._vars.fontSizeMax = 80;
        chart.currentData = chart.data;
    } else {
        chart.currentData = JSON.parse(JSON.stringify(chart.data));
    }

    chart._vars.color = chart.data.color;

    var cloudMargins = {
        top: 15,
        right: 15,
        left: 15,
        bottom: 15
    };

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, cloudMargins);
    // chart.generateLegend(chart.currentData.legendData, 'generateCloud');
    chart.generateCloud(chart.currentData);
};

/** generateCloud
 *
 * paints the cloud  on the chart
 * @params cloud Data
 */
function generateCloud(cloudData) {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        allFilterList = [],
        relationMap = chart.data.dataTable,
        width = container.width,
        height = container.height,
        margin = chart.config.margin,
        min,
        max;

    var categories = d3.keys(d3.nest().key(function (d) {
        if (!min && !max) {
            min = d[relationMap.value];
            max = d[relationMap.value];
        } else {
            if (d[relationMap.value] > max) {
                max = d[relationMap.value];
            }
            if (d[relationMap.value] < min) {
                min = d[relationMap.value];
            }
        }

        return d[relationMap.value];
    }).map(cloudData.chartData));

    if (!chart._vars.fontSizeMax) {
        chart._vars.fontSizeMax = 80;
    }

    var color = d3.scaleOrdinal()
        .range(chart.data.color
            .map(function (c) { c = d3.rgb(c); c.opacity = 0.8; return c; }));

    var fontSize = d3.scalePow().exponent(5).domain([0, 1]).range([10, chart._vars.fontSizeMax]);
    chart.smallerFontRepaint = false;
    var layout = d3.layout.cloud()
        .timeInterval(10)
        .size([width, height])
        .words(cloudData.chartData)
        .rotate(function (d) { return 0; })
        .font('Roboto')
        .fontSize(function (d, i) {
            return fontSize(max - min !== 0 ? (d[relationMap.value] - min) / (max - min) : 0);
        })
        .repaintWithSmallerFont(function() {
            if (chart._vars.fontSizeMax > 10) {
                chart._vars.fontSizeMax -= 5;
                chart.smallerFontRepaint = true;
                paint(chart);
            }
        })
        .text(function (d) { return d[relationMap.label]; })
        .spiral("archimedean")
        .on("end", draw)
        .start();

    var wordcloud = svg.append("g")
        .attr('class', 'wordcloud')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    function draw(words) {
        if (chart.smallerFontRepaint) {
            return;
        }
        wordcloud.selectAll("text")
            .data(cloudData.chartData)
            .enter().append("text")
            .attr('class', 'word')
            .style("font-size", function (d) {
                return d.size + "px";
            })
            .style("font-family", function (d) {
                return d.font;
            })
            .style("fill", function (d) {
                return color(d[relationMap.value]);
            })
            .attr("text-anchor", "middle")
            .text(function (d) { return d.text; })
            .on("mouseover", function (d, i) {
                //Get tip data
                var tipData = chart.setTipData(d, i);
                tipData.color = color(d[relationMap.value]);

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
            .on("mouseout", function (d) {
                chart.tip.hideTip();
            })
            .transition().duration("1000")
            .attr("transform", function (d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; });
    }

};

module.exports = jvCharts;
