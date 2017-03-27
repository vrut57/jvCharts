/***  jvTip ***/

function jvTip(configObj) {
    "use strict";
    var tip = this;

    tip.type = configObj.type;
    tip.chartDiv = configObj.chartDiv;

    //Create initial div
    tip.chartDiv.select('.jv-tooltip').remove();

    tip.chartDiv.append("div")
        .attr("class", "tooltip jv-tooltip")
        .style("pointer-events", "none");
}

jvTip.prototype.showTip = function () {
    var tip = this;
    return;
    //todo position tip properly
    tip.toolTip.style("display", "block");
}

jvTip.prototype.hideTip = function () {
    var tip = this;
    if (tip.toolTip) {
        tip.toolTip.style("display", "none");
    }
};


/************************************************* Viz Specific Functions ***********************************************************************************************************/

jvTip.prototype.generateSimpleTip = function (dataObj, dataTable, event) {
    return;
    var tip = this;
    //Logic to determine where tooltip will be placed on page
    var leftOfMouse = false,
        topOfMouse = false;
    if (event.offsetX > (tip.chartDiv._groups[0][0].clientWidth / 2)) {
        leftOfMouse = true
    }
    if (event.offsetY < (tip.chartDiv._groups[0][0].clientHeight / 2)) {
        topOfMouse = true;
    }
    if(dataObj.hasOwnProperty('title') && dataObj.title === ''){
        dataObj.title = 'Empty'
    }

    tip.toolTip = tip.chartDiv.select(".tooltip")
        .html(function () {
            if (dataObj.viz === 'clusters' || dataObj.viz === 'circleviewplot' || dataObj.viz === 'scatterplot' || dataObj.viz === 'treemap' || dataObj.viz === 'singleaxis') {
                return generateSingleColorHTML(dataObj, dataTable);
            } else if (dataObj.viz === 'radial' || dataObj.viz === 'pie') {
                return generatePieHTML(dataObj, dataTable);
            } else if (dataObj.viz === 'circlepack' || dataObj.viz === 'jvsunburst') {
                return generatePackHTML(dataObj, dataTable);
            } else if (dataObj.viz === 'heatmap' || dataObj.viz === 'cloud') {
                return generateHeatmapHTML(dataObj, dataTable);
            } else if (dataObj.viz === 'sankey') {
                return generateSankeyHTML(dataObj, dataTable);
            }
            else {
                return generateSimpleHTML(dataObj, dataTable);
            }
        })
        .style("right", "auto")
        .style("left", "auto")
        .style("top", "auto")
        .style("bottom", "auto")
        .style("display", "block")
        .style("opacity", 1);

    var fullPage = d3.select('html')._groups[0][0];
    var relativePositioning = fullPage.clientWidth - tip.chartDiv._groups[0][0].clientWidth;

    if (relativePositioning > 10) {
         tip.toolTip.style("left", (event.target.getBBox().x + "px"));
         tip.toolTip.style("top", (event.target.getBBox().y + "px"));
    } else {
        if (leftOfMouse) {
            tip.toolTip.style("right", (tip.chartDiv._groups[0][0].clientWidth - event.offsetX + "px"));
        } else {
            tip.toolTip.style("left", (event.offsetX) + "px");
        }

        if (topOfMouse) {
            tip.toolTip.style("top", (event.offsetY) + "px");
        } else {
            tip.toolTip.style("bottom", (tip.chartDiv._groups[0][0].clientHeight - event.offsetY + "px"));
        }
    }

    if (dataObj.viz === 'heatmap') {
        tip.toolTip
            .style("width", "300px");
    }

    return tip.tooltip;
};

function generateSimpleHTML(dataObj) {
    var tooltipText;
    tooltipText = "<div><div class='title sm-left-margin xs-top-margin sm-right-margin'><b>" + dataObj.title + "</b></div><hr style='margin:3px 0 3px 0;'/>";

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);

        tooltipText += "<span class='semoss-d3-tip-content sm-right-margin'>" +
            "<div class='circleBase d3-tooltip-circle inline sm-right-margin sm-left-margin' style='background: " + dataObj.color[item] + "'>" +
            "</div>" + item + ": " + value + "</span><br/>";
    }
    tooltipText += "</div>";
    return tooltipText;
}

function generateSingleColorHTML(dataObj, dataTable) {
    var tooltipText,
        tooltipColor,
        showColorCircle = true,
        colorCircle = "";

    if (!!dataObj.color[dataObj.data[dataTable.series]]) {
        tooltipColor = dataObj.color[dataObj.data[dataTable.series]];
    }
    else if (!!dataObj.color[dataTable.label] && dataObj.viz !== 'singleaxis') {
        tooltipColor = dataObj.color[dataTable.label];
    }
    else {
        showColorCircle = false;
    }

    if (showColorCircle) {
        colorCircle = "<div class='circleBase d3-tooltip-circle inline sm-right-margin sm-left-margin' style='background: " + tooltipColor + "'>" +
            "</div>";
    }
    else {
        colorCircle = "<div class='inline smright margin sm-left-margin'>";
    }

    tooltipText =
        "<div class='inline'>" +
        colorCircle +
        "<div class='title xxs-left-margin xs-top-margin sm-right-margin inline'><b>" + dataObj.title + "</b>" +
        "</div>" +
        "<hr style='margin:3px 0 3px 0;'/>";

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);

        tooltipText += "<span class='semoss-d3-tip-content sm-left-margin sm-right-margin'>" +
            item + ": " + value + "</span><br/>";
    }
    tooltipText += "</div>";
    return tooltipText;
}

function generatePackHTML(dataObj) {
    var tooltipText;
    tooltipText = "<div class='inline'>" + "<div class='circleBase d3-tooltip-circle inline sm-right-margin sm-left-margin' style='background: " + dataObj.data.color + "'>" +
        "</div>" + "<div class='title xxs-left-margin xs-top-margin sm-right-margin inline'><b>" + dataObj.title + "</b></div><hr style='margin:3px 0 3px 0;'/>";

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);

        tooltipText += "<span class='semoss-d3-tip-content sm-left-margin sm-right-margin'>" +
            item + ": " + value + "</span><br/>";
    }
    tooltipText += "</div>";
    return tooltipText;
}

function generateHeatmapHTML(dataObj) {
    var tooltipText;
    tooltipText = "<div class='inline'>" + "<div class='circleBase d3-tooltip-circle inline sm-right-margin sm-left-margin' style='background: " + dataObj.color + "'>" +
        "</div>" + "<div class='title xxs-left-margin xs-top-margin sm-right-margin inline'><b>" + dataObj.title + "</b></div><hr style='margin:3px 0 3px 0;'/>";

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);

        tooltipText += "<span class='semoss-d3-tip-content sm-left-margin sm-right-margin'>" +
            item + ": " + value + "</span><br/>";
    }
    tooltipText += "</div>";
    return tooltipText;
}

function generatePieHTML(dataObj, dataTable) {
    var tooltipText;
    tooltipText = "<div class='inline'>" + "<div class='circleBase d3-tooltip-circle inline sm-right-margin sm-left-margin' style='background: " + dataObj.color[dataObj.data.label] + "'>" +
        "</div>" + "<div class='title xxs-left-margin xs-top-margin sm-right-margin inline'><b>" + dataObj.title + "</b></div><hr style='margin:3px 0 3px 0;'/>";

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);

        tooltipText += "<span class='semoss-d3-tip-content sm-left-margin sm-right-margin'>" +
            dataTable[item] + ": " + value + "</span><br/>";
    }
    tooltipText += "</div>";
    return tooltipText;
}

function generateSankeyHTML(dataObj) {
    var tooltipText;
    tooltipText = "<div class='inline'>" +
        "</div>" + "<div class='title xxs-left-margin xs-top-margin sm-right-margin inline'><b>" + dataObj.title + "</b></div><hr style='margin:3px 0 3px 0;'/>";

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);

        tooltipText += "<span class='semoss-d3-tip-content sm-left-margin sm-right-margin'>" +
            item + ": " + value + "</span><br/>";
    }
    tooltipText += "</div>";
    return tooltipText;
}

function formatValue(val) {
    if (!isNaN(val)) {
        var formatNumber = d3.format(",.0f");
        if (val >= 1000000) {
            //millions
            // var p = d3.precisionPrefix(1e5, 1.3e6);
            // formatNumber = d3.formatPrefix("." + p, 1.3e6);
            formatNumber = d3.format(",.2f");
        } else if (val <= 100) {
            //2 decimals
            formatNumber = d3.format(",.2f");
        }
        return formatNumber(val);
    }
    return val;
}

module.exports = jvTip;