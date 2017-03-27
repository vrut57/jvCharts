(function () {
    'use strict';

    jvCharts.prototype.circleview = {
        paint: paint,
        setData: setData
    };

    jvCharts.prototype.generateCircle = generateCircle;
    jvCharts.prototype.createLineGuide = createLineGuide;

    /************************************************ Circle functions ******************************************************/

    /**setCircleData
     *  gets Circle data and adds it to the chart object
     *
     * @params data, dataTable, colors
     */
    function setData(chart) {
        chart.data.legendData = setCircleLegendData(chart.data);
        chart.data.xAxisData = setCircleAxisData(chart.data, 'x', chart.options);
        chart.data.yAxisData = setCircleAxisData(chart.data, 'y', chart.options);
        chart.data.zAxisData = chart.data.dataTable.hasOwnProperty('z') ? setCircleAxisData(chart.data, 'z', chart.options) : {};
        //define color object for chartData
        chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, chart.colors);
    }

    /**setCircleLegendData
     *  gets legend info from chart Data
     *
     * @params data, type
     * @returns [] of legend text
     */
    function setCircleLegendData(data) {
        var legendArray = [];
        if (data.dataTable.hasOwnProperty('series')) {
            var item = data.dataTable.series;
            for (var value in data.chartData) {
                var legendElement = data.chartData[value][item];
                if (legendArray.indexOf(legendElement) === -1) {
                    legendArray.push(legendElement);
                }
            }
        } else if (data.dataTable.hasOwnProperty('label')) {
            legendArray.push(data.dataTable.label);
        }
        if (typeof legendArray[0] === 'undefined') {
            legendArray = [];
            legendArray.push(data.dataTable.label);
        }
        //order legend data in alphabetical order
        legendArray.sort();
        return legendArray;
    }

    /**setCircleAxisData
     *  gets z axis data based on the chartData
     *
     * @params data, dataTable
     * @returns object with label and values
     */
    function setCircleAxisData(data, axis, options) {
        //declare vars
        var axisData = [],
            chartData = data.chartData,
            circleLabel = data.dataTable[axis],
            label,
            min = circleLabel ? chartData[0][circleLabel] : 0,
            max = circleLabel ? chartData[0][circleLabel] : 0,
            dataType;
        
        for (var j = 0; j < data.dataTableKeys.length; j++) {
            if (data.dataTableKeys[j].vizType === axis) {
                dataType = data.dataTableKeys[j].type;
                break;
            }
        }

        if (dataType === "STRING" && axis === 'x') {
           if (data.dataTable) {
                if (data.dataTable.hasOwnProperty('x')) {
                    label = data.dataTable.x;
                }
                else {
                    console.error("x doesn't exist in dataTable");
                }
            }
            else {
                console.log("DataTable does not exist");
            }

            var dataType = "STRING";

            //Replace underscores with spaces
            label = label.replace(/_/g, ' ');

            //loop through data to populate axisData
            for (var i = 0; i < chartData.length; i++) {
                if (chartData[i][label] === null) {
                    axisData.push("NULL_VALUE");
                }
                else if (chartData[i][label] === "") {
                    axisData.push("EMPTY_STRING");
                }
                else if (chartData[i][label] || chartData[i][label] === 0) {
                    axisData.push(chartData[i][label]);
                }
            }

            return {
                'label': label,
                'values': axisData,
                'dataType': dataType
            };
        } if (dataType === "STRING" && axis === 'y') {
            var maxStack = 0;
            //Find the max value for Y Data
            for (var i = 0; i < data.dataTableKeys.length; i++) {
                if (data.dataTableKeys[i].vizType !== 'label') {
                    label = data.dataTableKeys[i].varKey;
                }
            }

            //Add all values that are on yaxis to axis data
            for (var i = 0; i < chartData.length; i++) {
                var stack = 0; //Keeps track of the maximum size of stacked data so that axis can be scaled to fit max size
                for (var k in data.dataTable) {
                    if (chartData[i].hasOwnProperty(data.dataTable[k]) && k === 'y') {
                        stack += chartData[i][data.dataTable[k]];
                        axisData.push(chartData[i][data.dataTable[k]]);
                    }
                }
                if (stack > maxStack) {
                    maxStack = stack;
                }

            }
            //Replace underscores with spaces since label is retrieved from dataTableKeys
            label = label.replace(/_/g, ' ');

            return {
                'label': label,
                'values': axisData,
                'dataType': dataType
            };
        } else {
            //loop over data to find max and min
            //also determines the y axis total if the data is stacked
            for (var i = 1; i < chartData.length; i++) {
                if (chartData[i].hasOwnProperty(circleLabel)) {
                    var num = chartData[i][circleLabel];
                    if (!isNaN(num)) {
                        num = parseFloat(num);
                        if (num > max) {
                            max = num;
                        } else if (num < min) {
                            min = num;
                        }
                    }
                }
            }
            if (axis !== 'z') {
                min *= 0.9;
                max *= 1.1;
            }

            if (options) {
                if (options.yMin && !isNaN(options.yMin) && axis === 'y') {
                    min = options.yMin;
                }
                if (options.yMax && !isNaN(options.yMax) && axis === 'y') {
                    max = options.yMax;
                }
                if (options.xMin && !isNaN(options.xMin) && axis === 'x') {
                    min = options.xMin;
                }
                if (options.xMax && !isNaN(options.xMax) && axis === 'x') {
                    max = options.xMax;
                }
            }

            axisData.push(min);
            axisData.push(max);
            return {
                'label': circleLabel,
                'values': axisData,
                'dataType': 'NUMBER',
                'min': min,
                'max': max
            };
        }
        
    }

    function paint(chart) {
        var dataObj = {};

        //Overwrite any pre-existing zoom
        chart.config.zoomEvent = null;

        dataObj.chartData = chart.data.chartData;
        dataObj.legendData = chart.data.legendData;
        dataObj.dataTable = chart.data.dataTable;
        chart.options.color = chart.data.color;
        dataObj.xAxisData = chart.data.xAxisData;
        dataObj.yAxisData = chart.data.yAxisData;
        dataObj.zAxisData = chart.data.zAxisData;
        chart.currentData = dataObj;

        //generate svg dynamically based on legend data
        chart.generateSVG(dataObj.legendData);

        //TODO remove these from draw object
        chart.generateXAxis(chart.currentData.xAxisData);
        chart.generateYAxis(chart.currentData.yAxisData);
        chart.generateLegend(chart.currentData.legendData, 'generateCircle');

        chart.generateCircle();
        chart.createLineGuide();

        if(typeof dataObj.xAxisScale.ticks === "function") {
            chart.formatXAxisLabels(dataObj.xAxisScale.ticks().length);
        } else {
            chart.formatXAxisLabels(dataObj.xAxisScale.domain().length);
        }
    }

    function calculateMean(data, type) {
        return d3.mean(data, function (value) {
            return +value[type];
        });
    }

    function createLineGuide() {
        var chart = this,
            svg = chart.svg,
            options = chart.options,
            container = chart.config.container,
            chartData = chart.currentData.chartData,
            dataTable = chart.currentData.dataTable,
            xAxisData = chart.currentData.xAxisData,
            yAxisData = chart.currentData.yAxisData,
            zoomEvent = chart.config.zoomEvent;

        var xLineVal = calculateMean(chartData, dataTable.x);
        var yLineVal = calculateMean(chartData, dataTable.y);

        var x = chart.getAxisScale('x', xAxisData, container, null, zoomEvent, options);
        var y = chart.getAxisScale('y', yAxisData, container, null, zoomEvent, options);

        svg.selectAll('g.lineguide.x').remove();
        svg.selectAll('g.lineguide.y').remove();

        var lineGroup = svg.append('g')
            .attr('class', 'line-group');

        //x line group for crosshair
        var lineGuideX = lineGroup.append('g')
            .attr('class', 'lineguide x')
            .append('line')
            .style('stroke', 'gray')
            .style('stroke-dasharray', ('3, 3'))
            .style('opacity', function () {
                if (options.lineGuide) {
                    return 1;
                }
                return 0;

            })
            .style('fill', 'black');

        //y line group for crosshair
        var lineGuideY = lineGroup.append('g')
            .attr('class', 'lineguide y')
            .append('line')
            .style('stroke', 'gray')
            .style('stroke-dasharray', ('3, 3'))
            .style('opacity', function () {
                if (options.lineGuide) {
                    return 1;
                }
                return 0;

            })
            .style('fill', 'black');

        //create crosshair based on median x (up/down) 'potentially' passed with data
        lineGuideX
            .attr('x1', x(xLineVal))
            .attr('y1', 0)
            .attr('x2', x(xLineVal))
            .attr('y2', container.height);

        //create crosshair based on median y (left/right) 'potentially' passed with data
        lineGuideY
            .attr('x1', 0)
            .attr('y1', y(yLineVal))
            .attr('x2', container.width)
            .attr('y2', y(yLineVal));

        return lineGroup;
    }
    /**generateCircle
     *
     * creates and draws a Circle plot on the svg element
     * @params svg, CircleData, options, xAxisData, yAxisData, zAxisData, container, dataTable legendData, chartName, zoomEvent
     * @returns {{}}
     */
    function generateCircle() {
        var chart = this,
            svg = chart.svg,
            options = chart.options,
            container = chart.config.container,
            chartName = chart.config.name,
            circleData = chart.currentData.chartData,
            dataTable = chart.currentData.dataTable,
            xAxisData = chart.currentData.xAxisData,
            yAxisData = chart.currentData.yAxisData,
            zAxisData = chart.currentData.zAxisData,
            legendData = chart.currentData.legendData,
            zoomEvent = chart.config.zoomEvent;

        if (!options.NODE_MIN_SIZE) {
            options.NODE_MIN_SIZE = 4.5;
        }
        if (!options.NODE_MAX_SIZE) {
            options.NODE_MAX_SIZE = 25;
        }

        //TODO set up legend toggle array for toggling legend elements

        svg.selectAll('g.circle-container').remove();
        svg.selectAll('g.circle-container.editable-circle').remove();

        var translateX = 0;
        var translateY = 0;
        var zoomScale;

        translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0]; //translates if there is zoom
        zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateX = Math.min(0, translateX);
        translateX = Math.min(0, Math.max(translateX, container.width - (container.width * zoomScale)));

        var colors = options.color;
        var keys = [
            chart.data.dataTable.label,
            chart.data.dataTable.x,
            chart.data.dataTable.y,
            chart.data.dataTable.z,
            chart.data.dataTable.series
        ];
        var data = [];
        var total = 0;

        var circleDataNew = JSON.parse(JSON.stringify(circleData));//copy of pie data


        if (!chart.options.legendHeaders) {
            chart.options.legendHeaders = legendData;
        }

        var dataHeaders = chart.options.legendHeaders;

        var legendElementToggleArray = jvCharts.getLegendElementToggleArray(dataHeaders, legendData);

        var circleDataFiltered = [];

        if (legendElementToggleArray) {
            for (var j = 0; j < circleDataNew.length; j++) {
                for (var i = 0; i < legendElementToggleArray.length; i++) {
                    if (typeof circleDataNew[j][dataTable.label] === 'undefined' || circleDataNew[j][dataTable.label] === '') {
                        if (legendElementToggleArray[i].toggle === false) {
                            //circleDataNew.splice(j,1);
                            circleDataNew[j][dataTable.x] = -1;
                            circleDataNew[j][dataTable.y] = -1;
                            circleDataNew[j][dataTable.z] = -1;
                        }
                    } else if (legendElementToggleArray[i].element === circleDataNew[j][dataTable.series] && legendElementToggleArray[i].toggle === false) {
                        //circleDataNew.splice(j,1);
                        circleDataNew[j][dataTable.x] = -1;
                        circleDataNew[j][dataTable.y] = -1;
                        circleDataNew[j][dataTable.z] = -1;
                    }
                }
            }
        }

        for (var j = 0; j < circleDataNew.length; j++) {
            if (circleDataNew[j][dataTable.x] !== -1 && circleDataNew[j][dataTable.y] !== -1) {
                circleDataFiltered.push(circleDataNew[j]);
            }
        }

        var x = chart.getAxisScale('x', xAxisData, container, null, zoomEvent, options);
        var y = chart.getAxisScale('y', yAxisData, container, null, zoomEvent, options);
        if (!_.isEmpty(zAxisData)) {
            var z = jvCharts.getZScale(zAxisData, container, options, zoomEvent);
        }

        if (chart.data.markerType === 'RINGS') {
            //Radius Scale
            if (yAxisData.min && yAxisData.max) {
                var radiusScale = d3.scaleLinear()
                    .domain([yAxisData.min,yAxisData.max])
                    .range([0,20]);
            } else {
                 var radiusScale = d3.scaleLinear()
                    .domain([xAxisData.min,xAxisData.max])
                    .range([0,20]);
            }
        }

        var cxTranslate,
            cyTranslate;

        cxTranslate = function (d, i) {
            if (xAxisData.dataType === "STRING") { 
                //uses scale band. need to get width of the band 
                //and add half of that to x value of the point.
                return x(circleDataFiltered[i][xAxisData.label]) + (x.bandwidth() / 2);
            } else {
                return x(circleDataFiltered[i][xAxisData.label]);
            }
        };
        cyTranslate = function (d, i) {
            if (yAxisData.dataType === "STRING") {
                return y(circleDataFiltered[i][yAxisData.label]) + (y.bandwidth() / 2); 
            } else {
                return y(circleDataFiltered[i][yAxisData.label]);
            }

        };

        var circles = svg.append('g')
            .attr('class', 'circle-container')
            .selectAll('g');

        var circleGroup = circles
            .data(function () {
                return circleDataFiltered;
            })
            .enter()
            .append('circle')
            .attr('class', function (d, i) {
                return 'editable editable-circle circle-circle-' + i + ' highlight-class';
            })
            .attr('cx', function (d, i) {
                return cxTranslate(d, i);
            })
            .attr('cy', function (d, i) {
                return cyTranslate(d, i);
            })
            .attr("opacity", 0.8)
            .attr('transform', 'translate(' + translateX + ',' + translateY + ')')
            .attr('r', function (d, i) {
                if (chart.data.markerType === 'RINGS') {
                    if (isNaN(d[yAxisData.label]) && !isNaN(d[xAxisData.label])) {
                        return radiusScale(d[xAxisData.label]);
                    } else if (isNaN(d[xAxisData.label]) && !isNaN(d[yAxisData.label])) {
                        return radiusScale(d[yAxisData.label]);
                    } else if (!isNaN(d[xAxisData.label]) && !isNaN(d[yAxisData.label])) {
                        return radiusScale(d[xAxisData.label]); 
                    } else {
                        return 10;
                    }
                } else if (chart.data.markerType === 'POINTS') {
                    if (dataTable.hasOwnProperty('z')) {
                        if (options.toggleZ && !_.isEmpty(zAxisData) && circleDataFiltered[i][dataTable.z]) {
                            return z(circleDataFiltered[i][dataTable.z]);
                        }
                    }
                    return options.NODE_MIN_SIZE;
                }
            })
            .on('mouseover', function (d, i, j) {
                if (chart.draw.showToolTip) {
                    var tipData = chart.setTipData(d, i);

                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
                }
            })
            .on('mousemove', function (d, i) {
                if (chart.draw.showToolTip) {
                    chart.tip.hideTip();
                    //Get tip data
                    var tipData = chart.setTipData(d, i);
                    //Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
                }
            })
            .on('mouseout', function () {
                if (chart.draw.showToolTip) {
                    chart.tip.hideTip();
                }
            })
            .on('zoom', function () {
                if (chart.draw.showToolTip) {
                    //chart.draw.tip.hide();
                }
            })
            .attr('fill', function (d, i) {
                var color;
                if (dataTable.hasOwnProperty('series')) {
                    color = jvCharts.getColors(colors, i, circleDataFiltered[i][dataTable.series]);
                } else {
                    color = jvCharts.getColors(colors, i, circleDataFiltered[i][dataTable.label]);
                }
                return color;
            });

            if (chart.data.markerType === 'RINGS') {
                circleGroup
                    .attr('stroke-width', '4')
                    .attr('fill', '(255,255,255)')
                    .attr('fill-opacity', '0')
                    .attr('stroke', function (d, i) {
                        if (dataTable.hasOwnProperty('series')) {
                            var color = jvCharts.getColors(colors, i, circleDataFiltered[i][dataTable.series]);
                        }
                        else {
                            var color = jvCharts.getColors(colors, i, circleDataFiltered[i][dataTable.label]);
                        }
                        return color;
                    });
            }

        return circles;
    }
})(window, document);
