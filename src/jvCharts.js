'use strict';
/***  jvCharts ***/
var jvTip = require('./jvTip.js');

/**Create a jvCharts object
 * @constructor
 * @param {Object} configObj - Configuration object passed into jvCharts constructor
 * @param {string} configObj.type - The type of chart
 * @param {string} configObj.name - The name of the chart
 * @param {Object} configObj.container - The container of the chart
 * @param {Object} configObj.userOptions - UI options for the chart
 * @param {Object} configObj.tipConfig - Configuration object for jvTooltip
 * @param {Object} configObj.chartDiv - A div wrapper for the chart and other jv features
 */
class jvCharts {
    constructor(configObj) {
        var chart = this;
        configObj.type = configObj.type.toLowerCase();
        chart.chartDiv = configObj.chartDiv;
        configObj.options = cleanToolData(configObj.options, configObj.editOptions);
        chart._vars = chart.getDefaultOptions(configObj.options);
        chart.mode = configObj.mode || 'default-mode';

        //remove pieces from config that have been copied somewhere else
        delete configObj.chartDiv;
        delete configObj.options;
        delete configObj.mode;

        chart.config = configObj;

        chart.createTooltip();
        chart.setData();
        chart.paint();
    }

    createTooltip() {
        var chart = this;
        chart.tip = new jvTip({
            config: chart.config.tipConfig,
            chartDiv: chart.chartDiv
        });
    }

    setData() {
        var chart = this;
        if (chart.config.setData) {
            chart.data = {
                chartData: chart.config.setData.data,
                dataTable: chart.config.setData.dataTable,
                dataTableKeys: chart.config.setData.dataTableKeys,
                tipData: chart.config.setData.tipData
            };
            chart.colors = chart.config.setData.colors;
            if (chart.config.setData.additionalInfo) {
                chart.data.additionalInfo = chart.config.setData.additionalInfo;
            }
            if (chart.config.setData.markerType) {
                chart.data.markerType = chart.config.setData.markerType;
            }
            if (chart.config.setData.materiality) {
                chart.data.materiality = chart.config.setData.materiality;
            }
            if (chart.config.setData.slidervalue) {
                chart.data.slidervalue = chart.config.setData.slidervalue;
            }
            chart[chart.config.type].setData.call(chart);
        }
    }

    paint() {
        var chart = this;
        if (chart.data && typeof chart[chart.config.type] === 'object' && typeof chart[chart.config.type].paint === 'function') {
            chart[chart.config.type].paint.call(chart);
            chart.initializeModes();
        } else {
            console.log('no paint function for: ' + chart.config.type);
        }
    }

    // end of constructor


    setAxisData(axis, data, keys) {
        var chart = this;
        var axisData = [];
        var chartData = data.chartData;
        var label = '';
        var maxStack = 0,
            dataTableKeys = data.dataTableKeys,
            dataType;

        if (!dataTableKeys) {
            dataTableKeys = keys;
        }

        //Step 1: find out what the label is for the axis
        if (axis === 'x') {
            if (data.dataTable) {
                if (data.dataTable.hasOwnProperty('label')) {
                    label = data.dataTable.label;
                } else {
                    console.error("Label doesn't exist in dataTable");
                    // throw new Error('Label doesn\'t exist in dataTable');
                }
            } else {
                console.log('DataTable does not exist');
            }

            dataType = 'STRING';

            //Replace underscores with spaces
            label = label.replace(/_/g, ' ');

            //loop through data to populate axisData
            for (var i = 0; i < chartData.length; i++) {
                if (chartData[i][label] === null) {
                    axisData.push('NULL_VALUE');
                } else if (chartData[i][label] === '') {
                    axisData.push('EMPTY_STRING');
                } else if (chartData[i][label] || chartData[i][label] === 0) {
                    axisData.push(chartData[i][label]);
                }
            }
        } else {
            if (dataTableKeys === undefined) {
                console.error('dataTableKeys do not exist');
                // throw new Error('dataTableKeys do not exist');
            }
            //Find the max value for Y Data
            var count = 0;

            for (var i = 0; i < dataTableKeys.length; i++) {
                if (dataTableKeys[i].vizType !== 'label' && dataTableKeys[i].vizType !== 'tooltip' && dataTableKeys[i].vizType !== 'series') {
                    label = dataTableKeys[i].varKey;
                    count++;
                }
            }
            dataType = getDataTypeFromKeys(label, dataTableKeys);

            //Add all values that are on yaxis to axis data
            for (var i = 0; i < chartData.length; i++) {
                var stack = 0; //Keeps track of the maximum size of stacked data so that axis can be scaled to fit max size
                for (var k in data.dataTable) {
                    if (chartData[i].hasOwnProperty(data.dataTable[k]) && k !== 'label' && k.indexOf('tooltip') === -1 && k !== 'series') {
                        stack += chartData[i][data.dataTable[k]];
                        axisData.push(chartData[i][data.dataTable[k]]);
                    }
                }
                if (stack > maxStack) {
                    maxStack = stack;
                }
            }
            //Replace underscores with spaces since label is retrieved from dataTableKeys

            //If there are multiple values on the yAxis, don't specify a label
            if (count > 1) {
                label = "";
            }
            label = label.replace(/_/g, ' ');
        }

        //Find the min and max of numeric data for building axes and add it to the returned object
        if (dataType === 'NUMBER') {
            if (chart._vars.stackToggle) {
                var max = maxStack;
            } else {
                var max = Math.max.apply(null, axisData);
            }

            var min = Math.min.apply(null, axisData);
            min = Math.min(0, min);

            //Check if there's an axis min/max set

            if (axis === 'x') {
                if (chart._vars.xMin != null && chart._vars.xMin !== 'none') {
                    min = chart._vars.xMin;
                }
                if (chart._vars.xMax != null && chart._vars.xMax !== 'none') {
                    max = chart._vars.xMax;
                }
            } else if (axis === 'y') {
                if (chart._vars.yMin != null && chart._vars.yMin !== 'none') {
                    min = chart._vars.yMin;
                }
                if (chart._vars.yMax != null && chart._vars.yMax !== 'none') {
                    max = chart._vars.yMax;
                }
            }

            if (dataType === 'NUMBER' && axisData.length === 1) {
                if (axisData[0] >= 0) {
                    axisData.unshift(0);
                } else {
                    axisData.push(0);
                }
            }

            var temp;
            var tempMin = parseInt(min);
            var tempMax = parseInt(max);
            //Make sure that axis min and max don't get flipped
            if (tempMin > tempMax) {
                temp = min;
                min = max;
                max = temp;
            }

            return {
                'label': label,
                'values': axisData,
                'dataType': dataType,
                'min': min,
                'max': max
            };
        }

        return {
            'label': label,
            'values': axisData,
            'dataType': dataType
        };
    }


    /**setFlippedSeries
     *  flips series and returns flipped data
     *
     * @params chartData, dataTable, dataLabel
     * @returns Object of data and table for flipped series
     */
    setFlippedSeries(dataTableKeys) {
        var chart = this;
        var chartData = chart.data.chartData;
        var dataTable = chart.data.dataTable;
        var dataLabel = chart.data.xAxisData.label;

        var flippedData = [];
        var flippedDataTable = {};
        var valueCount = 1;
        var filteredDataTableArray = [];

        for (var k in dataTable) {
            if (dataTable.hasOwnProperty(k)) {
                var flippedObject = {};
                if (dataTable[k] !== dataLabel) {
                    flippedObject[dataLabel] = dataTable[k];
                    for (var i = 0; i < chartData.length; i++) {
                        flippedObject[chartData[i][dataLabel]] = chartData[i][dataTable[k]];
                        if (filteredDataTableArray.indexOf(chartData[i][dataLabel]) === -1) {
                            flippedDataTable['value ' + valueCount] = chartData[i][dataLabel];
                            valueCount++;
                            filteredDataTableArray.push(chartData[i][dataLabel]);
                        }
                    }
                    flippedData.push(flippedObject);
                }
            }
        }
        flippedDataTable.label = dataLabel;
        chart.flippedData = { chartData: flippedData, dataTable: flippedDataTable };

        if (chart.config.type === 'bar' || chart.config.type === 'line' || chart.config.type === 'area') {
            chart.flippedData.xAxisData = chart.setAxisData('x', chart.flippedData, dataTableKeys);
            chart.flippedData.yAxisData = chart.setAxisData('y', chart.flippedData, dataTableKeys);
            chart.flippedData.legendData = setBarLineLegendData(chart.flippedData);
        } else {
            console.log('Add additional chart type to set flipped series');
        }
    }

    /**organizeChartData
     *  reorders all data based on the sortLabel and sortType
     *  -Only for chartData, does not work with flipped data
     *
     * @params sortLabel , sortType
     * @returns [] sorted data
     */
    organizeChartData(sortParam, sortType) {
        var chart = this,
            organizedData,
            dataType,
            dataTableKeys = chart.data.dataTableKeys,
            sortLabel = sortParam;

        //If sortLabel doesn't exist, sort on the x axis label by default
        if (sortLabel === 'none') {
            for (var i = 0; i < dataTableKeys.length; i++) {
                if (dataTableKeys[i].vizType === 'label') {
                    sortLabel = dataTableKeys[i].uri;
                    break;
                }
            }
        }

        //Remove underscores from sortLabel
        if (sortLabel) {
            sortLabel = sortLabel.replace(/_/g, ' ');
        }

        if (!chart.data.chartData[0][sortLabel]) {
            //Check if the sort label is a calculatedBy field
            var isValidSortLabel = false;
            for (var i = 0; i < dataTableKeys.length; i++) {
                var obj1 = dataTableKeys[i];
                if (obj1.operation.hasOwnProperty('calculatedBy') && obj1.operation.calculatedBy[0] === sortLabel) {
                    sortLabel = obj1.uri.replace(/_/g, ' ');
                    isValidSortLabel = true;
                    break;
                }
            }
            //If it's not a valid sort label, return and don't sort the data
            if (!isValidSortLabel) {
                console.error('Not a valid sort');
                // throw new Error('Not a valid sort');
            }
        }

        //Check the data type to determine which logic to flow through
        for (var i = 0; i < dataTableKeys.length; i++) {
            var obj = dataTableKeys[i];
            //Loop through dataTableKeys to find sortLabel
            if (obj.uri.replace(/_/g, ' ') === sortLabel) {
                dataType = obj.type;
                break;
            }
        }

        //Date sorting
        if (dataType != null && dataType === 'DATE') {
            organizedData = chart.data.chartData.sort(function (a, b) {
                var c = new Date(a[sortLabel]);
                var d = new Date(b[sortLabel]);
                return c - d;
            });
        } else if (dataType != null && dataType === 'NUMBER') {
            organizedData = chart.data.chartData.sort(function (a, b) {
                if (!isNaN(a[sortLabel]) && !isNaN(b[sortLabel])) {
                    return a[sortLabel] - b[sortLabel];
                }
            });
        } else {
            organizedData = chart.data.chartData.sort(function (a, b) {
                if (!isNaN(a[sortLabel]) && !isNaN(b[sortLabel])) {
                    if (parseFloat(a[sortLabel]) < parseFloat(b[sortLabel])) { //sort string ascending
                        return -1;
                    }
                    if (parseFloat(a[sortLabel]) > parseFloat(b[sortLabel])) {
                        return 1;
                    }
                    return 0;
                }
                if (a[sortLabel].toLowerCase() < b[sortLabel].toLowerCase()) { //sort string ascending
                    return -1;
                }
                if (a[sortLabel].toLowerCase() > b[sortLabel].toLowerCase()) {
                    return 1;
                }
                return 0;
            });
        }

        switch (sortType) {
            case 'sortAscending':
            case 'ascending':
                chart.data.chartData = organizedData;
                break;
            case 'sortDescending':
            case 'descending':
                chart.data.chartData = organizedData.reverse();
                break;
            default:
                chart.data.chartData = organizedData;
        }
    }

    /**setTipData
     *
     * creates data object to display in tooltip
     * @params
     * @returns {{}}
     */
    setTipData(d, i) {
        var chart = this,
            data = chart.currentData.chartData;

        //Get Color from chartData and add to object
        var color = chart._vars.color;

        var title = d[chart.data.dataTable.label];
        var dataTable = {};

        if (chart.config.type === 'treemap') {
            for (var item in d) {
                if (item !== chart.data.dataTable.label && item !== 'Parent') {
                    dataTable[item] = d[item];
                }
            }
        } else if (chart.config.type === 'bar' || chart.config.type === 'line' || chart.config.type === 'area') {
            title = data[i][chart.data.dataTable.label];
            for (var item in data[i]) {
                if (item !== chart.data.dataTable.label) {
                    dataTable[item] = data[i][item];
                } else {
                    continue;
                }
            }
        } else if (chart.config.type === 'gantt') {
            //Calculate length of dates
            for (item in data[i]) {
                if (data[i].hasOwnProperty(item) && item !== chart.data.dataTable.group) {
                    dataTable[item] = data[i][item];
                }
            }

            var start,
                end,
                difference;

            //Calculting duration of date ranges to add to tooltip
            var numPairs = Math.floor(Object.keys(chart.data.dataTable).length / 2);
            for (var j = 1; j <= numPairs; j++) {
                start = new Date(data[i][chart.data.dataTable['start ' + j]]);
                end = new Date(data[i][chart.data.dataTable['end ' + j]]);
                difference = end.getTime() - start.getTime();
                dataTable['Duration ' + j] = Math.ceil(difference / (1000 * 60 * 60 * 24)) + ' days';
            }

            title = data[i][chart.data.dataTable.group];
        } else if (chart.config.type === 'pie' || chart.config.type === 'radial') {
            title = d.label;
            for (var item in d) {
                if (item !== 'label') {
                    dataTable[item] = d[item];
                } else {
                    continue;
                }
            }
            delete dataTable.outerRadius;
        } else if (chart.config.type === 'circlepack' || chart.config.type === 'sunburst') {
            title = d.data.name;
            dataTable[chart.data.dataTable.value] = d.value;
            // title = d.name;
            // dataTable[chart.data.dataTable.value] = d[chart.data.dataTable.value.replace(/_/g, ' ')];
            // if(typeof d[chart.data.dataTable["tooltip 1"]] != 'undefined'){
            //     dataTable[chart.data.dataTable["tooltip 1"]] = d[chart.data.dataTable["tooltip 1"]];
            // }
        } else if (chart.config.type === 'cloud') {
            title = d[chart.data.dataTable.label];
            dataTable[chart.data.dataTable.value] = d[chart.data.dataTable.value];
            if (typeof d[chart.data.dataTable["tooltip 1"]] != 'undefined') {
                dataTable[chart.data.dataTable["tooltip 1"]] = d[chart.data.dataTable["tooltip 1"]];
            }
        } else if (chart.config.type === 'heatmap') {
            title = d.yAxisName + ' to ' + d.xAxisName;
            if (d.hasOwnProperty('value')) {
                dataTable.value = d.value;
            }
            for (var tooltip in d) {
                if (tooltip.indexOf('tooltip') > -1) {
                    dataTable[chart.data.dataTable[tooltip]] = d[tooltip];
                }
            }
        } else if (chart.config.type === 'clustergram') {
            title = d.y_child_value + ' to ' + d.x_child_value;
            if (d.hasOwnProperty('value')) {
                dataTable.value = d.value;
            }
            for (var tooltip in d) {
                if (tooltip.indexOf('tooltip') > -1) {
                    dataTable[chart.data.dataTable[tooltip]] = d[tooltip];
                }
            }
        } else if (chart.config.type === 'sankey') {
            title = d.source.name.slice(0, -2) + ' to ' + d.target.name.slice(0, -2);

            if (d.hasOwnProperty('value')) {
                dataTable.value = d.value;
            }
        } else if (chart.config.type === 'singleaxis') {
            title = d.data[chart.data.dataTable.label];

            for (var item in chart.data.dataTable) {
                if (item != 'label') {
                    dataTable[chart.data.dataTable[item]] = d.data[chart.data.dataTable[item]];
                }
            }
        } else {
            for (var item in d) {
                if (item !== chart.data.dataTable.label) {
                    dataTable[item] = d[item];
                } else {
                    continue;
                }
            }
        }


        return { 'data': d, 'tipData': dataTable, 'index': i, 'title': title, 'color': color, 'viz': chart.config.type };
    }

    /************************************************ Draw functions ******************************************************/

    /**generateSVG
     *creates an SVG element on the panel
     *
     * @params container, margin, name
     *
     */
    generateSVG(legendData, customMarginParam, customSizeParam) {
        var chart = this,
            margin = {},
            container = {},
            dimensions = chart.chartDiv.node().getBoundingClientRect(),
            customMargins = customMarginParam,
            customSize = customSizeParam,
            textWidth;

        if (chart._vars.customMargins) {
            customMargins = chart._vars.customMargins;
        }

        //set margins
        if (!customMargins) {
            //declare margins if they arent passed in
            margin = {
                top: 55,
                right: 50,
                left: 100,
                bottom: 70
            };
            if (legendData != null) {
                if (legendData.length <= 3) {
                    margin.bottom = 70;
                } else if (legendData.length <= 6) {
                    margin.bottom = 85;
                } else {
                    margin.bottom = 130;
                }
            }
        } else {
            margin = customMargins;
        }

        //reduce margins if legend is toggled off
        //TODO make this better
        if (chart._vars.toggleLegend === false) {
            if (chart.config.type === 'pie' || chart.config.type === 'radial' || chart.config.type === 'circlepack' || chart.config.type === 'heatmap') {
                margin.left = 40;
            } else if (chart.config.type === 'treemap' || chart.config.type === 'bar' || chart.config.type === 'gantt' || chart.config.type === 'scatter' || chart.config.type === 'line') {
                margin.bottom = 40;
            }
        }

        //set yAxis margins
        if (chart.currentData && chart.currentData.yAxisData) {
            textWidth = getMaxWidthForAxisData('y', chart.currentData.yAxisData, chart._vars, dimensions, margin, chart.chartDiv, chart.config.type);
            if (textWidth > 100 && chart.config.type === 'heatmap') {
                textWidth = 100;
            }
            chart._vars.heatmapYmargin = textWidth;
            margin.left = Math.ceil(textWidth) + 30;
        }

        //set xAxis top margins
        if (chart.config.type === 'heatmap' && chart.currentData && chart.currentData.xAxisData) {
            textWidth = getMaxWidthForAxisData('x', chart.currentData.xAxisData, chart._vars, dimensions, margin, chart.chartDiv, chart.config.type);
            //subtract space for tilt
            textWidth = Math.ceil(textWidth);
            if (textWidth > 100) {
                textWidth = 100;
            }
            //specific to heatmap
            if (chart.config.type === 'heatmap') {
                if (textWidth > 100) {
                    textWidth = 100;
                } else if (textWidth < 80) {
                    textWidth = 80;
                }
            }
            chart._vars.heatmapXmargin = textWidth;
            margin.top = textWidth;
            customSize = {};
            //set container
            customSize.width = chart.currentData.xAxisData.values.length * 20;
            customSize.height = chart.currentData.yAxisData.values.length * 20;

            if (!chart._vars.toggleLegend) {
                var dummyObj = {};
                dummyObj.values = chart.data.heatData;
                dummyObj.values.sort(function (a, b) { return a - b });
                dummyObj.label = "";
                dummyObj.min = dummyObj.values[0];
                dummyObj.max = dummyObj.values[dummyObj.values.length - 1];

                textWidth = getMaxWidthForAxisData('y', dummyObj, chart._vars, dimensions, margin, chart.chartDiv, chart.config.type);
                chart.config.heatWidth = Math.ceil(textWidth) + 30;
                margin.left = margin.left + chart.config.heatWidth
            }

            if (customSize.width + margin.left + margin.right < dimensions.width) {
                margin.right = parseInt(dimensions.width) - margin.left - customSize.width - 20;
            }
            if (customSize.height + margin.top + margin.bottom < dimensions.height) {
                margin.bottom = parseInt(dimensions.height) - margin.top - customSize.height - 10;
            }
            customSize.width += margin.right + margin.left;
            customSize.height += margin.top + margin.bottom;
        }

        //set container attributes
        //Set svg size based on calculation margins or custom size if specified
        if (customSize && customSize.hasOwnProperty('height')) {
            container.height = customSize.height - margin.top - margin.bottom;
        } else {
            container.height = parseInt(dimensions.height) - margin.top - margin.bottom;
            if (container.height <= 50) {
                margin.top = 10;
                margin.bottom = 10;
                container.height = parseInt(dimensions.height) - margin.top - margin.bottom;
                chart._vars.xLabelFontSize = 0;
            }
        }

        if (customSize && customSize.hasOwnProperty('width')) {
            container.width = customSize.width - margin.left - margin.right;
        } else {
            container.width = parseInt(dimensions.width) - margin.left - margin.right;
        }

        //add margin and container to chart config object
        chart.config.margin = margin;
        chart.config.container = container;

        //remove old svg if it exists
        chart.svg = chart.chartDiv.select('svg').remove();

        //svg layer
        if (chart.config.type === 'heatmap' || chart.config.type === 'singleaxis') {
            chart.svg = chart.chartDiv.append('svg')
                .attr('class', 'editable-svg')
                .attr('width', container.width + margin.left + margin.right)
                .attr('height', container.height + margin.top + margin.bottom)
                .append('g')
                .attr('class', 'container')
                .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');
        } else if (chart.config.type === 'clustergram') {
            if (chart.data.chartData[2].length * 10 > container.width || chart.data.chartData[2].length * 10 > container.height) {
                chart.svg = chart.chartDiv.append('svg')
                    .attr('class', 'editable-svg')
                    .attr('width', (chart.data.chartData[2].length * 10))
                    .attr('height', (chart.data.chartData[2].length * 10))
                    .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');
            } else {
                chart.svg = chart.chartDiv.append('svg')
                    .attr('class', 'editable-svg')
                    .attr('width', container.width)
                    .attr('height', container.height)
                    .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');
            }
        } else {
            chart.svg = chart.chartDiv.append('svg')
                .attr('class', 'editable-svg')
                .attr('width', container.width + margin.left + margin.right)
                .attr('height', container.height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');
        }

        //TODO move to edit mode
        if (chart._vars.backgroundColor !== 'none') {
            chart.colorBackground(chart._vars.backgroundColor);
        }
    }

    /**generateXAxis
     * creates x axis on the svg
     *
     * @params xAxisData
     */
    generateXAxis(xAxisData, ticks) {
        //declare variables
        var chart = this,
            xAxis,
            //Need to getXAxisScale each time so that axis updates on resize
            xAxisScale = jvCharts.getAxisScale('x', xAxisData, chart.config.container, chart._vars),
            containerHeight = chart.config.container.height,
            containerWidth = chart.config.container.width,
            xAxisClass = 'xAxisLabels editable editable-xAxis editable-text';

        //assign css class for edit mode
        //if the axis is numbers add editable-num
        if (xAxisData.dataType === 'NUMBER') {
            xAxisClass += ' editable-num';
        }

        //remove previous xAxis container if its there
        chart.svg.selectAll('.xAxisContainer').remove();

        //Save the axis scale to chart object
        chart.currentData.xAxisScale = xAxisScale;

        var tickSize = 0;
        if (chart.currentData.xAxisData.dataType === 'NUMBER') {
            tickSize = 5;
        }

        //create xAxis drawing function
        if (chart.config.type === 'singleaxis') {
            xAxis = d3.axisTop(xAxisScale)
                .tickSize(tickSize);
        } else {
            xAxis = d3.axisBottom(xAxisScale)
                .tickSize(tickSize);
        }

        if (ticks) {
            xAxis.ticks(ticks);
        }


        var axisHeight = containerHeight;
        if (chart.config.type === 'singleaxis') {//For any axes that are on top of the data
            axisHeight = 0;
        }

        var xContent = chart.svg.append('g')
            .attr('class', 'xAxisContainer')
            .attr('transform', 'translate(0,' + (axisHeight) + ')');

        var xAxisGroup = xContent.append('g')
            .attr('class', 'xAxis')
            .call(xAxis);

        var formatValueType = jvFormatValueType(xAxisData.values);

        //Styling the axis
        xAxisGroup.select('path')
            .attr('stroke', chart._vars.axisColor)
            .attr('stroke-width', chart._vars.strokeWidth);

        //Styling for ticks
        xAxisGroup.selectAll('line')
            .attr('stroke', chart._vars.axisColor)
            .attr('stroke-width', chart._vars.stroke);

        //Styling the labels for each piece of data
        xAxisGroup.selectAll('text')
            .attr('fill', chart._vars.fontColor)//Customize the color of axis labels
            .attr('class', xAxisClass)
            .style('text-anchor', 'middle')
            .attr('font-size', chart._vars.fontSize)
            .attr('transform', 'translate(0, 3)')
            .text(function (d) {
                if (xAxisData.dataType === 'NUMBER' || chart._vars.rotateAxis) {
                    return jvFormatValue(d, formatValueType);
                }
                return d;
            });

        //Styling the label for the entire axis
        xContent.append('g')
            .attr('class', 'xLabel')
            .append('text')
            .attr('class', 'xLabel editable editable-text editable-content')
            .attr('text-anchor', 'middle')
            .attr('font-size', chart._vars.fontSize)
            .text(function () {
                if (xAxisData.dataType === 'DATE') {
                    return '';
                }
                return xAxisData.label;
            })
            .attr('transform', 'translate(' + containerWidth / 2 + ', 33)');
    }

    /**FormatXAxisLabels
     *
     * If x-axis labels are too long/overlapping, they will be hidden/shortened
     */
    formatXAxisLabels(dataLength, recursion) {
        var chart = this,
            showAxisLabels = true,
            xAxisLength = chart.config.container.width,
            textWidth = [],
            formatValueType = null,
            dataType = chart.currentData.xAxisData.dataType,
            axisValues = chart.currentData.xAxisData.values;

        if (dataType === 'NUMBER') {
            formatValueType = jvFormatValueType(axisValues);
        }

        //create dummy text to determine computed text length for the axis labels
        //necessary to do this because axis labels getBBox() is returning 0 since they do not seem to be drawn yet
        chart.svg.append('g')
            .selectAll('.dummyText')
            .data(axisValues)
            .enter()
            .append('text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', chart._vars.fontSize)
            .text(function (d) {
                var returnVal = d;
                if (dataType === 'NUMBER') {
                    returnVal = jvFormatValue(d, formatValueType);
                }
                return returnVal;
            })
            .each(function () {
                //adding 10px buffer
                var thisWidth = this.getComputedTextLength() + 10;
                textWidth.push(thisWidth);
                this.remove(); //remove them just after displaying them
            });

        for (var i = 0; i < textWidth.length; i++) {
            var textEleWidth = textWidth[i];
            if (textEleWidth > xAxisLength / dataLength) {
                showAxisLabels = false;
            }
        }

        if (showAxisLabels) {
            if (recursion) {
                chart.generateXAxis(chart.currentData.xAxisData, dataLength);
            }
            chart.svg.selectAll('.xAxisLabels').style('display', 'block');
        } else if (dataLength > 1 && chart.currentData.xAxisData.dataType === 'NUMBER') {
            //recursively keep decreasing to figure out ticks length to repaint the xAxis if its numeric
            chart.formatXAxisLabels((dataLength - 1), true);
        } else {
            chart.svg.selectAll('.xAxis').selectAll('text').style('display', 'none');
        }
    }

    /**generateYAxis
     * creates y axis on the svg
     *
     * @params generateYAxis
     */
    generateYAxis(yAxisData) {
        var chart = this,
            yAxisScale = jvCharts.getAxisScale('y', yAxisData, chart.config.container, chart._vars),
            yAxisClass = 'yAxisLabels editable editable-yAxis editable-text',
            maxYAxisLabelWidth,
            numberOfTicks = Math.floor(chart.config.container.height / 14),
            yAxis,
            yContent,
            yAxisGroup,
            forceFormatTypeTo = null,
            ylabel = '';

        //assign css class for edit mode
        //if the axis is numbers add editable-num
        if (yAxisData.dataType === 'NUMBER') {
            yAxisClass += ' editable-num';
        }

        //Save y axis scale to chart object
        chart.currentData.yAxisScale = yAxisScale;

        //remove previous svg elements
        chart.svg.selectAll('.yAxisContainer').remove();
        chart.svg.selectAll('text.yLabel').remove();

        if (numberOfTicks > 10) {
            if (numberOfTicks < 20) {
                numberOfTicks = 10;
            } else if (numberOfTicks < 30) {
                numberOfTicks /= 2;
            } else {
                numberOfTicks = 15;
            }
        }

        //If all y-axis values are the same, only show a tick for that value. If value is 1, don't show any decimal places
        if (yAxisData.values.length > 0 && !!yAxisData.values.reduce(function (a, b) { return (a === b) ? a : NaN; })) {
            numberOfTicks = 1;
            if (yAxisData.values[0] === 1) {
                forceFormatTypeTo = 'nodecimals';
            }
        }
        yAxis = d3.axisLeft()
            .ticks(numberOfTicks)//Link to D3.svg.axis options: https://github.com/mbostock/d3/wiki/SVG-Axes
            .scale(yAxisScale)//Sets the scale to use in the axis
            .tickSize(5)//Sets the thickness of the axis line
            .tickPadding(5);

        //Hide Axis values if necessary
        if (yAxisData.hideValues) {
            yAxis.tickFormat('');
        }
        if (chart._vars.displayYAxisLabel) {
            ylabel = yAxisData.label
        }

        yContent = chart.svg.append('g')
            .attr('class', 'yAxisContainer');

        yContent.append('g')
            .attr('class', 'yLabel')
            .append('text')
            .attr('class', 'yLabel editable editable-text editable-content')
            .attr('text-anchor', 'start')
            .attr('font-size', chart._vars.fontSize)
            .attr('x', 0)
            .attr('y', 0)
            .attr('transform', 'translate(' + (-chart.config.margin.left + 10) + ', -10)')
            .text(ylabel)
            .attr('fill-opacity', 1);

        yAxisGroup = yContent.append('g')
            .attr('class', 'yAxis');


        yAxisGroup
            .call(yAxis);

        //Styling for Axis
        yAxisGroup.select('path')
            .attr('stroke', chart._vars.axisColor)
            .attr('stroke-width', chart._vars.strokeWidth);

        maxYAxisLabelWidth = 0;

        if (yAxisData.hideValues) {
            //Styling for ticks
            yAxisGroup.selectAll('line')
                .attr('stroke-width', 0);
        } else {
            //Styling for ticks
            yAxisGroup.selectAll('line')
                .attr('stroke', chart._vars.axisColor)
                .attr('stroke-width', chart._vars.stroke);
            //Styling for data labels on axis
            yAxisGroup.selectAll('text')
                .attr('fill', chart._vars.fontColor)//Customize the color of axis labels
                .attr('class', yAxisClass)
                .attr('transform', 'rotate(0)')//Add logic to rotate axis based on size of title
                .attr('font-size', chart._vars.fontSize)
                .append('svg:title');

            var formatValueType = jvFormatValueType(yAxisData.values);

            yAxisGroup.selectAll('text')
                .text(function (d) {
                    if (chart._vars.rotateAxis) {
                        return d;
                    }
                    var maxLength = 13;
                    var current = '';
                    if (d.length > maxLength) {
                        current = d.substring(0, maxLength) + '...';
                    } else {
                        current = d;
                    }

                    if (forceFormatTypeTo !== null) {
                        formatValueType = forceFormatTypeTo;
                    }
                    return jvFormatValue(current, formatValueType);
                })
                .each(function (d, i, j) {
                    if (j[0].getBBox().width > maxYAxisLabelWidth) {
                        maxYAxisLabelWidth = j[0].getBBox().width;
                    }
                });
            if (maxYAxisLabelWidth > 0) {
                chart._vars.yLabelWidth = Math.ceil(maxYAxisLabelWidth) + 20;
            }
        }
    }
    /************************************************ Legend functions ******************************************************/

    generateLegend(legendData, drawFunc) {
        var chart = this,
            svg = chart.svg;

        svg.selectAll('.legend').remove();

        //Returns the legend rectangles that are toggled on/off
        var legendElements = generateLegendElements(chart, legendData, drawFunc);
        if (drawFunc) {
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
        }

        if (chart._vars.thresholds !== 'none' && chart._vars.thesholdLegend === true) {
            if (chart.config.type === 'bar' || chart.config.type === 'area' || chart.config.type === 'line') {
                if (chart.config.container.height > 300 && chart.config.container.width > 300) {
                    generateThresholdLegend(chart);
                }
            }
        }

        if (!chart._vars.toggleLegend) {
            svg.selectAll('.legend').remove();
            svg.selectAll('.legend-carousel').remove();
        }
    }

    /**generateVerticalLegend
     *
     * creates and draws a vertical legend on the svg element
     * @params svg, legendData, options, container, chartData, xAxisData, yAxisData, chartType
     * @returns {{}}
     */
    generateVerticalLegend(paintFunc) {
        var chart = this,
            svg = chart.svg,
            legendData = chart.currentData.legendData;

        svg.selectAll('.legend').remove();

        //Returns the legend rectangles that are toggled on/off
        var legendElements = generateVerticalLegendElements(chart, legendData, paintFunc);
        if (paintFunc !== 'generatePack') {
            attachClickEventsToLegend(chart, legendElements, paintFunc, legendData);
        }

        if (!chart._vars.toggleLegend) {
            svg.selectAll('.legend').remove();
            svg.selectAll('.legend-carousel').remove();
        }
    }

    /**
     *
     * Generates a clip path that contains the contents of the chart area to the view of the chart area container
     * i.e - don't want bars going below the x axis
     */
    generateClipPath() {
        var chart = this,
            svg = chart.svg,
            type = chart.config.type;

        svg
            .append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', chart.config.container.width)
            .attr('height', chart.config.container.height);

        //Break this out into logic for all other vizzes that have overflow issues
        var containerName = '.' + type + '-container';
        svg
            .select(containerName)
            .attr('clip-path', 'url(#clip)');
    }

    setThreshold(data) {
        var chart = this,
            thresholds = chart._vars.thresholds,
            length = thresholds ? Object.keys(thresholds).length : 0;

        if (thresholds !== 'none') {
            for (var i = length - 1; i > -1; i--) {
                var threshold = thresholds[i];
                //console.log(typeof data == "date");
                if (data >= Number(threshold.threshold)) {
                    return 'rect-' + i;
                }
            }
        }
    }

    generateLineThreshold() {
        var chart = this,
            svg = chart.svg,
            width = chart.config.container.width,
            height = chart.config.container.height,
            thresholds = chart._vars.thresholds,
            length = Object.keys(chart._vars.thresholds).length;

        var x = chart.currentData.xAxisScale;
        var y = chart.currentData.yAxisScale;

        if (thresholds !== 'none') {
            for (var i = 0; i < length; i++) {
                var threshold = thresholds[i];
                if (chart._vars.rotateAxis) {
                    svg.append('line')
                        .style('stroke', threshold.thresholdColor)
                        .attr('x1', x(threshold.threshold))
                        .attr('y1', 0)
                        .attr('x2', x(threshold.threshold))
                        .attr('y2', height)
                        .attr('stroke-dasharray', ('3, 3'));
                } else {
                    svg.append('line')
                        .style('stroke', threshold.thresholdColor)
                        .attr('x1', 0)
                        .attr('y1', y(threshold.threshold))
                        .attr('x2', width)
                        .attr('y2', y(threshold.threshold))
                        .attr('stroke-dasharray', ('3, 3'));
                }
            }
        }
    }

    colorBackground(color) {
        var chart = this;
        var chartDiv = chart.chartDiv;
        chart._vars.backgroundColor = color;
        chartDiv.style('background-color', '' + color);
    }



    /**displayValues
     *
     * toggles data values that are displayed on the specific type of chart on the svg
     * @params svg, barData, options, xAxisData, yAxisData, container
     * @returns {{}}
     */
    displayValues() {
        //TODO receive data similar to generateBar
        var chart = this,
            svg = chart.svg,
            container = chart.config.container,
            barData = chart.data.chartData,
            xAxisData = chart.currentData.xAxisData,
            yAxisData = chart.currentData.yAxisData,
            legendOptions = chart._vars.legendOptions;

        //If series is flipped, use flipped data; initialize with the full data set
        if (chart._vars.seriesFlipped) {
            barData = chart.flippedData.chartData;
            legendOptions = chart._vars.flippedLegendOptions;
        }

        if (chart._vars.displayValues === true) {
            svg.selectAll('.displayValueContainer').remove();

            var data = [];//Only stores values for bars
            var barDataNew = JSON.parse(JSON.stringify(barData));//Copy of barData

            if (legendOptions) {//Checking which legend elements are toggled on resize
                for (var j = 0; j < barDataNew.length; j++) {
                    for (var i = 0; i < legendOptions.length; i++) {
                        if (legendOptions[i].toggle === false) {
                            delete barDataNew[j][legendOptions[i].element];
                        }
                    }
                }
            }

            for (var i = 0; i < barDataNew.length; i++) {//barDataNew used
                var val = values(barDataNew[i], chart.currentData.dataTable, chart.config.type);
                data.push(val.slice(0, barDataNew[i].length));
            }

            var posCalc = getPosCalculations(barDataNew, chart._vars, xAxisData, yAxisData, container, chart);

            var x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars);
            var y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars);

            //var format = getFormatExpression("displayValues");

            if (chart._vars.rotateAxis) {
                //Add a container for display values over each bar group
                var displayValuesGroup =
                    svg
                        .append('g')
                        .attr('class', 'displayValuesGroup')
                        .selectAll('g')
                        .data(data)
                        .enter()
                        .append('g')
                        .attr('class', 'displayValuesGroup')
                        .attr('transform', function (d, i) {
                            var translate = (y.paddingOuter() * y.step()) + (y.step() * i);
                            return 'translate(0,' + translate + ')';
                        });

                displayValuesGroup.selectAll('text')
                    .data(function (d) {
                        return d;
                    })
                    .enter()
                    .append('text')
                    .attr('class', 'displayValue')
                    .attr('x', function (d, i, j) { //sets the x position of the bar)
                        return posCalc.width(d, i, j) + posCalc.x(d, i, j);
                    })
                    .attr('y', function (d, i, j) { //sets the y position of the bar
                        return posCalc.y(d, i, j) + (posCalc.height(d, i, j) / 2);
                    })
                    .attr('dy', '.35em')
                    .attr('text-anchor', 'start')
                    .attr('fill', chart._vars.fontColor)
                    .text(function (d) {
                        var returnText = Math.round(d * 100) / 100;//round to 2 decimals
                        return jvFormatValue(returnText);
                    })
                    .attr('font-size', chart._vars.fontSize);
            } else {
                //Add a display values container over each bar group
                var displayValuesGroup = svg.append('g')
                    .attr('class', 'displayValuesGroup')
                    .selectAll('g')
                    .data(data)
                    .enter()
                    .append('g')
                    .attr('class', 'displayValuesGroup')
                    .attr('transform', function (d, i) {
                        var translate = (x.paddingOuter() * x.step()) + (x.step() * i);
                        return 'translate(' + translate + ',0)';
                    });
                var stackTotals = [];
                displayValuesGroup.selectAll('text')
                    .data(function (d, i, j) {
                        return d;
                    })
                    .enter()
                    .append('text')
                    .attr('class', 'displayValue')
                    .attr('x', function (d, i, j) { //sets the x position of the bar)
                        return Math.round((posCalc.x(d, i, j) + (posCalc.width(d, i, j) / 2)));
                    })
                    .attr('y', function (d, i, j) { //sets the y position of the bar
                        return Math.round(posCalc.y(d, i, j)) - 3;//+ posCalc.height(d, i, j) - 5);
                    })
                    .attr('text-anchor', 'middle')
                    .attr('fill', chart._vars.fontColor)
                    .text(function (d, i, j) {
                        if (chart._vars.stackToggle && chart._vars.displayValuesStackAsPercent) {
                            var total = 0;
                            for (let index = 0; index < j.length; index++) {
                                total += j[index].__data__;
                            }
                            if (chart._vars.displayValuesStackTotal && i === 0) {
                                //only enter this one time per stack
                                stackTotals.push(total);
                            }
                            return jvFormatValue(d / total, 'percent');
                        }

                        return jvFormatValue(d);
                    })
                    .attr('font-size', chart._vars.fontSize);

                if (chart._vars.stackToggle && chart._vars.displayValuesStackTotal) {
                    var stackCounter = 0;
                    svg.append('g')
                        .attr('class', 'displayStackTotal')
                        .selectAll('g')
                        .data(data)
                        .enter()
                        .append('g')
                        .attr('transform', function (d, i) {
                            var translate = (x.paddingOuter() * x.step()) + (x.step() * i);
                            return 'translate(' + translate + ',0)';
                        })
                        .selectAll('text')
                        .data(function (d, i, j) {
                            return d;
                        })
                        .enter()
                        .append('text')
                        .attr('x', function (d, i, j) { //sets the x position of the bar)
                            return Math.round((posCalc.x(d, i, j) + (posCalc.width(d, i, j) / 2)));
                        })
                        .attr('y', function (d, i, j) { //sets the y position of the bar
                            return Math.round(posCalc.y(d, i, j)) - 18;//+ posCalc.height(d, i, j) - 5);
                        })
                        .attr('text-anchor', 'middle')
                        .attr('fill', chart._vars.fontColor)
                        .text(function (d, i, j) {
                            let yLength = chart.currentData.yAxisData.values.length;
                            let xLength = chart.currentData.xAxisData.values.length;
                            let indexMax = yLength / xLength;
                            let stack = 0;
                            if ((i + 1) === indexMax) {
                                for (var j = 0; j < indexMax; j++) {
                                    stack += chart.currentData.yAxisData.values[indexMax * stackCounter + j];
                                }
                                stackCounter++;
                                return jvFormatValue(stack);
                            }
                            return '';
                        })
                        .attr('font-size', chart._vars.fontSize);
                }
            }
        } else {
            svg.selectAll('.displayValueContainer').remove();
        }
    }

    drawGridlines(axisData) {
        var chart = this;

        chart.svg.selectAll('g.gridLines').remove();
        chart.svg.append('g')
            .attr('class', 'gridLines');
        var scaleData;

        //Determine if gridlines are horizontal or vertical based on rotateAxis
        if (chart._vars.rotateAxis === true || chart.config.type === 'gantt' || chart.config.type === 'singleaxis') {
            var gridLineHeight = chart.config.container.height;
            var xAxisScale = jvCharts.getAxisScale('x', axisData, chart.config.container, chart._vars);

            if (axisData.dataType === 'STRING') {
                scaleData = axisData.values;
            } else if (axisData.dataType === 'NUMBER' || axisData.dataType === 'DATE') {
                scaleData = xAxisScale.ticks(10);
            }
            chart.svg.select('.gridLines').selectAll('.horizontalGrid').data(scaleData).enter()
                .append('line')
                .attr('class', 'horizontalGrid')
                .attr('x1', function (d, i) {
                    if (i > 0) {
                        return xAxisScale(d);
                    }
                    return 0;
                })
                .attr('x2', function (d, i) {
                    if (i > 0) {
                        return xAxisScale(d);
                    }
                    return 0;
                })
                .attr('y1', 0)
                .attr('y2', function (d, i) {
                    if (i > 0) {
                        return gridLineHeight;
                    }
                    return 0;
                })
                .attr('fill', 'none')
                .attr('shape-rendering', 'crispEdges')
                .attr('stroke', chart._vars.axisColor)
                .attr('stroke-width', chart._vars.gridLineStrokeWidth);
        } else {
            var gridLineWidth = chart.config.container.width;
            var yAxisScale = jvCharts.getAxisScale('y', axisData, chart.config.container, chart._vars);

            if (axisData.dataType === 'STRING') {
                scaleData = axisData.values;
            } else if (axisData.dataType === 'NUMBER' || axisData.dataType === 'DATE') {
                scaleData = yAxisScale.ticks(10);
            }
            chart.svg.select('.gridLines').selectAll('.horizontalGrid').data(scaleData).enter()
                .append('line')
                .attr('class', 'horizontalGrid')
                .attr('x1', 0)
                .attr('x2', function (d, i) {
                    if (i > 0) {
                        return gridLineWidth;
                    }
                    return 0;
                })
                .attr('y1', function (d, i) {
                    if (i > 0) {
                        return yAxisScale(d);
                    }
                    return 0;
                })
                .attr('y2', function (d, i) {
                    if (i > 0) {
                        return yAxisScale(d);
                    }
                    return 0;
                })
                .attr('fill', 'none')
                .attr('shape-rendering', 'crispEdges')
                .attr('stroke', chart._vars.axisColor)
                .attr('stroke-width', chart._vars.gridLineStrokeWidth);
        }
    }

    /**getBarDataFromOptions
    * ^^ not just a bar function, line and area also use it
    *
    * Assigns the correct chart data to current data using the chart.options
    */
    getBarDataFromOptions() {
        var chart = this;
        //creating these two data variables to avoid having to reference the chart obejct everytime
        var flipped = chart.flippedData;
        var data = chart.data;

        var dataObj = {};
        if (chart._vars.seriesFlipped) {
            dataObj.chartData = flipped.chartData;
            dataObj.legendData = flipped.legendData;
            dataObj.dataTable = flipped.dataTable;
            chart._vars.color = flipped.color;
            if (chart._vars.rotateAxis === true) {
                dataObj.xAxisData = flipped.yAxisData;
                dataObj.yAxisData = flipped.xAxisData;
            } else {
                dataObj.xAxisData = flipped.xAxisData;
                dataObj.yAxisData = flipped.yAxisData;
            }
        } else {
            dataObj.chartData = data.chartData;
            dataObj.legendData = data.legendData;
            dataObj.dataTable = data.dataTable;
            chart._vars.color = data.color;
            if (chart._vars.rotateAxis === true) {
                dataObj.xAxisData = data.yAxisData;
                dataObj.yAxisData = data.xAxisData;
            } else {
                dataObj.xAxisData = data.xAxisData;
                dataObj.yAxisData = data.yAxisData;
            }
        }

        return dataObj;
    }

    /************************************************ Utility functions ******************************************************/

    /**highlightItems
     *
     * highlights items on the svg element
     * @params items, svg
     * @returns {{}}
     */
    highlightItem(items, tag, highlightIndex, highlightUri) {
        var chart = this,
            svg = chart.svg;

        //TODO remove if statements
        if (highlightIndex >= 0) {
            if (chart.config.type === 'pie') {
                //set all circles stroke width to 0
                svg.select('.pie-container').selectAll(tag)
                    .attr('stroke', chart._vars.pieBorder)
                    .attr('stroke-width', 1);
                //highlight necessary pie slices
                svg.select('.pie-container')
                    .selectAll(tag)
                    .filter('.highlight-class-' + highlightIndex)
                    .attr('stroke', chart._vars.highlightBorderColor)
                    .attr('stroke-width', chart._vars.highlightBorderWidth);
            }
            if (chart.config.type === 'scatterplot') {
                //set all circles stroke width to 0
                svg.select('.scatter-container').selectAll(tag)
                    .attr('stroke-width', 0);
                //highlight necessary scatter dots
                svg.select('.scatter-container').selectAll(tag).filter('.scatter-circle-' + highlightIndex)
                    .attr('stroke', chart._vars.highlightBorderColor)
                    .attr('stroke-width', chart._vars.highlightBorderWidth);
            }
        } else if (highlightUri) {
            if (chart.config.type === 'bar') {
                //set all bars stroke width to 0
                svg.select('.bar-container').selectAll(tag)
                    .attr('stroke', 0)
                    .attr('stroke-width', 0);
                //highlight necessary bars
                svg.select('.bar-container').selectAll('.highlight-class-' + highlightUri)
                    .attr('stroke', chart._vars.highlightBorderColor)
                    .attr('stroke-width', chart._vars.highlightBorderWidth);
            }
            if (chart.config.type === 'line' || chart.config.type === 'area') {
                //set all circles stroke width to 0
                svg.select('.line-container').selectAll(tag)
                    .attr('stroke', 0)
                    .attr('stroke-width', 0);
                //highlight necessary cirlces
                svg.select('.line-container').selectAll(tag).filter('.highlight-class-' + highlightUri)
                    .attr('stroke', chart._vars.highlightBorderColor)
                    .attr('stroke-width', chart._vars.highlightBorderWidth);
            }
        } else {
            console.log('need to pass highlight index to highlight item');
        }
    }

    /**
    *@desc Removes highlights that were applied with related insights
    *
    */
    removeHighlight() {
        var chart = this;
        var svg = chart.svg;
        if (chart.config.type === 'pie') {
            //set all circles stroke width to 0
            svg.select('.pie-container').selectAll('path')
                .attr('stroke', chart._vars.pieBorder)
                .attr('stroke-width', 0);
        }
        if (chart.config.type === 'scatterplot') {
            svg.select('.scatter-container').selectAll('circle')
                .attr('stroke-width', 0);
        }
        if (chart.config.type === 'bar') {
            svg.select('.bar-container').selectAll('rect')
                .attr('stroke', 0)
                .attr('stroke-width', 0);
        }
        if (chart.config.type === 'line' || chart.config.type === 'area') {
            svg.select('.line-container').selectAll('circle')
                .attr('stroke', 0)
                .attr('stroke-width', 0);
        }
    }
}


function jvFormatValue(val, formatType) {
    if (!isNaN(val)) {
        var formatNumber = d3.format('.0f');

        if (formatType === 'billions') {
            return formatNumber(val / 1e9) + 'B';
        } else if (formatType === 'millions') {
            return formatNumber(val / 1e6) + 'M';
        } else if (formatType === 'thousands') {
            return formatNumber(val / 1e3) + 'K';
        } else if (formatType === 'decimals') {
            formatNumber = d3.format('.2f');
            return formatNumber(val);
        } else if (formatType === 'nodecimals') {
            return formatNumber(val);
        } else if (formatType === 'percent') {
            let p = Math.max(0, d3.precisionFixed(0.05) - 2);
            let expression = d3.format('.' + p + '%');
            return expression(val);
        } else if (formatType === '') {
            return val;
        }

        if (val === 0) {
            return 0;
        }

        if (Math.abs(val) >= 1000000000) {
            //Billions
            return formatNumber(val / 1e9) + 'B';
        } else if (Math.abs(val) >= 1000000) {
            //Millions
            return formatNumber(val / 1e6) + 'M';
        } else if (Math.abs(val) >= 1000) {
            //Thousands
            return formatNumber(val / 1e3) + 'K';
        } else if (Math.abs(val) <= 10) {
            //2 decimals
            formatNumber = d3.format('.2f');
        }
        return formatNumber(val);
    }
    return val;
}

/**
 * @param the set of values that you want to format uniformly
 * @return '' the level of formatting for the group of data
 * Problem with jvFormatValue function is that if you pass in values 10, 20... 90, 100, 1120, 120
 * you will get the formats 10.00, 20.00 .... 100, 110, 120 when you want 10, 20, ... 100, 110
 * --Format the value based off of the highest number in the group
 */
function jvFormatValueType(values, dataType) {
    if (values != null && dataType !== 'STRING') {
        var max = Math.max.apply(null, values);
        //After getting the max, check the min
        var min = Math.min.apply(null, values);
        var range = max - min;
        var incrememnt = Math.abs(Math.round(range / 10));//10 being the number of axis labels to show

        if (Math.abs(incrememnt) >= 1000000000) {
            return 'billions';
        } else if (Math.abs(incrememnt) >= 1000000) {
            return 'millions';
        } else if (Math.abs(incrememnt) >= 1000) {
            return 'thousands';
        } else if (Math.abs(incrememnt) <= 10) {
            return 'decimals';
        } else if (Math.abs(incrememnt) >= 10) {
            return 'nodecimals';
        }
    }
    return '';
}

/**getFormatExpression
 *
 * @desc returns the d3 format expression for a given option
 * @params option
 * @returns string expression
 */
function getFormatExpression(option) {
    var expression = '',
        p;
    if (option === 'currency') {
        expression = d3.format('$,');
    }
    if (option === 'fixedCurrency') {
        expression = d3.format('($.2f');
    }
    if (option === 'percent') {
        p = Math.max(0, d3.precisionFixed(0.05) - 2);
        expression = d3.format('.' + p + '%');
    }
    if (option === 'millions') {
        p = d3.precisionPrefix(1e5, 1.3e6);
        expression = d3.formatPrefix('.' + p, 1.3e6);
    }
    if (option === 'commas') {
        expression = d3.format(',.0f');
    }
    if (option === 'none' || option === '') {
        expression = d3.format('');
    }
    if (option === 'displayValues') {
        expression = d3.format(',.2f');
    }

    return expression;
}

/**getToggledData
 *
 * Gets the headers of the data to be drawn and filters the data based on that
 * @params chartData, dataHeaders
 */
function getToggledData(chartData, dataHeaders) {
    var legendElementToggleArray = getLegendElementToggleArray(dataHeaders, chartData.legendData);
    var data = JSON.parse(JSON.stringify(chartData.chartData));
    if (legendElementToggleArray) {
        for (var j = 0; j < data.length; j++) {
            for (var i = 0; i < legendElementToggleArray.length; i++) {
                if (legendElementToggleArray[i].toggle === false) {
                    delete data[j][legendElementToggleArray[i].element];
                }
            }
        }
    }
    return data;
}

/**getLegendElementToggleArray
 *
 * Gets an array of legend elements with true/false tags for if toggled
 * @params selectedHeaders, allHeaders
 */
function getLegendElementToggleArray(selectedHeaders, allHeaders) {
    var legendElementToggleArray = [];
    for (var i = 0; i < allHeaders.length; i++) {
        legendElementToggleArray.push({ element: allHeaders[i] });
    }

    for (var i = 0; i < legendElementToggleArray.length; i++) {
        for (var j = 0; j < selectedHeaders.length; j++) {
            if (legendElementToggleArray[i].element === selectedHeaders[j]) {
                legendElementToggleArray[i].toggle = true;
                continue;
            }
        }
        if (legendElementToggleArray[i].toggle !== true) {
            legendElementToggleArray[i].toggle = false;
        }
    }
    return legendElementToggleArray;
}

/**generateLegendElements
 *
 * Creates the legend elements--rectangles and labels
 * @params chart, legendData, drawFunc
 */
function generateLegendElements(chart, legendData, drawFunc) {
    var svg = chart.svg,
        container = chart.config.container,
        legend,
        legendRow = 0,
        legendColumn = 0,
        legendDataLength = legendData.length;

    if (!chart._vars.legendIndex) {
        chart._vars.legendIndex = 0;
    }

    if (!chart._vars.legendIndexMax) {
        chart._vars.legendIndexMax = Math.floor(legendDataLength / chart._vars.legendMax - 0.01);
    }

    //if legend headers don't exist, set them equal to legend data
    if (!chart._vars.legendHeaders && !chart._vars.seriesFlipped) {
        chart._vars.legendHeaders = JSON.parse(JSON.stringify(legendData));
    } else if (!chart._vars.flippedLegendHeaders && chart._vars.seriesFlipped) {
        chart._vars.flippedLegendHeaders = JSON.parse(JSON.stringify(legendData));
    }
    //Set legend element toggle array based on if series is flipped
    if (!chart._vars.seriesFlipped) {
        var legendElementToggleArray = getLegendElementToggleArray(chart._vars.legendHeaders, legendData);
    } else {
        var flippedLegendElementToggleArray = getLegendElementToggleArray(chart._vars.flippedLegendHeaders, legendData);
    }

    legend = svg.append('g')
        .attr('class', 'legend');

    //Adding colored rectangles to the legend
    var legendRectangles = legend.selectAll('rect')
        .data(legendData)
        .enter()
        .append('rect')
        .attr('class', 'legendRect')
        .attr('x', function (d, i) {
            if (i % (chart._vars.legendMax / 3) === 0 && i > 0) {
                legendColumn = 0;
            }
            var legendPos = 200 * legendColumn;
            legendColumn++;
            return legendPos;
        })
        .attr('y', function (d, i) {
            if (i % (chart._vars.legendMax / 3) === 0 && i > 0) {
                legendRow++;
            }
            if (i % chart._vars.legendMax === 0 && i > 0) {
                legendRow = 0;
            }
            return (container.height + 10) + (15 * (legendRow + 1)) - 5; //Increment row when column limit is reached
        })
        .attr('width', chart._vars.gridSize)
        .attr('height', chart._vars.gridSize)
        .attr('fill', function (d, i) {
            return getColors(chart._vars.color, i, legendData[i]);
        })
        .attr('display', function (d, i) {
            if (i >= (chart._vars.legendIndex * chart._vars.legendMax) && i <= ((chart._vars.legendIndex * chart._vars.legendMax) + (chart._vars.legendMax - 1))) {
                return 'all';
            }
            return 'none';
        })
        .attr('opacity', function (d, i) {
            if ((!legendElementToggleArray && !chart._vars.seriesFlipped) || (chart._vars.seriesFlipped && !flippedLegendElementToggleArray)) {
                return '1';
            }
            if ((!chart._vars.seriesFlipped && legendElementToggleArray[i].toggle === true) ||
                (chart._vars.seriesFlipped && flippedLegendElementToggleArray[i].toggle === true)) {
                return '1';
            }
            return '0.2';
        });

    legendRow = 0;
    legendColumn = 0;

    //Adding text labels for each rectangle in legend
    var legendText = legend.selectAll('text')
        .data(legendData)
        .enter()
        .append('text')
        .attr('class', function (d, i) {
            return 'legendText editable editable-text editable-content editable-legend-' + i;
        })
        .attr('x', function (d, i) {
            if (i % (chart._vars.legendMax / 3) === 0 && i > 0) {
                legendColumn = 0;
            }
            var legendPos = 200 * legendColumn;
            legendColumn++;
            return legendPos + 17;
        })
        .attr('y', function (d, i) {
            if (i % (chart._vars.legendMax / 3) === 0 && i > 0) {
                legendRow++;
            }
            if (i % chart._vars.legendMax === 0 && i > 0) {
                legendRow = 0;
            }
            return (container.height + 10) + (15 * (legendRow + 1)); //Increment row when column limit is reached
        })
        .attr('text-anchor', 'start')
        .attr('dy', '0.35em') //Vertically align with node
        .attr('fill', chart._vars.fontColor)
        .attr('font-size', chart._vars.fontSize)
        .attr('display', function (d, i) {
            if (i >= (chart._vars.legendIndex * chart._vars.legendMax) && i <= ((chart._vars.legendIndex * chart._vars.legendMax) + (chart._vars.legendMax - 1))) {
                return 'all';
            }
            return 'none';
        })
        .text(function (d, i) {
            var elementName = legendData[i];
            if (chart.config.type === 'gantt') {
                elementName = legendData[i].slice(0, -5);//Removing last 5 characters of legend label---i.e plannedSTART -> planned
            }
            if (elementName.length > 20) {
                return elementName.substring(0, 19) + '...';
            }
            return elementName;
        });

    //Adding info box to legend elements when hovering over
    legendText
        .data(legendData)
        .append('svg:title')
        .text(function (d) {
            return d;
        });

    //Only create carousel if the number of elements exceeds one legend "page"
    if (chart._vars.legendIndexMax > 0) {
        createCarousel(chart, legendData, drawFunc);
    }
    //Centers the legend in the panel
    if (legend) {
        var legendWidth = legend.node().getBBox().width;
        legend.attr('transform', 'translate(' + ((container.width - legendWidth) / 2) + ', 30)');
    }

    return legendRectangles;
}

/**updateDataFromLegend
 *
 * Returns a list of data headers that should be displayed in viz
 * based off what is toggled on/off in legend
 * @params legendData
 */
function updateDataFromLegend(legendData) {
    var data = [];
    var legendElement = legendData[0];
    for (var i = 0; i < legendElement.length; i++) {
        if (legendElement[i].attributes.opacity.value !== '0.2') {
            //If not white, add it to the updated data array
            data.push(legendElement[i].__data__);
        }
    }
    return data;
}

/**createCarousel
 *
 * Draws the horizontal legend carousel
 * @params chart, legendData, drawFunc
 */
function createCarousel(chart, legendData, drawFunc) {
    var svg = chart.svg,
        container = chart.config.container,
        legendPolygon;

    //Adding carousel to legend
    svg.selectAll('.legend-carousel').remove();
    svg.selectAll('#legend-text-index').remove();

    legendPolygon = svg.append('g')
        .attr('class', 'legend-carousel');

    //Creates left navigation arrow for carousel
    legendPolygon.append('polygon')
        .attr('id', 'leftChevron')
        .attr('class', 'pointer-cursor')
        .style('fill', chart._vars.legendArrowColor)
        .attr('transform', 'translate(0,0)')
        .attr('points', '0,7.5, 15,0, 15,15')
        .on('click', function () {
            if (chart._vars.legendIndex >= 1) {
                chart._vars.legendIndex--;
            }
            svg.selectAll('.legend').remove();
            var legendElements = generateLegendElements(chart, legendData, drawFunc);
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
        })
        .attr({
            display: function () {
                if (chart._vars.legendIndex === 0) {
                    return 'none';
                }
                return 'all';
            }
        });

    //Creates page number for carousel navigation
    legendPolygon.append('text')
        .attr('id', 'legend-text-index')
        .attr('x', 35)
        .attr('y', 12.5)
        .style('text-anchor', 'start')
        .style('font-size', chart._vars.fontSize)
        .text(function () {
            return (chart._vars.legendIndex + 1) + ' / ' + (chart._vars.legendIndexMax + 1);
        })
        .attr({
            display: function () {
                if (chart._vars.legendIndexMax === 0) {
                    return 'none';
                }
                return 'all';
            }
        });

    //Creates right navigation arrow for carousel
    legendPolygon.append('polygon')
        .attr('id', 'rightChevron')
        .attr('class', 'pointer-cursor')
        .style('fill', chart._vars.legendArrowColor)
        .attr('transform', 'translate(85,0)')
        .attr('points', '15,7.5, 0,0, 0,15')
        .on('click', function () {
            if (chart._vars.legendIndex < chart._vars.legendIndexMax) {
                chart._vars.legendIndex++;
            }
            svg.selectAll('.legend').remove();
            var legendElements = generateLegendElements(chart, legendData, drawFunc);
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
        })
        .attr({
            display: function () {
                if (chart._vars.legendIndex === chart._vars.legendIndexMax) {
                    return 'none';
                }
                return 'all';
            }
        });

    //Centers the legend polygons in the panel
    if (legendPolygon) {
        var legendPolygonWidth = legendPolygon.node().getBBox().width;
        legendPolygon.attr('transform', 'translate(' + ((container.width - legendPolygonWidth) / 2) + ',' + (container.height + 105) + ')');
    }
}


/**getPlotData
 *
 * Returns only data values to be plotted; input is the data object
 * @params objectData, chart
 */
function getPlotData(objectData, chart) {
    var data = [];
    var objDataNew = JSON.parse(JSON.stringify(objectData));//Copy of barData
    for (var i = 0; i < objDataNew.length; i++) {
        var group = [];
        for (var j = 0; j < chart.currentData.legendData.length; j++) {
            if (typeof objDataNew[i][chart.currentData.legendData[j]] !== 'undefined') {
                group.push(objDataNew[i][chart.currentData.legendData[j]]);
            }
        }
        data.push(group);
    }
    return data;
}

/**getPosCalculations
 *Holds the logic for positioning all bars on a bar chart (depends on toolData)
 *
 * @params svg, barData, options, xAxisData, yAxisData, container
 * @returns {{}}
 */
function getPosCalculations(barData, _vars, xAxisData, yAxisData, container, chart) {
    var x = jvCharts.getAxisScale('x', xAxisData, container, _vars),
        y = jvCharts.getAxisScale('y', yAxisData, container, _vars),
        scaleFactor = 1,
        data = [],
        size = 0,
        positionFunctions = {};

    for (let item in chart.currentData.dataTable) {
        if (item !== 'label' && item.indexOf('tooltip') === -1) {
            size++;
        }
    }

    for (var i = 0; i < barData.length; i++) {
        var val = [];
        for (var key in barData[i]) {
            if (barData[i].hasOwnProperty(key)) {
                val.push(barData[i][key]);
            }
        }
        data.push(val.slice(1, barData[i].length));
    }

    if (_vars.rotateAxis === true && _vars.stackToggle === true) {
        positionFunctions.startx = function () {
            return 0;
        };
        positionFunctions.starty = function () {
            return 0;
        };
        positionFunctions.startwidth = function () {
            return 0;
        };
        positionFunctions.startheight = function () {
            return y.bandwidth() * 0.95;
        };
        positionFunctions.x = function (d, i, j) {
            var increment = 0;//Move the x up by the values that come before it
            for (var k = i - 1; k >= 0; k--) {
                if (!isNaN(j[k].__data__)) {
                    increment += j[k].__data__;
                }
            }
            return x(increment) === 0 ? 1 : x(increment);
        };
        positionFunctions.y = function () {
            return 0;
        };
        positionFunctions.width = function (d) {
            return Math.abs(x(0) - x(d));
        };
        positionFunctions.height = function () {
            return y.bandwidth() * 0.95;
        };
    } else if (_vars.rotateAxis === true && _vars.stackToggle === false) {
        positionFunctions.startx = function () {
            return 0;
        };
        positionFunctions.starty = function (d, i) {
            return y.bandwidth() / size * i;
        };
        positionFunctions.startwidth = function () {
            return 0;
        };
        positionFunctions.startheight = function (d) {
            return (y.bandwidth() / size * 0.95) * scaleFactor;
        };
        positionFunctions.x = function (d) {
            return x(0) - x(d) > 0 ? x(d) : x(0);
        };
        positionFunctions.y = function (d, i) {
            return y.bandwidth() / size * i;
        };
        positionFunctions.width = function (d) {
            return Math.abs(x(0) - x(d));
        };
        positionFunctions.height = function () {
            return (y.bandwidth() / size * 0.95) * scaleFactor;
        };
    } else if (_vars.rotateAxis === false && _vars.stackToggle === true) {
        positionFunctions.startx = function () {
            return 0;
        };
        positionFunctions.starty = function () {
            return container.height;
        };
        positionFunctions.startwidth = function () {
            return (x.bandwidth() * 0.95) * scaleFactor;
        };
        positionFunctions.startheight = function () {
            return 0;
        };
        positionFunctions.x = function () {
            return 0;
        };
        positionFunctions.y = function (d, i, j) {
            var increment = 0;//Move the y up by the values that come before it
            for (var k = i - 1; k >= 0; k--) {
                if (!isNaN(j[k].__data__)) {
                    increment += j[k].__data__;
                }
            }
            return y(parseFloat(d) + increment);
        };
        positionFunctions.width = function () {
            return (x.bandwidth() * 0.95) * scaleFactor;
        };
        positionFunctions.height = function (d) {
            return container.height - y(d);
        };
    } else if (_vars.rotateAxis === false && _vars.stackToggle === false) {
        positionFunctions.startx = function (d, i) {
            return x.bandwidth() / size * i;
        };
        positionFunctions.starty = function () {
            return container.height;
        };
        positionFunctions.startwidth = function () {
            return (x.bandwidth() / size * 0.95);
        };
        positionFunctions.startheight = function () {
            return 0;
        };
        positionFunctions.x = function (d, i) {
            return x.bandwidth() / size * i;
        };
        positionFunctions.y = function (d) {
            return y(0) - y(d) > 0 ? y(d) : y(0);
        };
        positionFunctions.width = function () {
            return (x.bandwidth() / size * 0.95);
        };
        positionFunctions.height = function (d) {
            return Math.abs(y(0) - y(d));
        };
    }
    return positionFunctions;
}

/**getColors
 *
 * gets the colors to apply to the specific chart
 * @params colorObj, index, label
 * @returns {{}}
 */
function getColors(colorObj, paramIndex, label) {
    var index = paramIndex;

    //logic to return the color if the colorObj passed in
    //is an object with the label being the key
    if (typeof label !== 'undefined' && colorObj.hasOwnProperty(label) && colorObj[label]) {
        return colorObj[label];
    }

    var cleanedColors = [];

    if (!Array.isArray(colorObj)) {
        cleanedColors = [];
        for (var k in colorObj) {
            if (colorObj.hasOwnProperty(k)) {
                if (colorObj[k]) {
                    cleanedColors.push(colorObj[k]);
                }
            }
        }
    } else {
        cleanedColors = colorObj;
    }

    //logic to return a repeating set of colors assuming that
    //the user changed data (ex: flip series on bar chart)
    if (!cleanedColors[index]) {
        while (index > cleanedColors.length - 1) {
            index = index - cleanedColors.length;
        }
    }
    return cleanedColors[index];
}


function getAxisScale(whichAxis, axisData, container, _vars, paddingType) {
    var leftPadding = 0.4,
        rightPadding = 0.2;
    if (paddingType === 'no-padding') {
        leftPadding = 0;
        rightPadding = 0;
    }
    var axisScale,
        axis;

    whichAxis === 'x' ? axis = container.width : axis = container.height;

    if (axisData.dataType === 'DATE') {
        for (var i = 0; i < axisData.values.length; i++) {
            axisData.values[i] = new Date(axisData.values[i]);
        }

        var maxDate = Math.max.apply(null, axisData.values);
        var minDate = Math.min.apply(null, axisData.values);

        axisScale = d3.scaleTime().domain([new Date(minDate), new Date(maxDate)]).rangeRound([0, axis]);
    } else if (axisData.dataType === 'STRING') {
        axisScale = d3.scaleBand()
            .domain(axisData.values)
            .range([0, axis])
            .paddingInner(leftPadding)
            .paddingOuter(rightPadding);
    } else if (axisData.dataType === 'NUMBER') {
        var domain;
        if (_vars.xReversed || _vars.yReversed) {
            if ((_vars.xReversed && whichAxis === 'x') || (whichAxis === 'y' && !_vars.yReversed)) {
                domain = [axisData.max, axisData.min];
            }
            if ((_vars.yReversed && whichAxis === 'y') || (whichAxis === 'x' && !_vars.xReversed)) {
                domain = [axisData.min, axisData.max];
            }
        } else {
            whichAxis === 'x' ? domain = [axisData.min, axisData.max] : domain = [axisData.max, axisData.min];
        }

        if (_vars.hasOwnProperty('axisType') && _vars.axisType === 'Logarithmic') {
            domain[1] = 0.1;
            axisScale = d3.scaleLog().base(10).domain(domain).rangeRound([0, axis]);
        } else {
            axisScale = d3.scaleLinear().domain(domain).rangeRound([0, axis]);
        }
    } else {
        console.error('Axis is not a valid data type');
        // throw new Error('Axis is not a valid data type');
    }
    return axisScale;
}

/**getXScale
 *
 * get the scale for the x axis
 * @params xAxisData, container, padding
 * @returns {{}}
 */
function getXScale(xAxisData, container, padding) {
    var xAxisScale;
    var leftPadding = 0.4,
        rightPadding = 0.2;
    if (padding === 'no-padding') {
        leftPadding = 0;
        rightPadding = 0;
    }

    //check if values length is greater than two incase the labels are all numbers. if it is a linear scale then there will only be a min and max
    if (xAxisData.dataType === 'DATE') {
        for (var i = 0; i < xAxisData.values.length; i++) {
            xAxisData.values[i] = new Date(xAxisData.values[i]);
        }

        var maxDate = Math.max.apply(null, xAxisData.values);
        var minDate = Math.min.apply(null, xAxisData.values);

        xAxisScale = d3.time.scale().domain([new Date(minDate), new Date(maxDate)]).rangeRound([0, container.width]);
    } else if (xAxisData.dataType === 'STRING' || xAxisData.values.length > 2) {
        xAxisScale = d3.scaleBand()
            .domain(xAxisData.values)
            .range([0, container.width])
            .paddingInner(leftPadding)
            .paddingOuter(rightPadding);
    } else if (xAxisData.dataType === 'NUMBER') {
        var max = xAxisData.values[(xAxisData.values.length - 1)];
        var min = xAxisData.values[0];

        xAxisScale = d3.scaleBand().domain([min, max]).rangeRound([0, container.width]);
    }
    return xAxisScale;
}

/**getYScale
 *
 * gets the scale for the y axis
 * @params yAxisData, container, padding
 * @returns {{}}
 */
function getYScale(yAxisData, container) {
    var yAxisScale;

    if (yAxisData.dataType === 'STRING') {
        yAxisScale = d3.scaleOrdinal().domain(yAxisData.values).range([0, container.height]);
    } else if (yAxisData.dataType === 'NUMBER') {
        var max = yAxisData.values[(yAxisData.values.length - 1)];
        var min = yAxisData.values[0];
        yAxisScale = d3.scaleLinear().domain([max, min]).rangeRound([0, container.height]);
    }
    return yAxisScale;
}


/************************************************ Data functions ******************************************************/

/**
 * @function
 * @param {string} label - The field that is checked for type
 * @param {Object} dataTableKeys - Object that contains the data type for each column of data
 */
function getDataTypeFromKeys(label, dataTableKeys) {
    var type;

    for (var i = 0; i < dataTableKeys.length; i++) {
        //Replace underscores with spaces
        if (dataTableKeys[i].varKey.replace(/_/g, ' ') === label.replace(/_/g, ' ')) {
            if (dataTableKeys[i].hasOwnProperty('type')) {
                type = dataTableKeys[i].type;
                if (type === 'STRING') {
                    type = 'STRING';
                } else if (type === 'DATE') {
                    type = 'DATE';
                } else if (type === 'NUMBER') {
                    type = 'NUMBER';
                } else {
                    type = 'NUMBER';
                }
                break;
            }
        }
    }
    return type;
}

/**setBarLineLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setBarLineLegendData(data) {
    var legendArray = [];
    for (var item in data.dataTable) {
        if (data.dataTable.hasOwnProperty(item)) {
            if (item !== 'label') {
                legendArray.push(data.dataTable[item]);
            }
        }
    }
    return legendArray;
}

/**setChartColors
 *  cleans incoming colors for consistency
 *
 * @params colorArray, legendData
 * @returns object with colors
 */

function setChartColors(toolData, legendData, defaultColorArray) {
    //function handles 3 color inputs
    //toolData as an array in toolData
    //toolData as an object
    //toolData as 'none'
    //any other case will result in using defaultColorArray

    var colors = {},
        usedColors = [],
        unaccountedLegendElements = [];

    //toolData is array
    if (Array.isArray(toolData)) {
        if (toolData.length > 0) {
            colors = createColorsWithDefault(legendData, toolData);
        } else {
            colors = createColorsWithDefault(legendData, defaultColorArray);
        }
    } else if (toolData === Object(toolData)) {
        for (var i = 0; i < legendData.length; i++) {
            var obj = legendData[i];
            if (toolData.hasOwnProperty(obj)) {
                usedColors.push(toolData[obj]);
            } else {
                unaccountedLegendElements.push(legendData[i]);
            }
        }
        //check if object has desired keys
        if (usedColors.length === legendData.length) {
            colors = toolData;
        } else if (usedColors.length > 0) {
            var toolDataAsArray = Object.values(toolData);
            if (toolDataAsArray.length > legendData.length) {
                colors = createColorsWithDefault(legendData, toolDataAsArray);
            } else {
                colors = createColorsWithDefault(legendData, defaultColorArray);
            }
        } else {
            var toolDataAsArray = Object.values(toolData);
            if (toolDataAsArray.length > legendData.length) {
                colors = createColorsWithDefault(legendData, toolDataAsArray);
            } else {
                colors = createColorsWithDefault(legendData, defaultColorArray);
            }
        }
    } else {
        colors = createColorsWithDefault(legendData, defaultColorArray);
    }

    return colors;
}

function createColorsWithDefault(legendData, colors) {
    var mappedColors = {},
        count = 0;
    for (var i = 0; i < legendData.length; i++) {
        if (count > colors.length - 1) {
            count = 0;
        }
        mappedColors[legendData[i]] = colors[count];
        count++;
    }
    return mappedColors;
}

/**cleanToolData
 *  cleans incoming toolData for consistency
 *
 * @param toolData
 * @returns object with tooldata
 */
function cleanToolData(options, editOptions) {
    var data = {}
    if (options) {
        data = options;
    }
    if (!data.hasOwnProperty('rotateAxis')) {
        data.rotateAxis = false;
    }
    if (data.hasOwnProperty('stackToggle')) {
        if (data.stackToggle === 'stack-data' || data.stackToggle === true) {
            data.stackToggle = true;
        } else {
            data.stackToggle = false;
        }
    } else {
        data.stackToggle = false;
    }
    if (data.hasOwnProperty('colors')) {
        data.color = data.colors;
    }
    if (!data.hasOwnProperty('thresholds')) {
        data.thresholds = [];
    }

    //These are used in setting dynamic margins on the y Axis in jvCharts
    if (editOptions.hasOwnProperty('yAxis') && editOptions.yAxis.hasOwnProperty('editable-text-size')) {
        data.yLabelFontSize = editOptions.yAxis['editable-text-size'];
        data.yLabelFormat = editOptions.yAxis['editable-num-format'];
    }
    return data;
}

function getMaxWidthForAxisData(axis, axisData, _vars, dimensions, margin, chartDiv, type) {
    var maxAxisText = '',
        formatType;
    //Dynamic left margin for charts with y axis
    if (_vars.rotateAxis) {
        //get length of longest text label and make the axis based off that
        var maxString = '',
            height = parseInt(dimensions.height) - margin.top - margin.bottom;

        //check if labels should be shown
        if (height !== 0 && height / axisData.values.length < parseInt(_vars.fontSize)) {
            axisData.hideValues = true;
        } else {
            for (var i = 0; i < axisData.values.length; i++) {
                var currentStr = axisData.values[i].toString();
                if (currentStr.length > maxString.length) {
                    maxString = currentStr;
                }
            }
            maxAxisText = maxString;
        }
    } else if (!!_vars.yLabelFormat || !!_vars.xLabelFormat) {
        var labelFormat = _vars.yLabelFormat;
        if (axis === 'x') {
            labelFormat = _vars.xLabelFormat;
        }

        formatType = jvFormatValueType(axisData.values);
        var expression = getFormatExpression(labelFormat);
        if (expression !== '') {
            maxAxisText = expression(axisData.max);
        } else {
            maxAxisText = jvFormatValue(axisData.max);
        }
    } else {
        formatType = jvFormatValueType(axisData.values);
        if (!axisData.hasOwnProperty('max')) {
            var maxLength = 0;
            for (var i = 0; i < axisData.values.length; i++) {
                if (axisData.values[i] && axisData.values[i].length > maxLength) {
                    maxLength = axisData.values[i].length;
                    maxAxisText = axisData.values[i];
                }
            }
        } else {
            maxAxisText = jvFormatValue(axisData.max, formatType);
        }
    }

    // if (type === 'heatmap') {
    //     //also need to check width of label
    //     if (maxAxisText.length < axisData.label.length + 5) {
    //         //need added space
    //         if (axis === 'x') {
    //             maxAxisText = axisData.label;
    //         } else {
    //             maxAxisText = axisData.label + 'Extra';
    //         }
    //     }
    // }

    //Create dummy svg to place max sized text element on
    var dummySVG = chartDiv.append('svg').attr('class', 'dummy-svg');

    //Create dummy text element
    var axisDummy = dummySVG
        .append('text')
        .attr('font-size', function () {
            if (axis === 'y' && _vars.yLabelFontSize !== 'none') {
                return _vars.yLabelFontSize;
            }
            if (axis === 'x' && _vars.xLabelFontSize !== 'none') {
                return _vars.xLabelFontSize;
            }
            return _vars.fontSize;
        })
        .attr('x', 0)
        .attr('y', 0)
        .text(maxAxisText);

    //Calculate the width of the dummy text
    var width = axisDummy.node().getBBox().width;
    //Remove the svg and text element
    chartDiv.select('.dummy-svg').remove();
    return width;
}

function values(object, dataTableAlign, type) {
    var valuesArray = [];

    if (type === 'bar' || type === 'pie' || type === 'line' || type === 'area') {
        //for (var key in object) {
        for (var i = 1; i < _.keys(dataTableAlign).length; i++) {
            if (dataTableAlign.hasOwnProperty('value ' + i)) {
                if (object[dataTableAlign['value ' + i]] != null) {//!= checks for null
                    valuesArray.push(object[dataTableAlign['value ' + i]]);
                }
            }
        }
    } else {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                valuesArray.push(object[key]);
            }
        }
    }
    return valuesArray;
}
/**getYScale
 *
 * gets the scale for the y axis
 * @params yAxisData, container, padding
 * @returns {{}}
 */
function getYScale(yAxisData, container, padding, yReversed) {
    var yAxisScale;
    var leftPadding = 0.4,
        rightPadding = 0.2;
    if (padding === 'no-padding') {
        leftPadding = 0;
        rightPadding = 0;
    }

    if (yAxisData.dataType === 'STRING') {
        yAxisScale = d3.scale.ordinal().domain(yAxisData.values).rangePoints([0, container.height])
            .rangeRoundBands([0, container.height], leftPadding, rightPadding);
    } else if (yAxisData.dataType === 'NUMBER') {
        var max = yAxisData.values[(yAxisData.values.length - 1)];
        var min = yAxisData.values[0];
        if (yReversed) {
            yAxisScale = d3.scaleLinear().domain([max, min]).rangeRound([container.height, 0]);
        } else {
            yAxisScale = d3.scaleLinear().domain([max, min]).rangeRound([0, container.height]);
        }
    }
    return yAxisScale;
}
/**getZScale
 *
 * gets the scale for the z axis
 * @params zAxisData, container, padding
 * @returns {{}}
 */
function getZScale(zAxisData, container, _vars) {
    var zAxisScale;

    zAxisScale = d3.scaleLinear().domain([d3.min(zAxisData.values), d3.max(zAxisData.values)]).rangeRound([_vars.NODE_MIN_SIZE, _vars.NODE_MAX_SIZE]).nice();
    return zAxisScale;
}

/**generateEventGroups
 *
 *
 * @params chartContainer, barData, chart
 */
function generateEventGroups(chartContainer, barData, chart) {
    var container = chart.config.container,
        dataToPlot = jvCharts.getPlotData(barData, chart),
        eventGroups;

    //Invisible rectangles on screen that represent bar groups. Used to show/hide tool tips on hover
    eventGroups = chartContainer
        .data(dataToPlot)
        .enter()
        .append('rect')
        .attr('class', 'event-rect')
        .attr('x', function (d, i) { //sets the x position of the bar)
            return (chart._vars.rotateAxis ? 0 : (container.width / barData.length * i));
        })
        .attr('y', function (d, i) { //sets the y position of the bar
            return chart._vars.rotateAxis ? (container.height / barData.length * i) : 0;
        })
        .attr('width', function () { //sets the x position of the bar)
            return (chart._vars.rotateAxis ? container.width : (container.width / barData.length));
        })
        .attr('height', function () { //sets the y position of the bar
            return chart._vars.rotateAxis ? (container.height / barData.length) : container.height;
        })
        .attr('fill', 'transparent')
        .attr('class', function (d, i) {
            return 'event-rect editable-bar bar-col-' + String(barData[i][chart.currentData.dataTable.label]).replace(/\s/g, '_').replace(/\./g, '_dot_');
        });

    return eventGroups;
}

function generateThresholdLegend(chart) {
    var svg = chart.svg;

    var colorLegendData = [];
    if (chart._vars.thresholds !== 'none') {
        for (var j = 0; j < Object.keys(chart._vars.thresholds).length; j++) {
            colorLegendData.push(chart._vars.thresholds[j].thresholdName);
        }
    }

    var gLegend = svg.append('g')
        .attr('class', 'thresholdLegendContainer');

    var legend = gLegend.selectAll('.thresholdLegend')
        .data(colorLegendData)
        .enter()
        .append('g')
        .attr('class', 'thresholdLegend')
        .attr('transform', function (d, i) {
            var height = 19;
            var offset = 19 * colorLegendData.length / 2;
            var horz = -2 * 12;
            var vert = i * height - offset;
            return 'translate(' + horz + ',' + vert + ')';
        });

    legend.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .style('fill', function (d, i) {
            return chart._vars.thresholds[i].thresholdColor;
        });

    legend.append('text')
        .attr('x', 24)
        .attr('y', 8)
        .attr('font-size', '.75em')
        .text(function (d) { return d; });

    //Centers the legend in the panel
    if (gLegend) {
        var legendWidth = gLegend.node().getBBox().width;
        gLegend.attr('transform', 'translate(' + (chart.config.container.width - legendWidth) + ',' + (10 * colorLegendData.length) + ')');
    }
}

function attachClickEventsToLegend(chart, legendElements, drawFunc) {
    //Adding the click event to legend rectangles for toggling on/off
    legendElements
        .on('click', function () {
            var selectedRect = d3.select(this);
            if (selectedRect._groups[0][0].attributes.opacity.value !== '0.2') {
                selectedRect
                    .attr('opacity', '0.2');
            } else {
                selectedRect
                    .attr('opacity', '1');
            }

            //Gets the headers of the data to be drawn
            var dataHeaders = updateDataFromLegend(legendElements._groups);
            //Sets the legendData to the updated headers
            if (chart._vars.seriesFlipped) {
                chart._vars.flippedLegendHeaders = dataHeaders;
            } else {
                chart._vars.legendHeaders = dataHeaders;
            }

            //Plots the data
            chart._vars.transitionTime = 800;//Keep transition for toggling legend elements
            if (chart._vars.seriesFlipped) {
                chart[drawFunc](chart.flippedData);
            } else {
                chart[drawFunc](chart.data);
            }
            if (chart.applyEditMode) {
                chart.applyEditMode();
            }
        });
}

/**generateVerticalLegendElements
 *
 * Creates the legend elements--rectangles and labels
 * @params chart, legendData, drawFunc
 */
function generateVerticalLegendElements(chart, legendData, drawFunc) {
    var svg = chart.svg,
        legend,
        legendDataLength = legendData.length,
        legendElementToggleArray;

    chart._vars.gridSize = 20;

    if (!chart._vars.legendIndex) {
        chart._vars.legendIndex = 0;
    }

    if (!chart._vars.legendIndexMax) {
        chart._vars.legendIndexMax = Math.floor(legendDataLength / chart._vars.legendMax - 0.01);
    }

    //Check to see if legend element toggle array needs to be set
    if (chart._vars.legendIndexMax >= 0) {
        if (!chart._vars.legendHeaders) {
            chart._vars.legendHeaders = JSON.parse(JSON.stringify(legendData));
        }

        legendElementToggleArray = getLegendElementToggleArray(chart._vars.legendHeaders, legendData);
    }

    legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(' + 18 + ',' + 20 + ')');

    //Adding colored rectangles to the legend
    var legendRectangles = legend.selectAll('rect')
        .data(legendData)
        .enter()
        .append('rect')
        .attr('class', 'legendRect')
        .attr('x', '3')
        .attr('y', function (d, i) {
            return (chart._vars.gridSize) * (i % chart._vars.legendMax) * 1.1;
        })
        .attr('width', chart._vars.gridSize)
        .attr('height', chart._vars.gridSize)
        .attr('fill', function (d, i) {
            if ((!legendElementToggleArray && !chart._vars.seriesFlipped) || (chart._vars.seriesFlipped && !legendElementToggleArray)) {
                return getColors(chart._vars.color, i, legendData[i]);
            }
            if ((!chart._vars.seriesFlipped && legendElementToggleArray[i].toggle === true) ||
                (chart._vars.seriesFlipped && legendElementToggleArray[i].toggle === true)) {
                return getColors(chart._vars.color, i, legendData[i]);
            }
            return chart._vars.emptyLegendSquare;
        })
        .attr('display', function (d, i) {
            if (i >= (chart._vars.legendIndex * chart._vars.legendMax) && i <= ((chart._vars.legendIndex * chart._vars.legendMax) + (chart._vars.legendMax - 1))) {
                return 'all';
            }
            return 'none';
        })
        .attr('opacity', '1');

    //Adding text labels for each rectangle in legend
    var legendText = legend.selectAll('text')
        .data(legendData)
        .enter()
        .append('text')
        .attr('class', function (d, i) {
            return 'legendText editable editable-text editable-content editable-legend-' + i;
        })
        .attr('x', chart._vars.gridSize + 7)
        .attr('y', function (d, i) {
            return (chart._vars.gridSize) * (i % chart._vars.legendMax) * 1.1 + 10;
        })
        .attr('text-anchor', 'start')
        .attr('dy', '0.35em') //Vertically align with node
        .attr('fill', chart._vars.fontColor)
        .attr('font-size', chart._vars.fontSize)
        .attr('display', function (d, i) {
            if (i >= (chart._vars.legendIndex * chart._vars.legendMax) && i <= ((chart._vars.legendIndex * chart._vars.legendMax) + (chart._vars.legendMax - 1))) {
                return 'all';
            }
            return 'none';
        })
        .text(function (d, i) {
            var elementName = legendData[i];
            if (elementName.length > 20) {
                return elementName.substring(0, 19) + '...';
            }
            return elementName;
        });

    //Adding info box to legend elements when hovering over
    legendText
        .data(legendData)
        .append('svg:title')
        .text(function (d) {
            return d;
        });

    //Only create carousel if the number of elements exceeds one legend "page"
    if (chart._vars.legendIndexMax > 0) {
        createVerticalCarousel(chart, legendData, drawFunc);
    }

    return legendRectangles;
}

/**createVerticalCarousel
 *
 * Draws the vertical legend carousel
 * @params chart, legendData, drawFunc
 */
function createVerticalCarousel(chart, legendData, drawFunc) {
    var svg = chart.svg,
        legendPolygon;

    //Adding carousel to legend
    svg.selectAll('.legend-carousel').remove();
    svg.selectAll('#legend-text-index').remove();

    legendPolygon = svg.append('g')
        .attr('class', 'legend-carousel');

    //Creates left navigation arrow for carousel
    legendPolygon.append('polygon')
        .attr('id', 'leftChevron')
        .attr('class', 'pointer-cursor')
        .style('fill', chart._vars.legendArrowColor)
        .attr('transform', 'translate(0,' + ((chart._vars.legendMax * chart._vars.gridSize) + 50) + ')')
        .attr('points', '0,7.5, 15,0, 15,15')
        .on('click', function () {
            if (chart._vars.legendIndex >= 1) {
                chart._vars.legendIndex--;
            }
            svg.selectAll('.legend').remove();
            var legendElements = generateVerticalLegendElements(chart, legendData, drawFunc);
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
        })
        .attr({
            display: function () {
                if (chart._vars.legendIndex === 0) {
                    return 'none';
                }
                return 'all';
            }
        });

    //Creates page number for carousel navigation
    legendPolygon.append('text')
        .attr('id', 'legend-text-index')
        .attr('x', 35)
        .attr('y', 242.5)
        .style('text-anchor', 'start')
        .style('font-size', chart._vars.fontSize)
        .text(function () {
            return (chart._vars.legendIndex + 1) + ' / ' + (chart._vars.legendIndexMax + 1);
        })
        .attr({
            display: function () {
                if (chart._vars.legendIndexMax === 0) {
                    return 'none';
                }
                return 'all';
            }
        });

    //Creates right navigation arrow for carousel
    legendPolygon.append('polygon')
        .attr('id', 'rightChevron')
        .attr('class', 'pointer-cursor')
        .style('fill', chart._vars.legendArrowColor)
        .attr('transform', 'translate(85,' + ((chart._vars.legendMax * chart._vars.gridSize) + 50) + ')')
        .attr('points', '15,7.5, 0,0, 0,15')
        .on('click', function () {
            if (chart._vars.legendIndex < chart._vars.legendIndexMax) {
                chart._vars.legendIndex++;
            }
            svg.selectAll('.legend').remove();
            var legendElements = generateVerticalLegendElements(chart, legendData, drawFunc);
            attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
        })
        .attr({
            display: function () {
                if (chart._vars.legendIndex === chart._vars.legendIndexMax) {
                    return 'none';
                }
                return 'all';
            }
        });
}

//Bind functions to prototype or jvCharts object
jvCharts.getColors = getColors;
jvCharts.setBarLineLegendData = setBarLineLegendData;
jvCharts.createColorsWithDefault = createColorsWithDefault;
jvCharts.values = values;
jvCharts.getYScale = getYScale;
jvCharts.getZScale = getZScale;
jvCharts.getLegendElementToggleArray = getLegendElementToggleArray;
jvCharts.generateLegendElements = generateLegendElements;
jvCharts.updateDataFromLegend = updateDataFromLegend;
jvCharts.createCarousel = createCarousel;
jvCharts.generateThresholdLegend = generateThresholdLegend;
jvCharts.attachClickEventsToLegend = attachClickEventsToLegend;
jvCharts.generateVerticalLegendElements = generateVerticalLegendElements;
jvCharts.createVerticalCarousel = createVerticalCarousel;
jvCharts.getToggledData = getToggledData;
jvCharts.getPlotData = getPlotData;
jvCharts.getPosCalculations = getPosCalculations;
jvCharts.getXScale = getXScale;
jvCharts.getYScale = getYScale;
jvCharts.setBarLineLegendData = setBarLineLegendData;
jvCharts.jvFormatValue = jvFormatValue;
jvCharts.getFormatExpression = getFormatExpression;
jvCharts.generateEventGroups = generateEventGroups;
jvCharts.jvFormatValueType = jvFormatValueType;
jvCharts.getAxisScale = getAxisScale;
jvCharts.setChartColors = setChartColors;
jvCharts.getDataTypeFromKeys = getDataTypeFromKeys;
jvCharts.cleanToolData = cleanToolData;

module.exports = jvCharts;