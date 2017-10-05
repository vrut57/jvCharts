'use strict';
import jvCharts from 'jvCharts.js';

jvCharts.prototype.sunburst = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
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
    if (!chart.data.chartData.hasOwnProperty('children')) {
        chart.data.chartData = jvCharts.convertTableToTree(chart.data.chartData, chart.data.dataTable, true);
    }

    chart.data.color = chart.colors;
}

function getEventData() {
    return {};
}

function paint() {
    var chart = this,
        sunburstMargins = {
            top: 15,
            right: 15,
            bottom: 15,
            left: 15
        };

    chart._vars.color = chart.data.color;
    chart.currentData = chart.data;

    //Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, sunburstMargins);
    //chart.generateLegend(chart.currentData.legendData, 'generateSunburst');
    chart.generateSunburst();
}

/**generateSunburst
 *
 * paints the sunburst on the chart
 * @params sunburstData
 */
function generateSunburst() {
    var chart = this,
        svg = chart.svg,
        vis,
        text,
        container = chart.config.container,
        width = container.width,
        height = container.height,
        radius = (Math.min(width, height) / 2) - 10,
        x = d3.scaleLinear()
            .range([0, 2 * Math.PI]),
        y = d3.scaleSqrt()
            .range([0, radius]),
        color = d3.scaleOrdinal()
            .range(chart.data.color
                .map(c => {
                    c = d3.rgb(c);
                    c.opacity = 1;
                    return c;
                })),
        partition = d3.partition(),
        arc = d3.arc()
            .startAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x0))))
            .endAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x1))))
            .innerRadius(d => Math.max(0, y(d.y0)))
            .outerRadius(d => Math.max(0, y(d.y1))),

        //assigns the data to a hierarchy using parent-child relationships
        root = d3.hierarchy(chart.currentData.chartData, d => d.children);

    root.sum(d => d.value);

    vis = svg.append('g')
        .attr('class', 'sunburst')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(' + width / 2 + ',' + (height / 2) + ')');


    vis.selectAll('path')
        .data(partition(root).descendants())
        .enter().append('g').attr('class', 'node');

    vis.selectAll('.node')
        .append('path')
        .attr('stroke', 'white')
        .attr('d', arc)
        .style('fill', d => {
            if (d.data.name === 'root') {
                d.color = chart._vars.backgroundColor;
                return chart._vars.backgroundColor;
            }
            d.color = color(d.data.name);
            return color(d.data.name);
        })
        .on('mouseover', function (d, i) {
            if (chart.showToolTip) {
                var tipData = chart.setTipData(d, i);

                //Draw tip line
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
        .on('click', click)
        .on('mouseout', function () {
            chart.tip.hideTip();
        });

    if (chart._vars.displayValues) {
        text = vis.selectAll('.node')
            .append('text')
            .attr('transform', d => `rotate(${computeTextRotation(d)})`)
            .attr('x', d => y(d.y0))
            .attr('dx', '6') //margin
            .attr('dy', '.35em') //vertical-align
            .text(d => {
                if (Number(d.data.value) > 0) {
                    return d.data.name === 'root' ? '' : d.data.name;
                }
                return '';
            });
    }


    function click(d) {
        //fade out all text elements
        if (chart._vars.displayValues) {
            text.transition().attr('opacity', 0);
        }

        vis.transition()
            .duration(750)
            .tween('scale', () => {
                var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(y.domain(), [d.y0, 1]),
                    yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);

                return t => { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
            })
            .selectAll('path')
            .attrTween('d', ele => () => arc(ele))
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
                            .attr('transform', () => `rotate(${computeTextRotation(e)})`)
                            .attr('x', ele => y(ele.y0))
                            .text(ele => ele.data.name === 'root' ? '' : ele.data.name);
                    }
                }
            });
    }

    function computeTextRotation(d) {
        return (x((d.x0 + d.x1) / 2) - Math.PI / 2) / Math.PI * 180;
    }
}

export default jvCharts;
