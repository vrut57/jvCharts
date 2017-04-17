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

jvTip.prototype.showTip = function (event, transitionDuration = 100) {
    var tip = this;

    var left = 'auto',
        right = 'auto',
        top = 'auto',
        bottom = 'auto';

     //Logic to determine where tooltip will be placed on page
    var leftOfMouse = false,
        topOfMouse = false;
    if (event.offsetX > (tip.chartDiv._groups[0][0].clientWidth / 2)) {
        leftOfMouse = true
    }
    if (event.offsetY < (tip.chartDiv._groups[0][0].clientHeight / 2)) {
        topOfMouse = true;
    }

    var fullPage = d3.select('html')._groups[0][0];
    var relativePositioning = fullPage.clientWidth - tip.chartDiv._groups[0][0].clientWidth;

    if (relativePositioning > 10) {
         left = event.target.getBBox().x + "px";
         top = event.target.getBBox().y + "px";
    } else {
        if (leftOfMouse) {
            right = tip.chartDiv._groups[0][0].clientWidth - event.offsetX + "px";
        } else {
            left = event.offsetX + "px";
        }

        if (topOfMouse) {
            top = (event.offsetY) + "px";
        } else {
            bottom = tip.chartDiv._groups[0][0].clientHeight - event.offsetY + "px";
        }
    }

    var t = d3.transition()
        .duration(transitionDuration)
        .ease(d3.easeLinear);
    
    tip.toolTip
        .transition(t)
        .style("right", right)
        .style("left", left)
        .style("top",  top)
        .style("bottom", bottom)
        .style("display", "block")
        .style("opacity", 1);

    // if (dataObj.viz === 'heatmap') {
    //     tip.toolTip
    //         .style("width", "300px");
    // }
}

jvTip.prototype.hideTip = function () {
    var tip = this;
    var t = d3.transition()
        .duration('100')
        .ease(d3.easeLinear);
    if (tip.toolTip) {
        tip.toolTip.transition(t).style("display", "none");
    }
};

/************************************************  Declare jv tip components *******************************************************************************/
var jvHr = `<hr style='margin:3px 0 3px 0;'/>`;

function getValueContent(item, value, colorTile) {
    var valueString = value ? `: ${value}` : '';
    var colorTileString = colorTile ? colorTile : ''
    return `<span class='semoss-d3-tip-content jv-tip-side-margins'>${colorTileString}${item}${valueString}</span><br/>`;
}

function getTitleTemplate(dataObj) {
    return `<div class='title jv-top-margin jv-inline'><b>${dataObj.title}</b></div>${jvHr}`;
}

function getColorTile(color) {
    if(color) {
        return `<div class='d3-tooltip-circle jv-inline jv-tip-side-margins' style='background:${color}'></div>`;
    }
    return "<div class='jv-inline jv-tip-side-margins'>"
}


/************************************************* Viz Specific Functions **********************************************************************************/


jvTip.prototype.generateSimpleTip = function (dataObj, dataTable, event) {
    var tip = this;
   
    if(dataObj.hasOwnProperty('title') && dataObj.title === ''){
        dataObj.title = 'Empty'
    }

    tip.toolTip = tip.chartDiv.select(".tooltip")
        .html(function () {
            if (dataObj.viz === 'clusters' || dataObj.viz === 'circleviewplot' || dataObj.viz === 'scatterplot' || dataObj.viz === 'treemap' || dataObj.viz === 'singleaxis') {
                return generateSingleColorHTML(dataObj, dataTable);
            } else if (dataObj.viz === 'radial' || dataObj.viz === 'pie') {
                return generatePieHTML(dataObj, dataTable);
            } else if (dataObj.viz === 'circlepack' || dataObj.viz === 'sunburst') {
                return generatePackHTML(dataObj, dataTable);
            } else if (dataObj.viz === 'heatmap' || dataObj.viz === 'cloud') {
                return generateHeatmapHTML(dataObj, dataTable);
            } else if (dataObj.viz === 'sankey') {
                return generateSankeyHTML(dataObj, dataTable);
            }
            else {
                return generateSimpleHTML(dataObj, dataTable);
            }
        });

    if(event){
        tip.showTip(event, 0);
    }

    return tip.tooltip;
};

function generateSimpleHTML(dataObj) {
    var tooltipText;
    tooltipText = `<div><div class='title jv-tip-container jv-tip-side-margins jv-top-margin'><b>${dataObj.title}</b></div>${jvHr}`;

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);
        tooltipText += getValueContent(item, value, getColorTile(dataObj.color[item]));
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
        colorCircle = getColorTile(tooltipColor);
    }
    else {
        colorCircle = getColorTile();
    }

    tooltipText = `<div class='jv-inline'>${colorCircle}<div class='title jv-tip-side-margins jv-inline jv-top-margin'><b>${dataObj.title}</b></div>${jvHr}`;

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);
        tooltipText += getValueContent(item, value);
    }
    tooltipText += "</div>";
    return tooltipText;
}

function generatePackHTML(dataObj) {
    var tooltipText;
    tooltipText = `<div class='jv-inline'>
        ${getColorTile(dataObj.data.color)}
        ${getTitleTemplate(dataObj)}`;

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);
        tooltipText += getValueContent(item, value);
    }
    tooltipText += "</div>";
    return tooltipText;
}

function generateHeatmapHTML(dataObj) {
    var tooltipText;
    tooltipText = `<div class='jv-inline'>
        ${getColorTile(dataObj.color)}
        ${getTitleTemplate(dataObj)}`;

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);
        tooltipText += getValueContent(item, value);
    }
    tooltipText += "</div>";
    return tooltipText;
}

function generatePieHTML(dataObj, dataTable) {
    var tooltipText;
    tooltipText = `<div class='jv-inline'>
    ${getColorTile(dataObj.color[dataObj.data.label])}
    ${getTitleTemplate(dataObj)}`;

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);
        tooltipText += getValueContent(dataTable[item], value);
    }
    tooltipText += "</div>";
    return tooltipText;
}

function generateSankeyHTML(dataObj) {
    var tooltipText;
    tooltipText = `<div class='jv-inline'>${getTitleTemplate(dataObj)}`;

    for (var item in dataObj.tipData) {
        var value = formatValue(dataObj.tipData[item]);
        tooltipText += getValueContent(item, value);
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