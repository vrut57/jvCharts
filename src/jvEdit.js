 var editTemplate = require('./editOptionsTemplate.js');

/***  jvEdit ***/
function jvEdit(configObj) {
    "use strict";
    var editObj = this;
    editObj.chartDiv = configObj.chartDiv;
    editObj.editOptions = '';
    editObj.vizOptions = configObj.vizOptions ? configObj.vizOptions : {};
    editObj.fontSizeIncrement = 0;
    editObj.disabled = false;
    editObj.chartDiv.selectAll('.edit-div').remove();
    editObj.editDiv = editObj.chartDiv.append('div').attr('class', 'edit-div semoss-d3-tip absolute');
    editObj.applyAllEdits();
    editObj.saveVizOptions = configObj.saveVizOptionsFunction;
    editObj.toggleEditMode = function (toggleBool) {
        var entireSvg = editObj.chartDiv.select("svg");
        if (toggleBool) {
            entireSvg.selectAll(".event-rect")
                .attr("display", "none");
            entireSvg.on('click', function () {
                //edit mode events
                //going to be mouseover to highlight options for whatever piece you hover over
                var classText = d3.select(d3.event.target).attr('class');
                if (classText) {
                    if (classText.indexOf('editable') >= 0) {
                        editObj.displayEdit(this, classText);
                    }
                }
            });
            entireSvg.selectAll('.editable').classed('pointer', true);
            entireSvg.on('dblclick', false);
        } else {
            editObj.removeEdit();
            entireSvg.selectAll('.editable').classed('pointer', false);
            entireSvg.selectAll(".event-rect")
                .attr("display", "block");
        }
    }
}


/********************************************* All Edit Mode Functions **************************************************/

/** displayEdit
 *
 * Displays the edit div, grabbing it from the template
 *
 */
jvEdit.prototype.displayEdit = function (event, options) {
    var editObj = this;

    //return if you click on the same element twice, no need to display a second edit div if the current one is still open
    if (editObj.editOptions === options) {
        return;
    }
    editObj.editDiv.html('');
    editObj.editOptions = options;
    var mouseX = d3.mouse(event)[0],
        mouseY = d3.mouse(event)[1];


    //assign html to editDiv (basically displays the div)
    editObj.editDiv.html(editTemplate);

    //optionValues - an array of strings.
    //      String is the id to the element in the editDiv form.
    //      This string contains the specific option that is being changed

    //itemToChange
    //      String that is the class of the svg element to be changed on the viz itself


    var optionValues = [],
        itemToChange = '',
        editOptionElement = editObj.editDiv.select("#edit-option-element");

    //if statements to determine which edit options to display
    if (options.indexOf('editable-yAxis') >= 0) {
        editOptionElement.html('&nbsp;for Y Axis');
        editOptionElement.style('visibility', 'visible');
        itemToChange = 'yAxis';
    } else if (options.indexOf('editable-xAxis') >= 0) {
        editOptionElement.html('&nbsp;for X Axis');
        editOptionElement.style('visibility', 'visible');
        itemToChange = 'xAxis';
    } else if (options.indexOf('yLabel') >= 0) {
        editOptionElement.html('&nbsp;for Y Label');
        editOptionElement.style('visibility', 'visible');
        itemToChange = 'yLabel';
    } else if (options.indexOf('xLabel') >= 0) {
        editOptionElement.html('&nbsp;for X Label');
        editOptionElement.style('visibility', 'visible');
        itemToChange = 'xLabel';
    } else if (options.indexOf('legendText') >= 0) {
        editOptionElement.html('&nbsp;for Legend Item');
        editOptionElement.style('visibility', 'visible');
        itemToChange = options.substring(options.indexOf('editable-legend-')).split(' ')[0];
    } else if (options.indexOf('editable-bar') >= 0) {
        editOptionElement.html('&nbsp;for Bar Chart');
        editOptionElement.style('visibility', 'visible');
        editObj.editDiv.select(".editable-bar").style('display', 'block');
        optionValues.push('editable-bar');
        itemToChange = options.substring(options.indexOf('bar-col-')).split(' ')[0];
    } else if (options.indexOf('editable-pie') >= 0) {
        editOptionElement.html('&nbsp;for Pie Slice');
        editOptionElement.style('visibility', 'visible');
        editObj.editDiv.select(".editable-pie").style('display', 'block');
        optionValues.push('editable-pie');
        itemToChange = options.substring(options.indexOf('pie-slice-')).split(' ')[0];
    } else if (options.indexOf('editable-scatter') >= 0) {
        editOptionElement.html('&nbsp;for Scatter Plot');
        editOptionElement.style('visibility', 'visible');
        editObj.editDiv.select(".editable-scatter").style('display', 'block');
        optionValues.push('editable-scatter');
        itemToChange = options.substring(options.indexOf('scatter-circle-')).split(' ')[0];
    }
    else if (options.indexOf('editable-svg') >= 0) {
        editOptionElement.html('&nbsp;for All Text');
        editOptionElement.style('visibility', 'visible');
        editObj.editDiv.select(".editable-text-size-buttons").style('display', 'block');
        //editObj.editDiv.select(".editable-default-and-apply").style('display', 'none');
        optionValues.push('editable-text-size');
        itemToChange = 'svg';
    }
    else {
        console.log("Still need to add option to display edit");
    }

    if (options.indexOf('editable-num') >= 0) {
        editObj.editDiv.select(".editable-num-format").style('display', 'block');
        optionValues.push('editable-num-format');
    }
    if (options.indexOf('editable-text') >= 0) {
        editObj.editDiv.select(".editable-text-color").style('display', 'block');
        optionValues.push('editable-text-color');
        editObj.editDiv.select(".editable-text-size").style('display', 'block');
        optionValues.push('editable-text-size');
    }
    if (options.indexOf('editable-content') >= 0) {
        editObj.editDiv.select(".editable-content").style('display', 'block');
        optionValues.push('editable-content');
    }

    //populate edit div with initial values
    if (editObj.vizOptions[itemToChange]) {
        populateSelectionsEditMode(editObj.editDiv, editObj.vizOptions[itemToChange]);
    }
    editObj.editDiv
        .style('display', 'block')
        .style("left", 0 + 'px')
        .style("top", 0 + 'px');

    //calculate position of overlay div
    var editHeight = parseFloat(editObj.editDiv.style('height')),
        editWidth = parseFloat(editObj.editDiv.style('width')),
        position = editObj.overlayDivPosition(editWidth, editHeight, mouseX, mouseY);

    //show the new edit div
    editObj.editDiv
        .style("left", position.x + 'px')
        .style("top", position.y + 'px');

    //add submit, default, and exit listeners to the div
    editObj.editDiv.select('#submitEditMode').on("click", function () {
        submitEditMode(editObj, optionValues, itemToChange);
        editObj.removeEdit();
    });
    editObj.editDiv.select('#submitEditModeDefault').on("click", function () {
        submitEditMode(editObj, optionValues, itemToChange, true);
        editObj.removeEdit();
    });
    editObj.editDiv.select('#exitEditMode').on("click", function () {
        editObj.removeEdit();
    });
    editObj.fontSizeIncrement = 0;
    //Adding click events for increase/decrease font size buttons
    editObj.editDiv.select("#increaseFontSize").on("click", function () {
        editObj.increaseFontSize();
    });
    editObj.editDiv.select("#decreaseFontSize").on("click", function () {
        editObj.decreaseFontSize();
    });
};

/** increaseFontSize
 *
 * Increases the font size by 1 when increased via edit options for all text
 *
 */
jvEdit.prototype.increaseFontSize = function () {
    var editObj = this,
        fontIncrement = 1,
        maxSize = 28;
    if(editObj.fontSizeIncrement < maxSize) {
        editObj.changeFontSize(fontIncrement);
        editObj.fontSizeIncrement++;
        editObj.vizOptions["text"] = {'editable-text-increment': editObj.fontSizeIncrement};
    }
};

/** decreaseFontSize
 *
 * Decreases the font size by 1 when decreased via edit options for all text
 *
 */
jvEdit.prototype.decreaseFontSize = function () {
    var editObj = this,
        fontDecrement = -1,
        minSize = -12;
    //min size is neg 12 because default size is 12px on our charts
    if(editObj.fontSizeIncrement > minSize) {
        editObj.changeFontSize(fontDecrement);
        editObj.fontSizeIncrement--;
        editObj.vizOptions["text"] = {'editable-text-increment': editObj.fontSizeIncrement};
    }
};

/** changeFontSize
 *
 * Increases or decreases font size by a certain increment
 *
 */
jvEdit.prototype.changeFontSize = function (increment) {
    var editObj = this,
        newSize;

    editObj.chartDiv.selectAll('text').each(function (d, i) {
        var thisDiv = this,
            textSize = 12;
        if (thisDiv.getAttribute('font-size')) {
            textSize = thisDiv.getAttribute('font-size');
        }
        newSize = parseInt(textSize) + increment;
        thisDiv.setAttribute('font-size', newSize);
    });
};


/** populateSelectionsEditMode
 *
 * Initially populates the editDiv if there are vizOptions
 *
 */
function populateSelectionsEditMode(editDiv, vizOptions) {
    for (var option in vizOptions) {
        if (vizOptions.hasOwnProperty(option)) {
            var selectedObject = editDiv.select('#' + option)._groups[0][0];
            //default color inputs to gray
            if (vizOptions[option] === 'default') {
                if (selectedObject.type === 'color') {
                    if (selectedObject.id.indexOf('text') > 0) {
                        selectedObject.value = '#000000';
                    } else {
                        selectedObject.value = '#aaaaaa';
                    }
                }
            } else {
                selectedObject.value = vizOptions[option];
            }
        }
    }
}

/** submitEditMode
 *
 *
 */
function submitEditMode(editObj, optionValues, itemToChange, defaultBtnClicked) {
    var optionArray = optionValues,
        selectedEditOptions = {},
        editValue,
        selectedObj;

    for (var i = 0; i < optionArray.length; i++) {
        if (optionArray[i].indexOf('editable-legend') > 0) {
            //change item to change for legend elements
            itemToChange = optionArray[i];
        }
        selectedObj = editObj.editDiv.select('#' + optionArray[i]);
        //see if selected object exists
        if (selectedObj && selectedObj._groups[0] && selectedObj._groups[0][0]) {
            editValue = selectedObj._groups[0][0].value;
            //get selected option from edit div
            if (optionArray[i] === 'editable-content' && editValue === '') {
                //dont add an empty string to the viz options for editable content
                break;
            }
            selectedEditOptions[optionArray[i]] = editValue;
            if ((!selectedEditOptions[optionArray[i]]) && optionArray[i].indexOf('content') < 0) {
                selectedEditOptions[optionArray[i]] = 'default';
            }
        }
    }

    if(defaultBtnClicked){
        if(itemToChange === 'svg') {
            delete editObj.vizOptions['text'];
        }
        delete editObj.vizOptions[itemToChange];
    } else {
        editObj.vizOptions[itemToChange] = selectedEditOptions;
    }

    if(itemToChange === 'svg') {
        delete editObj.vizOptions['svg'];
    }

    //save vizOptions
    editObj.saveVizOptions(editObj.vizOptions);
}


jvEdit.prototype.applyEditMode = function (itemToChange, options) {
    var editObj = this;
    var object = editObj.chartDiv.select("." + itemToChange);
    var objectGroups = object._groups;
    var objectTagName = objectGroups[0][0] ? objectGroups[0][0].tagName.toLowerCase() : null;

    if (itemToChange === 'text') {
        //do something if it is all the text that is being changed
        object = editObj.chartDiv.selectAll("text");
    }

    //options by tagName
    if (objectTagName === 'g') {
        object = editObj.chartDiv.select("." + itemToChange).selectAll('text');
    } else if (objectTagName === 'rect') {
        if (options['editable-bar']) {
            object.attr('fill', options['editable-bar']);
        }
    } else if (objectTagName === 'circle') {
        if (options['editable-scatter']) {
            object.attr('fill', options['editable-scatter']);
        }
    } else if (objectTagName === 'path') {
        if (options['editable-pie']) {
            object.attr('fill', options['editable-pie']);
        }
    }

    //standard options
    //If a text increment exists, apply it based on the sign of the variable
    if (options.hasOwnProperty('editable-text-increment')) {
        editObj.changeFontSize(options['editable-text-increment']);
    }
    if (options.hasOwnProperty('editable-text-size')) {
        object.style('font-size', options['editable-text-size']);
    }
    if (options.hasOwnProperty('editable-text-color')) {
        object.style('fill', options['editable-text-color']);
    }
    if (options.hasOwnProperty('editable-num-format')) {
        var expression = getFormatExpression(options['editable-num-format']);
        object
            .transition()
            .text(function (d) {
                if (!isNaN(d) && typeof expression === 'function') {
                    return (expression(d));
                }
                return d;
            });
    }
    if (options.hasOwnProperty('editable-content')) {
        if (options['editable-content'].length > 0) {
            object.html(options['editable-content']);
        }
    }
    editObj.removeEdit();
};

jvEdit.prototype.applyAllEdits = function () {
    var editObj = this;

    for (var option in editObj.vizOptions) {
        if (editObj.vizOptions.hasOwnProperty(option) && editObj.chartDiv.select(option)) {
            editObj.applyEditMode(option, editObj.vizOptions[option]);
        }
    }
};

jvEdit.prototype.removeEdit = function () {
    var editObj = this;
    if (editObj.editDiv) {
        editObj.editDiv.html('');
        editObj.editDiv
            .style('display', 'none');
    }
    editObj.editOptions = '';
};


/******************************* Utility functions **********************************************/

jvEdit.prototype.overlayDivPosition = function (divWidth, divHeight, mouseX, mouseY) {
    var editObj = this;
    var position = {};
    if (mouseX > (parseInt(editObj.chartDiv.style('width'))) / 2) {
        position.x = mouseX - divWidth;
    } else {
        position.x = mouseX;
    }
    if (mouseY - divHeight - 10 > 0) {
        position.y = mouseY - divHeight - 10;
    } else {
        position.y = mouseY + 10;
    }
    return position;
};

/** getFormatExpression
 *
 * @desc returns the d3 format expression for a given option
 * @params option
 * @returns string expression
 */
function getFormatExpression(option) {
    var expression = '';
    if (option === "currency") {
        expression = d3.format("$,");
    }
    if (option === "fixedCurrency") {
        expression = d3.format("($.2f");
    }
    if (option === "percent") {
        var p = Math.max(0, d3.precisionFixed(0.05) - 2);
        expression = d3.format("." + p + "%");
    }
    if (option === "millions") {
        var p = d3.precisionPrefix(1e5, 1.3e6);
        expression = d3.formatPrefix("." + p, 1.3e6);
    }
    if (option === 'commas') {
        expression = d3.format(",.0f");
    }
    if (option === 'none' || option === '') {
        expression = d3.format("");
    }

    return expression;
}

function getYAxisLabelWidth(textSize){

}

module.exports = jvEdit;
