/***  jvTip ***/

function jvTip(configObj) {
    "use strict";
    var tip = this,
        defaultConfig = {
            type: 'simple'
        };

    tip.tipConfig = configObj.tipConfig || defaultConfig;
    tip.chartDiv = configObj.chartDiv;

    //Create initial div
    tip.chartDiv.select('.jv-tooltip').remove();

    tip.chartDiv.append("div")
        .attr("class", "tooltip jv-tooltip")
        .style("pointer-events", "none");
}

jvTip.prototype.showTip = function (transitionDuration = 50) {
    var tip = this;
    var left = 'auto',
        top = 'auto',
        mouse = d3.mouse(tip.chartDiv.node());

    //Logic to determine where tooltip will be placed on page
    var leftOfMouse = mouse[0] > (tip.chartDiv._groups[0][0].clientWidth / 2),
        topOfMouse = mouse[1] < (tip.chartDiv._groups[0][0].clientHeight / 2),
        tooltipHeight = tip.toolTip._groups[0][0].clientHeight === 0 ? 75 : tip.toolTip._groups[0][0].clientHeight,
        tooltipWidth = tip.toolTip._groups[0][0].clientWidth;

    if (leftOfMouse) {
        if (tooltipWidth === 0) {
            tooltipWidth = 250;
        }
        left = mouse[0] - tooltipWidth;
    } else {
        left = mouse[0];
    }
    if (topOfMouse) {
        top = mouse[1];
    } else {
        if (tooltipHeight === 0) {
            tooltipHeight = 75;
        }
        top = mouse[1] - tooltipHeight;
    }

    if (!leftOfMouse && topOfMouse) {
        left = mouse[0] + 13;
    }


    //COOL CURSOR, a function of the height and width of the container
    // var container = tip.chartDiv.select('.bar-container').node().getBoundingClientRect();
    // svgMouse = d3.mouse(tip.chartDiv.select('.bar-container').node());

    // var tooltipHeight = tip.toolTip._groups[0][0].clientHeight === 0 ? 75 : tip.toolTip._groups[0][0].clientHeight;
    // top = mouse[1] - (tooltipHeight * svgMouse[1] / container.height);

    // var tooltipWidth = tip.toolTip._groups[0][0].clientWidth;
    // left = mouse[0] - (tooltipWidth * svgMouse[0] / container.width);

    //STICKY CURSOR IN THE BOTTOM RIGHT
    // top = mouse[1];
    // left = mouse[0];
    //set max left
    // if(left > container.width - tooltipWidth + container.left) {
    //     left = container.width - tooltipWidth + container.left;
    // }

    // //set max top
    // if (top > container.height - tooltipHeight + container.top) {
    //     top = container.height - tooltipHeight + container.top;
    // }


    var t = d3.transition()
        .duration(transitionDuration)
        .ease(d3.easeLinear);

    tip.toolTip
        .transition(t)
        .style("left", left + 'px')
        .style("top",  top + 'px')
        .style("display", "block")
        .style("opacity", 1);
};

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


jvTip.prototype.generateSimpleTip = function (dataObj, dataTable) {
    var tip = this;
    var tooltipHtml = '';
   
    if (dataObj.hasOwnProperty('title') && dataObj.title === '') {
        dataObj.title = 'Empty';
    }

    if (dataObj.viz === 'clusters' || dataObj.viz === 'circleviewplot' || dataObj.viz === 'scatterplot' || dataObj.viz === 'treemap' || dataObj.viz === 'singleaxis') {
        tooltipHtml = generateSingleColorHTML(dataObj, dataTable);
    } else if (dataObj.viz === 'radial' || dataObj.viz === 'pie') {
        tooltipHtml = generatePieHTML(dataObj, dataTable);
    } else if (dataObj.viz === 'circlepack' || dataObj.viz === 'sunburst') {
        tooltipHtml = generatePackHTML(dataObj, dataTable);
    } else if (dataObj.viz === 'heatmap' || dataObj.viz === 'cloud') {
        tooltipHtml = generateHeatmapHTML(dataObj, dataTable);
    } else if (dataObj.viz === 'sankey') {
        tooltipHtml = generateSankeyHTML(dataObj, dataTable);
    } else if (dataObj.viz === 'bubble') {
        tooltipHtml = generateBubbleHTML(dataObj);
    } else if (dataObj.viz === 'boxwhisker') {
        tooltipHtml = generateBoxHTML(dataObj);
    }  else if (dataObj.viz === 'clustergram') {
        tooltipHtml = generateClustergramHTML(dataObj);
    }  else {
        tooltipHtml = generateSimpleHTML(dataObj, dataTable);
    }

    //add content to tooltip
    tip.toolTip = tip.chartDiv.select(".tooltip")
        .html(tooltipHtml);

    //paint the tooltip
    tip.showTip(0);

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

function generateBubbleHTML(dataObj) {
    var tooltipText;
    tooltipText = `<div class='jv-inline'>
        ${getColorTile(dataObj.data.color)}
        ${getTitleTemplate(dataObj)}`;

    for (var item in dataObj.tipData) {
        if (item === 'color') {
            continue;
        }
        var value = formatValue(dataObj.tipData[item]);
        tooltipText += getValueContent(item, value);
    }
    tooltipText += '</div>';
    return tooltipText;
}

function generateBoxHTML(dataObj) {
    let tooltipText;
    tooltipText = '<div class="jv-inline">';

    for (let item in dataObj.tipData) {
        if (dataObj.tipData.hasOwnProperty(item)) {
            let value    = formatValue(dataObj.tipData[item]);
            tooltipText += getValueContent(item, value);
        }
    }
    tooltipText += '</div>';
    return tooltipText;
}

function generateHeatmapHTML(dataObj) {
    var tooltipText;
    if (dataObj.xAxisCat) {
        tooltipText = `<div class='jv-inline'>
            ${getColorTile(dataObj.color)}` + 
            "<div class='title jv-top-margin jv-inline'><b>" + dataObj.data.xAxisName + "</b></div><hr style='margin:3px 0 3px 0;'/>";

        tooltipText += "<span class='semoss-d3-tip-content jv-tip-side-margins'>" + dataObj.xAxisCat + "</span><br/>"
        tooltipText += "</div>";
        return tooltipText;
    } else if(dataObj.yAxisCat) {
        tooltipText = `<div class='jv-inline'>
            ${getColorTile(dataObj.color)}` + 
            "<div class='title jv-top-margin jv-inline'><b>" + dataObj.data.yAxisName + "</b></div><hr style='margin:3px 0 3px 0;'/>";

        tooltipText += "<span class='semoss-d3-tip-content jv-tip-side-margins'>" + dataObj.yAxisCat + "</span><br/>"
        tooltipText += "</div>";
        return tooltipText;
    } else {
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
}

function generateClustergramHTML(dataObj) {
    var tooltipText;

    dataObj.title = dataObj.title.replace(/_/g," ");

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
        tooltipText += getValueContent(dataObj.valueName, value);
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