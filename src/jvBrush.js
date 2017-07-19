/***  jvBrush ***/
'use-strict';
/**
* @name jvBrush
* @desc Constructor for JV Brush - creates brush mode for a jv visualization and executes a callback for the visual to be filtered
* @param {object} configObj - constructor object containing the jvChart and other options
* @return {undefined} - no return
*/
function jvBrush(configObj) {
    var brushObj = this;
    brushObj.chartDiv = configObj.chartDiv;
    brushObj.jvChart = configObj.jvChart;
    brushObj.onBrushCallback = configObj.onBrushCallback;
}

/**
* @name removeBrush
* @desc removes the brush area from the visual
* @return {undefined} - no return
*/
jvBrush.prototype.removeBrush = function () {
    let brushObj = this;
    brushObj.jvChart.svg.selectAll('.brusharea').remove();
};

/**
* @name startBrush
* @desc removes the brush area from the visual
* @param {object} event - optional event to start brush immediately with a new mousedown
* @return {undefined} - no return
*/
jvBrush.prototype.startBrush = function (event = false) {
    let brushObj = this,
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
                .on('end', brushEnd.bind(brushObj)));
    } else {
        brushObj.brushType = 'xy';
        svg.append('g')
            .attr('class', 'brusharea')
            .style('height', height + 'px')
            .style('width', width + 'px')
            .call(d3.brush()
                .extent([[0, 0], [width, height]])
                .on('end', brushEnd.bind(brushObj)));
    }

    if (event) {
        //dispatch mousedown to start a brush at the event coordinates
        let brushElement = svg.select('.brusharea').node(),
            newEvent = new Event('mousedown');
        newEvent.pageX = event.pageX;
        newEvent.clientX = event.clientX;
        newEvent.pageY = event.pageY;
        newEvent.clientY = event.clientY;
        newEvent.view = event.view;
        brushElement.__data__ = { type: 'overlay' };
        brushElement.dispatchEvent(newEvent);
    }
};

/**
* @name brushEnd
* @desc called at the end of the user brushing which calls the onBrush callback
* @return {undefined} - no return
*/
function brushEnd() {
    var brushObj = this,
        xScale = brushObj.jvChart.currentData.xAxisScale,
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
        if (brushObj.brushType === 'xy') {
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
        for (let j = 0; j < filteredXAxisLabels.length; j++) {
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
            let filterColX = brushObj.jvChart.currentData.dataTable.x,
                filterColY = brushObj.jvChart.currentData.dataTable.y;
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

/**
* @name calculateBrushAreaOrdinal
* @desc calculates the ordinal values that are in the brushed area
* @param {number} mousePosMin - lower bound mouse position
* @param {number} mousePosMax - upper bound mouse position
* @param {object} scale - d3 axis scale
* @return {Object} - object of filtered values
*/
function calculateBrushAreaOrdinal(mousePosMin, mousePosMax, scale) {
    let domain = scale.domain(),
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
    return { filteredAxisLabels: filteredAxisLabels, shouldReset: filteredAxisLabels.length === 0 };
}


/**
* @name calculateBrushAreaLinear
* @desc calculates the linear values that are in the brushed area
* @param {number} mousePosMin - lower bound mouse position
* @param {number} mousePosMax - upper bound mouse position
* @param {object} scale - d3 axis scale
* @param {object} data - chartData
* @param {string} type - visual type
* @param {string} axis - x / y / z
* @return {Object} - object of filtered values
*/
function calculateBrushAreaLinear(mousePosMin, mousePosMax, scale, data, type, axis) {
    let filteredAxisLabels = [],
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
        for (axisLabel of data.legendData) {
            for (let dataElement of data.chartData) {
                if (dataElement[axisLabel] >= min) {
                    filteredAxisLabels.push(dataElement[data.dataTable.label]);
                }
            }
        }
    } else if (type === 'gantt') {
        max = new Date(max);
        min = new Date(min);
        for (let i = 0; i < data.legendData.length; i++) {
            let count = i + 1,
                startDate,
                endDate;
            for (let dataElement of data.chartData) {
                startDate = new Date(dataElement[data.dataTable['start ' + count]]);
                endDate = new Date(dataElement[data.dataTable['end ' + count]]);
                if ((startDate <= max && startDate >= min) || (endDate <= max && endDate >= min) || (startDate <= min && endDate >= max)) {
                    filteredAxisLabels.push(dataElement[data.dataTable.group]);
                }
            }
        }
    } else if (type === 'line' || type === 'area' || type === 'singleaxis') {
        for (axisLabel of data.legendData) {
            for (let dataElement of data.chartData) {
                if (dataElement[axisLabel] <= max && dataElement[axisLabel] >= min) {
                    filteredAxisLabels.push(dataElement[data.dataTable.label]);
                }
            }
        }
    } else if (type === 'scatterplot') {
        axisLabel = data.dataTable[axis];
        for (let dataElement of data.chartData) {
            if (dataElement[axisLabel] <= max && dataElement[axisLabel] >= min) {
                filteredAxisLabels.push(dataElement[data.dataTable.label]);
            }
        }
    } else if (type === 'heatmap') {
        axisLabel = data.dataTable[axis];
        for (let dataElement of data.chartData) {
            if (dataElement[axisLabel] <= max && dataElement[axisLabel] >= min) {
                filteredAxisLabels.push(dataElement[data.dataTable.label]);
            }
        }
    }

    return { filteredAxisLabels: filteredAxisLabels, shouldReset: filteredAxisLabels.length === 0 };
}

/**
* @name calculateHeatmapBrush
* @desc calculates values inside of brushed area of a heatmap
* @param {array} e - mouse extent for location of brushed area
* @param {array} data - chart data
* @param {array} chart - jvChart
* @return {object} - filtered data
*/
function calculateHeatmapBrush(e, data, chart) {
    let mouseXmin = e[0][0],
        mouseYmin = e[0][1],
        mouseXmax = e[1][0],
        mouseYmax = e[1][1],
        filteredXAxisLabels = [],
        filteredYAxisLabels = [],
        reset = true,
        xBucketMax = Math.floor(mouseXmax / chart._vars.heatGridSize) + 1,
        yBucketMax = Math.floor(mouseYmax / chart._vars.heatGridSize) + 1,
        xBucketMin = Math.floor(mouseXmin / chart._vars.heatGridSize),
        yBucketMin = Math.floor(mouseYmin / chart._vars.heatGridSize);

    for (let i = 0; i < xBucketMax; i++) {
        if (i >= xBucketMin) {
            filteredXAxisLabels.push(data.xAxisData.values[i]);
            reset = false;
        }
    }
    for (let i = 0; i < yBucketMax; i++) {
        if (i >= yBucketMin) {
            filteredYAxisLabels.push(data.yAxisData.values[i]);
            reset = false;
        }
    }

    //Might need when new PKQL pixel... comes out
    //for (var i = 0; i < data.chartData.length; i++) {
    //var d = data.chartData[i];
    //if(filteredXAxisLabels.includes(d[data.dataTable.x]) && filteredYAxisLabels.includes(d[data.dataTable.y])) {
    //filteredDataX.push(d[data.dataTable.x]);
    //filteredDataY.push(d[data.dataTable.y]);
    //}
    //}

    return { filteredXAxisLabels: filteredXAxisLabels, filteredYAxisLabels: filteredYAxisLabels, shouldReset: reset };
}

module.exports = jvBrush;
