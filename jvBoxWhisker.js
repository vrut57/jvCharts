(function () {
    'use strict';

    jvCharts.prototype.boxwhisker = {
        paint: paint,
        setData: setData
    };

    jvCharts.prototype.generateBoxes = generateBoxes;
    /**setBoxData
     *  gets cloud data and adds it to the chart object
     *
     * @params data, dataTable, colors
     */
    function setData(chart) {
        //define color object for chartData
        chart.data.xAxisData = setBoxWhiskerAxisData(chart.data, 'x', chart.options);
        chart.data.yAxisData = setBoxWhiskerAxisData(chart.data, 'y', chart.options);
        chart.data.zAxisData = chart.data.dataTable.hasOwnProperty('z') ? setCircleViewXAxisData(chart.data, 'z', chart.options) : {};
        chart.data.color = chart.colors;
    };

    /** paintBoxChart
     *
     *  @desc The initial starting point for bar chart, begins the drawing process. Must already have the data stored in the chart object
     */
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
        //Overwrite any pre-existing zoom
        chart.config.zoomEvent = null;
        //generate svg dynamically based on legend data
        chart.generateSVG(dataObj.legendData);
        chart.generateXAxis(dataObj.xAxisData);
        chart.generateYAxis(dataObj.yAxisData);
        //chart.generateLegend(dataObj.legendData, 'generateBox');
        //chart.formatXAxisLabels(dataObj.chartData.length);
        chart.generateBoxes(dataObj);
    };

/**setBoxWhiskerAxisData
     *  gets z axis data based on the chartData
     *
     * @params data, dataTable
     * @returns object with label and values
     */
    function setBoxWhiskerAxisData(data, axis, options) {
        //declare vars
        var axisData = [],
            chartData = data.chartData,
            label = data.dataTable[axis];
        var min = label ? chartData[0][label] : 0,
            max = label ? chartData[0][label] : 0;
        //loop over data to find max and min
        //also determines the y axis total if the data is stacked
        for (var i = 1; i < chartData.length; i++) {
            if (chartData[i].hasOwnProperty(label)) {
                var num = chartData[i][label];
                if (!isNaN(num)) {
                    num = parseFloat(num);
                    if (num > max) {
                        max = num;
                    }
                    else if (num < min) {
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
            'label': label,
            'values': axisData,
            'dataType': 'NUMBER',
            'min': min,
            'max': max
        };

    }

    /** getBoxDataFromOptions
     *
     *  @desc Assigns the correct chart data to current data using the chart.options
     */
    function getBoxDataFromOptions() {
        //creating these two data variables to avoid having to reference the chart object everytime
        var flipped = chart.flippedData;
        var csv = chart.data.chartData;
        var dataTable = chart.data.dataTable;
        var min = Infinity,
        max = -Infinity;
        var xAxis=[],yAxis=[];

        var dataObj = {};
        var i = 0;
        var data = [];
        for (var key in dataTable) 
        {
            if (key.startsWith("value")) {
                data[i] = [];
                data[i][0] = dataTable[key];
                data[i][1] = [];
                xAxis.push(dataTable[key]);
                i++;
                }
        }


        csv.forEach(function(x) {
            i=0;
            for (var key in dataTable) 
            {   
                if (key.startsWith("value")) {
                    var index = dataTable[key];
                    index = index.split(" ").join("_");
                    data[i][1].push(Math.floor(x[index]));
                    max = Math.max(max,Math.floor(x[index]));
                    min = Math.min(min,Math.floor(x[index]));
                    i++;
                }
            }
        });

        yAxis.push(min);
        yAxis.push(max);
        var xAxisData  = { "label": "", "dataType" : "STRING" , "values" : xAxis};
        var yAxisData  = { "label": "CYRevenue", "dataType" : "NUMBER" , "values" : yAxis};

        dataObj.chartData = data;
        //dataObj.legendData = xAxisLegends;
        dataObj.dataTable = data.dataTable;
        chart.options.color = data.color;
            
        dataObj.xAxisData = xAxisData;
        dataObj.yAxisData = yAxisData;
        return dataObj;
    };

    /** generateBars
     * @desc Does the actual painting of bars on the bar chart
     */
     function generateBoxes() {
        var chart = this,
            svg = chart.svg,
            options = chart.options,
            container = chart.config.container,
            labels = true,
            height = container.height,
            width = container.width;
        var margin = {top: 0, right: 50, bottom: 70, left: 50};

        var boxChart = d3.box()
            .whiskers(iqr(1.5))
            .height(height) 
            .domain([chart.data.yAxisData.values[0], chart.data.yAxisData.values[1]])
            .showLabels(labels);
        // the x-axis        
        var x = d3.scaleBand()    
            .domain( chart.data.chartData.map(function(d) { return d[0]; } ) )       
            .rangeRound([0 , width])
            .paddingInner(0.7)
            .paddingOuter(0.3);  
            // draw the boxplots    
        svg.selectAll(".box")      
        .data(chart.data.chartData)
        .enter().append("g")
            .attr("transform", function(d) { return "translate(" +  x(d[0])  + "," + margin.top + ")"; } )
        // .call(boxChart.width(x.rangeBand())); 
        .call(boxChart.width(x.bandwidth())); 
    };

    // Returns a function to compute the interquartile range.
    function iqr(k) {
    return function(d, i) {
        var q1 = d.quartiles[0],
            q3 = d.quartiles[2],
            iqr = (q3 - q1) * k,
            i = -1,
            j = d.length;
        while (d[++i] < q1 - iqr);
        while (d[--j] > q3 + iqr);
        return [i, j];
    };
    }
})(window, document);