(function () {
    'use strict';

    jvCharts.prototype.clusters = {
        paint: paint,
        setData: setData
    };

    jvCharts.prototype.generateClusters = generateClusters;

    /**setClustersData
     *
     * @desc gets clusters data and adds it to the chart object
     * @params data, dataTable, colors
     */
    function setData(chart) {
        chart.data.legendData = setClustersLegendData(chart.data);
        chart.data.xAxisData  = setClustersAxisData(chart.data, 'x', chart.options);
        chart.data.yAxisData  = setClustersAxisData(chart.data, 'y', chart.options);
        chart.data.zAxisData  = chart.data.dataTable.hasOwnProperty('z') ? setclustersAxisData(chart.data, 'z') : {};
        //Trendline
        chart.data.trendAxisData = setClustersAxisData(chart.data, 'value');

        //define color object for chartData
        chart.data.color = chart.setChartColors(chart.options.color, chart.data.legendData, chart.colors);

        chart.colorScale = chart.colors;
    };

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
        dataObj.trendAxisData = chart.data.trendAxisData;
        chart.currentData = dataObj;

        //generate svg dynamically based on legend data
        chart.generateSVG(dataObj.legendData);
        chart.generateXAxis(chart.currentData.xAxisData);
        chart.generateYAxis(chart.currentData.yAxisData);
        chart.generateLegend(chart.currentData.legendData, 'generateClusters');
        chart.generateClusters();
        //chart.generateRegressionLine();
        //chart.createLineGuide();
        chart.formatXAxisLabels(chart.currentData.xAxisScale.ticks().length);
    };
    /**
     * @setClustersLegendData
     */
    function setClustersLegendData(data) {
    var legendArray = [];
    if (data.dataTable.hasOwnProperty('series')) {
        var item = data.dataTable.series;
        for (var value in data.chartData) {
            var legendElement = data.chartData[value][item];
            if (legendArray.indexOf(legendElement) === -1) {
                legendArray.push(legendElement);
            }
        }
    }
    else {
        if (data.dataTable.hasOwnProperty('label')) {
            legendArray.push(data.dataTable.label);
        }
    }
    if (typeof legendArray[0] === 'undefined') {
        legendArray = [];
        legendArray.push(data.dataTable.label);
    }
    //order legend data in alphabetical order
    legendArray.sort();
    return legendArray;
}
    /** generateClusters
     * @desc creates and draws a clusters plot on the svg element
     */
    function generateClusters() {
        var chart = this,
            svg = chart.svg,
            options = chart.options,
            container = chart.config.container,
            clustersData = chart.currentData.chartData,
            dataTable = chart.currentData.dataTable,
            xAxisData = chart.currentData.xAxisData,
            yAxisData = chart.currentData.yAxisData,
            zAxisData = chart.currentData.zAxisData,
            legendData = chart.currentData.legendData,
            zoomEvent = chart.config.zoomEvent,
            trendAxisData = chart.currentData.trendAxisData,

            tolerance;

        if (!options.NODE_MIN_SIZE) {
            options.NODE_MIN_SIZE = 1.5;
        }
        if (!options.NODE_MAX_SIZE) {
            options.NODE_MAX_SIZE = 35;
        }

        svg.selectAll("g.clusters-container").remove();
        svg.selectAll("g.clusters-container.editable-clusters").remove();

        var colors = options.color,
            clustersDataNew = JSON.parse(JSON.stringify(clustersData)),
            translateY = 0,
            translateX = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 0 : zoomEvent.translate[0], //translates if there is zoom
            zoomScale = (typeof zoomEvent === 'undefined' || zoomEvent === null) ? 1 : zoomEvent.scale;

        translateX = Math.min(0, translateX);
        translateX = Math.min(0, Math.max(translateX, container.width - (container.width * zoomScale)));


        if (!chart.options.legendHeaders) {
            chart.options.legendHeaders = legendData;
        }

        var dataHeaders = chart.options.legendHeaders;
        var legendElementToggleArray = jvCharts.getLegendElementToggleArray(dataHeaders, legendData);
        var clustersDataFiltered = [];

        if (legendElementToggleArray) {
            for (var j = 0; j < clustersDataNew.length; j++) {
                for (var i = 0; i < legendElementToggleArray.length; i++) {
                    if (typeof clustersDataNew[j][dataTable.label] === 'undefined' || clustersDataNew[j][dataTable.label] === "") {
                        if (legendElementToggleArray[i].toggle === false) {
                            clustersDataNew[j][dataTable.x] = -1;
                            clustersDataNew[j][dataTable.y] = -1;
                            clustersDataNew[j][dataTable.z] = -1;
                        }
                    } else {
                        if (legendElementToggleArray[i].element === clustersDataNew[j][dataTable.series] && legendElementToggleArray[i].toggle === false) {
                            clustersDataNew[j][dataTable.x] = -1;
                            clustersDataNew[j][dataTable.y] = -1;
                            clustersDataNew[j][dataTable.z] = -1;
                        }
                    }
                }
            }
        }

        for (var j = 0; j < clustersDataNew.length; j++) {
            if (clustersDataNew[j][dataTable.x] !== -1 && clustersDataNew[j][dataTable.y] !== -1) {
                clustersDataFiltered.push(clustersDataNew[j]);
            }
        }

        var x = chart.getAxisScale('x', xAxisData, container, null, zoomEvent, options);
        var y = chart.getAxisScale('y', yAxisData, container, null, zoomEvent, options);
        if (!_.isEmpty(zAxisData)) {
            var z = getZScale(zAxisData, options, zoomEvent);
        }

        var cxTranslate,
            cyTranslate;

        cxTranslate = function (d, i) {
            return x(clustersDataFiltered[i][xAxisData.label]);
        };
        cyTranslate = function (d, i) {
            return y(clustersDataFiltered[i][yAxisData.label]);
        };

        var clusterss = svg.append("g")
            .attr("class", "clusters-container")
            .selectAll("g");

        clusterss
            .data(function () {
                return clustersDataFiltered;
            })
            .enter()
            .append('circle')
            .attr("class", function (d, i) {
                return 'editable editable-clusters clusters-circle-' + i + ' highlight-class';
            })
            .attr("cx", function (d, i) {
                return cxTranslate(d, i);
            })
            .attr("cy", function (d, i) {
                return cyTranslate(d, i);
            })
            .attr("transform", "translate(" + translateX + "," + translateY + ")")
            .attr("r", function (d, i) {
                if (dataTable.hasOwnProperty('z')) {
                    if (options.toggleZ && !_.isEmpty(zAxisData) && clustersDataFiltered[i][dataTable.z]) {
                        return z(clustersDataFiltered[i][dataTable.z]);
                    }
                }
                return options.NODE_MIN_SIZE;
            })
            .on("mouseover", function (d, i, j) {
                if (chart.draw.showToolTip) {
                    var tipData = chart.setTipData(d, i);
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
                }
            })
            .on("mousemove", function (d, i) {
                if (chart.draw.showToolTip) {
                    chart.tip.hideTip();
                    var tipData = chart.setTipData(d, i);
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
                }
            })
            .on("mouseout", function (d, i) {
                if (chart.draw.showToolTip) {
                    chart.tip.hideTip();
                    svg.selectAll(".tip-line").remove();
                }
            })
            .attr('fill', function (d, i) {
                if (dataTable.hasOwnProperty('series')) {
                    var color = jvCharts.getColors(colors, i, clustersDataFiltered[i][dataTable.series]);
                }
                else {
                    var color = jvCharts.getColors(colors, i, clustersDataFiltered[i][dataTable.label]);
                }
                return color;
            });

            //Add Linear Regression line
            var xAxisDataValues = clustersDataFiltered.map(function(d) {
                        return d[xAxisData.label]
                    })
            var yAxisDataValues = clustersDataFiltered.map(function(d) {
                        return d[yAxisData.label]
                    })

            // //Code for Trendline
            //Filter data so that it should not overflow the svg
            function filterY1(value) {
                return value.y > y(d3.max(yAxisDataValues)) ;
            }
            function filterY2(value) {
                return value.y < y(d3.min(yAxisDataValues)) ;
            }
            function filterX(value) {
                return value.x > x(d3.min(xAxisDataValues));
            }
            if(typeof trendAxisData.label != "undefined" ){
            var trendDataValues = clustersDataFiltered.map(function(d) {
                        return {x:x(d[xAxisData.label]),y:y(d[trendAxisData.label])}
                    })
                    .sort(function(a, b){return a.x-b.x})
                    .filter(filterY2)
                    .filter(filterY1)

        var lineFunction = d3.line()
                            .x(function(d) { return d.x; })
                            .y(function(d) { return d.y; });

        if (d3.select('.trend-line')) {
            d3.select('.trend-line').remove();
        }
        var lineGraph = svg.append("g")
                            .attr("class", "trend-line")
                            .append("path")
                            .attr("d",lineFunction(trendDataValues))
                            .attr("stroke", "grey")
                            .attr("stroke-width", 3)
                            .attr("fill", "none");
        }

        var maxX = x.invert(chart.config.container.width); //d3.max(xAxisDataValues);
        var maxY = y.invert(0); //d3.max(yAxisDataValues);
        var minX = x.invert(0); //d3.min(xAxisDataValues);
        var minY = y.invert(chart.config.container.height); //d3.min(yAxisDataValues);
        if (d3.select('.predictor')) {
            d3.select('.predictor').remove();
        }

        function getIntersections(slope, intercept, minX, maxX, minY, maxY){
                var intersections = [];

                var cross = 0;
                // for x bounds 
                // x = minX
                cross = (slope * minX) + intercept;
                if ((minY <= cross) && (maxY > cross))
                    intersections.push([minX, cross]);
                // x = maxX
                cross = (slope * maxX) + intercept;
                if ((minY < cross) && (maxY >= cross))
                    intersections.push([maxX, cross]);

                // for y bounds 
                // y = minY
                cross = (minY - intercept)/slope;
                if ((minX < cross) && (maxX >= cross))
                    intersections.push([cross, minY]);
                // y = maxY
                cross = (maxY - intercept)/slope;
                if ((minX <= cross) && (maxX > cross))
                    intersections.push([cross, maxY]);

                return intersections;
            }

        var lreg = linearRegression(xAxisDataValues, yAxisDataValues);
        //addLRegression(svg, lreg, minX, minY, maxX, maxY, x, y);
        // for linear regression line
        var lregIntersections = getIntersections(lreg.slope, lreg.intercept, minX, maxX, minY, maxY);
        if (lregIntersections.length == 2){
            var lregLine = svg.append("g").append("svg:line")
                        .attr("x1", x(lregIntersections[0][0]))
                        .attr("y1", y(lregIntersections[0][1]))
                        .attr("x2", x(lregIntersections[1][0]))
                        .attr("y2", y(lregIntersections[1][1]))
                        .style("stroke", "DC8240") .style("stroke-width","4px").style("stroke-opacity","0.6")
                        .attr('transform', 'translate(0,0)')
                        .attr("class", "predictor");
        }

        if (chart.data.additionalInfo) {
            var boundsPresent = chart.data.additionalInfo.hasOwnProperty("Bounds");
        }
        //Upper and lowerbounds line
        if (boundsPresent) {
            var offset = chart.data.additionalInfo.Bounds.Tolerance * chart.data.additionalInfo.Bounds.StandardDeviation;

            // for upper bounds 
            var upperBoundIntersections = getIntersections(lreg.slope, lreg.intercept + offset, x.invert(0), x.invert(chart.config.container.width), y.invert(chart.config.container.height), y.invert(0));
            if (upperBoundIntersections.length == 2){
                var upperBound = svg.append("g").append("svg:line")
                            .attr("x1", x(upperBoundIntersections[0][0]))
                            .attr("y1", y(upperBoundIntersections[0][1]))
                            .attr("x2", x(upperBoundIntersections[1][0]))
                            .attr("y2", y(upperBoundIntersections[1][1]))
                            .attr('transform', 'translate(0,0)')
                            .attr("class", "range");
            }

            // for lower bounds
            var lowerBoundIntersections = getIntersections(lreg.slope, lreg.intercept - offset, x.invert(0), x.invert(chart.config.container.width), y.invert(chart.config.container.height), y.invert(0));
            if (lowerBoundIntersections.length == 2){
                var lowerBound = svg.append("g").append("svg:line")
                            .attr("x1", x(lowerBoundIntersections[0][0]))
                            .attr("y1", y(lowerBoundIntersections[0][1]))
                            .attr("x2", x(lowerBoundIntersections[1][0]))
                            .attr("y2", y(lowerBoundIntersections[1][1]))
                            .attr('transform', 'translate(0,0)')
                            .attr("class", "range_lower");
            }
        }


            //Ploting Sampled points
            var sampleLabel = chart.data.dataTable["color"];
            var sampledPoints = clustersDataFiltered.filter(function(d, i) {return d[sampleLabel] ==  "1"; });

            if(typeof(sampleLabel) !== "undefined") {
                var pointDots = svg.selectAll('.sampleDots').data(sampledPoints);
            
                pointDots.enter().append('circle')
                    
                    .attr('class', 'selected_point_fill')
                    .attr('r', 4)
                    .attr('cx', function(d) {
                        return x(d[xAxisData.label]);
                    })
                    .attr('cy', function(d) {
                        return y(d[yAxisData.label]);
                    })
                    .style("fill",function(d) {
                        if(!boundsPresent)
                            return "#81BC00";
                        switch(d["Bounds"]){
                            case 0:
                                return "699600";
                            case 1:
                                return "BF4C00";
                            case 2:
                                return "#837722";
                        }
                    })   
                    .on("mouseover", function (d, i, j) {
                        if (chart.draw.showToolTip) {
                            var tipData = chart.setTipData(d, i);
                            chart.tip.generateSimpleTip(tipData, chart.data.dataTable, d3.event);
                        }
                    })
                    .on("mouseout", function (d, i) {
                        if (chart.draw.showToolTip) {
                            chart.tip.hideTip();
                            svg.selectAll(".tip-line").remove();
                        }
                    });
            }


            //Plot Clusters on the chart
            var clusterLabel = chart.data.dataTable["cluster"];
            if(typeof(clusterLabel) != "undefined"){
                        var color = chart.data.color;
                        var means = [];
                        var pointsPerCluster = [];
                        var assignments = clustersDataFiltered.map(function(d) {
                            return d[clusterLabel]
                        });
                        for (var i = 0; i < clustersDataFiltered.length; i++) {
                            if(isNaN(pointsPerCluster[assignments[i]])){
                                means[assignments[i]] = [0,0];
                                pointsPerCluster[assignments[i]] = 0;
                            }
                            means[assignments[i]][0] += clustersDataFiltered[i][xAxisData.label];
                            means[assignments[i]][1] += clustersDataFiltered[i][yAxisData.label];
                            pointsPerCluster[assignments[i]] = pointsPerCluster[assignments[i]] + 1;
                        }
                        for(var mean in means){
                            means[mean][0] /= pointsPerCluster[mean];
                            means[mean][1] /= pointsPerCluster[mean];
                        }
                    
                    var color = d3.scaleOrdinal().range(chart.colorScale);
                    
            var assignmentLinesNew = svg.selectAll('.assignmentLines').data(clustersDataFiltered);
                    assignmentLinesNew.enter().append('line')
                        .attr('class', function(d, i) {
                            return 'assignmentLines cluster-'+ d[2];
                        })
                        .attr('x1', function(d, i) {
                            return x(d[xAxisData.label]);
                        })
                        .attr('y1', function(d, i) {
                            return y(d[yAxisData.label]);
                        })
                        .attr('x2', function(d, i) {
                            return x(means[d[clusterLabel]][0]);
                        })
                        .attr('y2', function(d, i) {
                            return y(means[d[clusterLabel]][1]);
                        })
                        .attr('stroke', function(d) {
                            return color(d[clusterLabel]);
                        })
                        .attr("opacity","0.4");

                    var meanDots = svg.selectAll('.meanDots').data(means);
                    meanDots.enter().append('circle').attr('class', 'meanDots')
                        .attr('r', 5)
                        .attr('stroke', function(d, i) {
                            return color(i);
                        })
                        .attr('stroke-width', 3)
                        .attr('fill', 'white')
                        .attr('cx', function(d) {
                            return x(d[0]);
                        })
                        .attr('cy', function(d) {
                            return y(d[1]);
                        });
                    meanDots.exit().remove();
                }
        return clusterss;
    };



    //Funtion to perform Linear regression
    function linearRegression(x, y) {
            var lr = {};
            var n = y.length;
            var sum_x = 0;
            var sum_y = 0;
            var sum_xy = 0;
            var sum_xx = 0;
            var sum_yy = 0;

            for (var i = 0; i < y.length; i++) {
                sum_x += x[i];
                sum_y += y[i];
                sum_xy += (x[i] * y[i]);
                sum_xx += (x[i] * x[i]);
                sum_yy += (y[i] * y[i]);
            }

            lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
            lr['intercept'] = (sum_y - lr.slope * sum_x) / n;
            lr['r2'] = Math.pow((n * sum_xy - sum_x * sum_y) / Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)), 2);

            return lr;
        };
    function addLRegression(svg, lreg, minX, minY, maxX, maxY, xScale, yScale) {
        
        var myLine = svg.append("svg:line")
            .attr("x1", xScale(minX))
            .attr("y1", yScale(lreg.intercept))
            .attr("x2", xScale(maxX))
            .attr("y2", yScale((maxX * lreg.slope) + lreg.intercept))
            .style("stroke", "DC8240") .style("stroke-width","4px").style("stroke-opacity","0.6")
            .attr('transform', 'translate(0,0)')
            .attr("class", "predictor");
    }

    /**setClustersAxisData
     *  gets z axis data based on the chartData
     *
     * @params data, dataTable
     * @returns object with label and values
     */
    function setClustersAxisData(data, axis, options) {
        //declare vars
        var axisData = [],
            chartData = data.chartData,
            label = data.dataTable[axis],
            min = label ? chartData[0][label] : 0,
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

        if(options) {
            if(options.yMin && !isNaN(options.yMin) && axis === 'y') {
                min = options.yMin;
            }
            if(options.yMax && !isNaN(options.yMax)&& axis === 'y') {
                max = options.yMax;
            }
            if(options.xMin && !isNaN(options.xMin)&& axis === 'x') {
                min = options.xMin;
            }
            if(options.xMax && !isNaN(options.xMax)&& axis === 'x') {
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

})(window, document);