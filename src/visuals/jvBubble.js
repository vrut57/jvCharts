'use strict';
import jvCharts from 'jvCharts.js';

jvCharts.prototype.bubble = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generateBubble = generateBubble;

/************************************************ Bubble functions ******************************************************/

function paint(transitionTime) {
    var chart = this,
        bubbleMargins = {
            top: 15,
            right: 15,
            left: 15,
            bottom: 15
        };
    if (transitionTime || transitionTime === 0) {
        chart._vars.transitionTime = transitionTime;
    } else if (!chart._vars.transitionTime) {
        chart._vars.transitionTime = 800;
    }
    if (!chart.smallerFontRepaint) {
        chart._vars.fontSizeMax = 80;
        chart.currentData = chart.data;
    } else {
        chart.currentData = JSON.parse(JSON.stringify(chart.data));
    }

    chart._vars.color = chart.data.color;

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, bubbleMargins);
    chart.generateVerticalLegend('generateBubble');
    chart.generateBubble(chart.currentData);
}

/**setData
 *  gets Bubble data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    //define color object for chartData
    chart.data.legendData = setBubbleLegendData(chart.data);
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

function getEventData() {
    return {};
}

/**setBubbleLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setBubbleLegendData(data) {
    var legendArray = [],
        item = data.dataTable.label;

    for (let value in data.chartData) {
        if (data.chartData.hasOwnProperty(value)) {
            let legendElement = data.chartData[value][item];
            if (legendArray.indexOf(legendElement) === -1) {
                legendArray.push(legendElement);
            }
        }
    }

    return legendArray;
}


/** generateBubble
 *
 * paints the bubble  on the chart
 * @params bubble Data
 */
function generateBubble(bubbleData) {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        width = container.width,
        height = container.height,
        pack = d3.pack().size([width, height]).padding(1.5),
        legendData = chart.data.legendData,
        valueKey = chart.data.dataTable.value,
        labelKey = chart.data.dataTable.label,
        colors = chart._vars.color,
        dataHeaders,
        bubbleDataNew,
        legendElementToggleArray,
        root,
        bubble;

    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }
    dataHeaders = chart._vars.legendHeaders;
    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }
    bubbleDataNew = jvCharts.getToggledData(bubbleData, dataHeaders);
    legendElementToggleArray = jvCharts.getLegendElementToggleArray(dataHeaders, legendData);

    if (legendElementToggleArray) {
        for (let j = 0; j < bubbleDataNew.length; j++) {
            for (let legendEle of legendElementToggleArray) {
                if (legendEle.element === bubbleDataNew[j][labelKey] && legendEle.toggle === false) {
                    bubbleDataNew.splice(j, 1);
                }
            }
        }
    }
    svg.selectAll('.bubble').remove();
    //assigns the data to a hierarchy using parent-child relationships
    root = d3.hierarchy({ children: bubbleDataNew })
        .sum(d => d[valueKey]);

    bubble = svg.selectAll('.bubble')
        .data(pack(root).leaves())
        .enter().append('g')
        .attr('class', 'bubble')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    bubble.append('circle')
        .attr('fill', d => jvCharts.getColors(colors, legendData.indexOf(d.data[labelKey]), d.data[labelKey]))
        .attr('class', (d, i) => `editable editable-bubble bubble-${i} highlight-class-${i}`)
        .attr('r', d => d.r)
        .on('mouseover', function (d, i) {
            if (chart.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d.data, i);
                //Draw tip line
                tipData.data.color = jvCharts.getColors(colors, tipData.index, d.data[labelKey]);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                chart.tip.d = d.data;
                chart.tip.i = i;
            }
        })
        .on('mousemove', function (d, i) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(0);
                } else {
                    //Get tip data
                    var tipData = chart.setTipData(d.data, i);
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                }
            }
        })
        .on('mouseout', function (d) {
            if (chart.showToolTip) {
                chart.tip.hideTip();
            }
        });

    bubble.append('text')
        .attr('class', 'bubble-text')
        .text(d => d.data[labelKey])
        .attr('fill', 'white')
        //hide text if its too wide
        .attr('style', function (d) {
            if (this.clientWidth > d.r * 2) {
                return 'display: none';
            }
            return '';
        })
        //center the text on the bubble
        .attr('transform', function (d) {
            var diameter = d.r * 2,
                textWidth = this.clientWidth,
                emptySpace = diameter - textWidth;

            if (emptySpace < 0) {
                return '';
            }
            return `translate(-${d.r - (emptySpace / 2)}, 0)`;
        })
        .on('mouseover', function (d, i) {
            if (chart.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d.data, i);

                //Draw tip line
                tipData.data.color = jvCharts.getColors(colors, tipData.index, d.data[labelKey]);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                chart.tip.d = d.data;
                chart.tip.i = i;
            }
        })
        .on('mousemove', function (d, i) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(0);
                } else {
                    //Get tip data
                    var tipData = chart.setTipData(d.data, i);
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                }
            }
        })
        .on('mouseout', function () {
            if (chart.showToolTip) {
                chart.tip.hideTip();
            }
        });

    bubble.append('text')
        .text(d => d.data[valueKey])
        .attr('fill', 'white')
        //hide text if its too wide
        .attr('style', function (d) {
            if (this.clientWidth > d.r * 2) {
                return 'display: none';
            }
            return '';
        })
        //center the text on the bubble
        .attr('transform', function (d) {
            var diameter = d.r * 2,
                textWidth = this.clientWidth,
                emptySpace = diameter - textWidth;

            if (emptySpace < 0) {
                return '';
            }
            return `translate(-${d.r - (emptySpace / 2)}, 15)`;
        })
        .on('mouseover', function (d, i) {
            if (chart.showToolTip) {
                //Get tip data
                var tipData = chart.setTipData(d.data, i);

                //Draw tip line
                tipData.data.color = jvCharts.getColors(colors, tipData.index, d.data[labelKey]);
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                chart.tip.d = d.data;
                chart.tip.i = i;
            }
        })
        .on('mousemove', function (d, i) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(0);
                } else {
                    //Get tip data
                    var tipData = chart.setTipData(d.data, i);
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable);
                }
            }
        })
        .on('mouseout', function () {
            if (chart.showToolTip) {
                chart.tip.hideTip();
            }
        });
}

export default jvCharts;
