/***  jvBrush ***/
function jvBrush(configObj) {
    'use strict';
    var brushObj = this;
    brushObj.chartDiv = configObj.chartDiv;
    brushObj.brushDiv = '';
    brushObj.jvChart = configObj.jvChart;
    brushObj.disabled = false;
    brushObj.onBrushCallback = configObj.onBrushCallback;
}

/********************************************* All Brush Mode Functions **************************************************/

jvBrush.prototype.removeBrush = function () {
    var brushObj = this,
        svg = brushObj.jvChart.svg;

    svg.selectAll('.brusharea').remove();
};

jvBrush.prototype.startBrush = function (event) {
    var brushObj = this,
        height = brushObj.jvChart.config.container.height,
        width = brushObj.jvChart.config.container.width,
        svg = brushObj.jvChart.svg;

    if (brushObj.jvChart.config.type === 'singleaxis') {
        brushObj.brushType = 'x';
        svg.append('g')
            .attr('class', 'brusharea')
            .style('height', height + 'px')
            .style('width', width + 'px')
            .call(d3.brushX()
                .extent([[0, 0], [width, height]])
                .on('end', brushEnd));
    } else {
        brushObj.brushType = 'xy';
        svg.append('g')
            .attr('class', 'brusharea')
            .style('height', height + 'px')
            .style('width', width + 'px')
            .call(d3.brush()
                .extent([[0, 0], [width, height]])
                .on('end', brushEnd));
    }

    if(event) {
        //dispatch brush at the event
        var brush_elm = svg.select(".brusharea").node();
        var new_click_event = new Event('mousedown');
        new_click_event.pageX = d3.event.pageX;
        new_click_event.clientX = d3.event.clientX;
        new_click_event.pageY = d3.event.pageY;
        new_click_event.clientY = d3.event.clientY;
        new_click_event.view = d3.event.view;
        brush_elm.__data__ = {type:"overlay"};
        brush_elm.dispatchEvent(new_click_event);
    }


    /**brushEnd
     * @desc - function called at the end of the user brushing
     */
    function brushEnd() {
        var xScale = brushObj.jvChart.currentData.xAxisScale,
            yScale = brushObj.jvChart.currentData.yAxisScale,
            filteredXAxisLabels = [],
            filteredYAxisLabels = [],
            shouldReset = false,
            e = d3.event.selection,
            returnObj,
            filteredLabels = [],
            filteredConcepts = {},
            index,
            filterCol,
            filteredLabelsX,
            filteredLabelsY;

        if (e) {
            if ( brushObj.brushType === 'xy') {
                if (xScale && typeof xScale.invert !== 'function') { //means that the scale is ordinal and not linear
                    returnObj = calculateBrushAreaOrdinal(e[0][0], e[1][0], xScale);
                    filteredXAxisLabels = returnObj.filteredAxisLabels;
                    shouldReset = returnObj.shouldReset;
                } else if (xScale) {
                    //calculate labels for linear scale
                    returnObj = calculateBrushAreaLinear(e[0][0], e[1][0], xScale, brushObj.jvChart.currentData, brushObj.jvChart.config.type, 'x');
                    filteredXAxisLabels = returnObj.filteredAxisLabels;
                    shouldReset = returnObj.shouldReset;
                }

                if (yScale && typeof yScale.invert !== 'function') { //means that the scale is oridnal and not linear
                    returnObj = calculateBrushAreaOrdinal(e[0][1], e[1][1], yScale);
                    filteredYAxisLabels = returnObj.filteredAxisLabels;
                    if (returnObj.shouldReset) {
                        shouldReset = true;
                    }
                } else if (yScale) {
                    //calculate labels for linear scale
                    returnObj = calculateBrushAreaLinear(e[0][1], e[1][1], yScale, brushObj.jvChart.currentData, brushObj.jvChart.config.type, 'y');
                    filteredYAxisLabels = returnObj.filteredAxisLabels;
                    if (returnObj.shouldReset) {
                        shouldReset = true;
                    }
                } else if (brushObj.jvChart.config.type === 'cloud') {
                    returnObj = calculateCloudBrush(e, brushObj.jvChart.currentData);
                    filteredYAxisLabels = returnObj.filteredAxisLabels;
                    if (returnObj.shouldReset) {
                        shouldReset = true;
                    }
                } else if (brushObj.jvChart.config.type === 'heatmap') {
                    returnObj = calculateHeatmapBrush(e, brushObj.jvChart.currentData, brushObj.jvChart);
                    filteredLabelsX = returnObj.filteredXAxisLabels;
                    filteredLabelsY = returnObj.filteredYAxisLabels;
                    if (returnObj.shouldReset) {
                        shouldReset = true;
                    }
                }
            } else if (brushObj.brushType === 'x') {
                returnObj = calculateBrushAreaLinear(e[0], e[1], xScale, brushObj.jvChart.currentData, brushObj.jvChart.config.type, 'x');
                filteredXAxisLabels = returnObj.filteredAxisLabels;
                if (returnObj.shouldReset) {
                    shouldReset = true;
                }
            }
        } else {
            shouldReset = true;
        }

        if (filteredXAxisLabels.length > 0 && filteredYAxisLabels.length > 0) {
            //merge axisLabels
            for (var j = 0; j < filteredXAxisLabels.length; j++) {
                index = filteredYAxisLabels.indexOf(filteredXAxisLabels[j]);
                if (index > -1) {
                    filteredLabels.push(filteredXAxisLabels[j]);
                }
            }
        } else if (filteredXAxisLabels.length > 0) {
            filteredLabels = filteredXAxisLabels;
        } else if (filteredYAxisLabels.length > 0) {
            filteredLabels = filteredYAxisLabels;
        }

        if (brushObj.jvChart.config.type === 'heatmap') {
            if (!shouldReset) {
                var filterColX = brushObj.jvChart.currentData.dataTable.x;
                var filterColY = brushObj.jvChart.currentData.dataTable.y;
                if (filteredLabelsX.length > 0) {
                    filteredConcepts[filterColX] = filteredLabelsX;
                }
                if (filteredLabelsY.length > 0) {
                    filteredConcepts[filterColY] = filteredLabelsY;
                }
            }
        } else {
            if (brushObj.jvChart.config.type === 'gantt') {
                filterCol = brushObj.jvChart.currentData.dataTable.group;
            } else {
                filterCol = brushObj.jvChart.currentData.dataTable.label;
            }
            filteredConcepts[filterCol] = filteredLabels;
        }

        //calls back to update data with brushed data
        brushObj.onBrushCallback({
            data: filteredConcepts,
            reset: shouldReset,
            clean: true
        });
    }
};

/**calculateBrushAreaOrdinal
 *
 * @param mousePosMin
 * @param mousePosMax
 * @param scale
 * @returns Object
 * @desc calculates the ordinal values that are in the brushed area
 */
function calculateBrushAreaOrdinal(mousePosMin, mousePosMax, scale) {
    var domain = scale.domain(),
        padding = scale.padding(),
        step = scale.step(),
        minIndex, maxIndex,
        paddingDistance = padding * step / 2,
        filteredAxisLabels;

    //determine min index
    if (mousePosMin % step > step - paddingDistance) {
        //don't include on min side
        minIndex = (Math.floor(mousePosMin / step) + 1);
    } else {
        //include on min side
        minIndex = (Math.floor(mousePosMin / step));
    }

    //determine max index
    if (mousePosMax % step < paddingDistance) {
        //don't include on max side
        maxIndex = (Math.floor(mousePosMax / step) - 1);
    } else {
        //include on max side
        maxIndex = (Math.floor(mousePosMax / step));
        if (maxIndex === domain.length) {
            maxIndex -= 1;
        }
    }

    filteredAxisLabels = domain.slice(minIndex, maxIndex + 1);

    return {filteredAxisLabels: filteredAxisLabels, shouldReset: filteredAxisLabels.length === 0};
}

/**calculateBrushAreaOrdinal
 *
 * @param mousePosMin
 * @param mousePosMax
 * @param scale
 * @param data chartData
 * @param type visual type
 * @param axis - x / y
 * @returns Object
 * @desc calculates the ordinal values that are in the brushed area
 */
function calculateBrushAreaLinear(mousePosMin, mousePosMax, scale, data, type, axis) {
    var filteredAxisLabels = [],
        min,
        max,
        axisLabel;

    //switch min and max if scale is y due to svg drawing (y axis increases up the screen while mousePos decreases)
    if (axis === 'y') {
        max = scale.invert(mousePosMin);
        min = scale.invert(mousePosMax);
    } else {
        min = scale.invert(mousePosMin);
        max = scale.invert(mousePosMax);
    }

    if (type === 'bar') {
        for (var i = 0; i < data.legendData.length; i++) {
            axisLabel = data.legendData[i];
            for (var j = 0; j < data.chartData.length; j++) {
                if (data.chartData[j][axisLabel] >= min) {
                    filteredAxisLabels.push(data.chartData[j][data.dataTable.label]);
                }
            }
        }
    } else if (type === 'gantt') {
        max = new Date(max);
        min = new Date(min);
        for (var i = 0; i < data.legendData.length; i++) {
            var count = i+1;
            for (var j = 0; j < data.chartData.length; j++) {
                var startDate = new Date(data.chartData[j][data.dataTable['start '+count]]);
                var endDate = new Date(data.chartData[j][data.dataTable['end '+count]]);
                if ((startDate <= max && startDate >= min) || (endDate <= max && endDate >= min) || (startDate <= min && endDate >= max)) {
                    filteredAxisLabels.push(data.chartData[j][data.dataTable.group]);
                }
            }
        }
    } else if (type === 'line'  || type === 'area' || type === 'singleaxis') {
        for (var i = 0; i < data.legendData.length; i++) {
            axisLabel = data.legendData[i];
            for (var j = 0; j < data.chartData.length; j++) {
                if (data.chartData[j][axisLabel] <= max && data.chartData[j][axisLabel] >= min) {
                    filteredAxisLabels.push(data.chartData[j][data.dataTable.label]);
                }
            }
        }
    } else if (type === 'scatterplot') {
        axisLabel = data.dataTable[axis];
        for (var j = 0; j < data.chartData.length; j++) {
            if (data.chartData[j][axisLabel] <= max && data.chartData[j][axisLabel] >= min) {
                filteredAxisLabels.push(data.chartData[j][data.dataTable.label]);
            }
        }
    } else if (type === 'heatmap') {
        axisLabel = data.dataTable[axis];
        for (var j = 0; j < data.chartData.length; j++) {
            if (data.chartData[j][axisLabel] <= max && data.chartData[j][axisLabel] >= min) {
                filteredAxisLabels.push(data.chartData[j][data.dataTable.label]);
            }
        }
    }

    return {filteredAxisLabels: filteredAxisLabels, shouldReset: filteredAxisLabels.length === 0};
}


function calculateCloudBrush(e, data) {
    for (var i = 0; i < data.length; i++) {
        var d = data[i];
        var mouseX0 = e[0][0];
        var mouseX1 = e[0][1];
        var mouseY0 = e[1][0];
        var mouseY1 = e[1][1];
    }

    return [];
}

function calculateHeatmapBrush(e, data, chart) {
    var mouseXmin = e[0][0];
    var mouseYmin = e[0][1];
    var mouseXmax = e[1][0];
    var mouseYmax = e[1][1];
    var filteredXAxisLabels = [];
    var filteredYAxisLabels = [];
    var filteredData = [];
    var reset = true;

    var xBucketMax = Math.floor(mouseXmax / chart._vars.heatGridSize) + 1;
    var yBucketMax = Math.floor(mouseYmax / chart._vars.heatGridSize) + 1;

    var xBucketMin =  Math.floor(mouseXmin / chart._vars.heatGridSize);
    var yBucketMin =  Math.floor(mouseYmin / chart._vars.heatGridSize);

    for (var i = 0; i < xBucketMax; i++) {
        if(i >= xBucketMin){
            filteredXAxisLabels.push(data.xAxisData.values[i]);
            reset = false;
        }
    }
    for (var i = 0; i < yBucketMax; i++) {
        if(i >= yBucketMin){
            filteredYAxisLabels.push(data.yAxisData.values[i]);
            reset = false;
        }
    }

    //Might need when new PKQL pixel... comes out
    // for (var i = 0; i < data.chartData.length; i++) {
    //     var d = data.chartData[i];
    //     if(filteredXAxisLabels.includes(d[data.dataTable.x]) && filteredYAxisLabels.includes(d[data.dataTable.y])) {
    //         filteredDataX.push(d[data.dataTable.x]);
    //         filteredDataY.push(d[data.dataTable.y]);
    //     }
    // }

    return {filteredXAxisLabels: filteredXAxisLabels, filteredYAxisLabels: filteredYAxisLabels, shouldReset: reset};
}

module.exports = jvBrush;