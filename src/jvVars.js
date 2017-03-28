'use strict';
var jvCharts = require('./jvCharts.js');

jvCharts.prototype.getDefaultOptions = getDefaultOptions;

function getDefaultOptions(userOptions = {}) {
    console.log(userOptions);
    var _vars = {};

    //General Styles/Attributes
    _vars.gray = "#cccccc";
    _vars.strokeWidth = "2px";
    _vars.black = "#000000";
    _vars.backgroundColor = 'none';
    _vars.fontSize = '12px';
    _vars.thresholds = 'none'; //if not none, expected to be an array
    _vars.thresholdLegend = false;

    //Component Specific Styles/Attributes
    _vars.axisColor = _vars.gray;
    _vars.axisWidth = _vars.strokeWidth;
    _vars.displayValues = false;
    _vars.toggleLegend = false;
    _vars.legendMax = 9;
    _vars.gridSize = 12;
    _vars.xReversed = false;
    _vars.yReversed = false;

    _vars.xLabelFontSize = 'none';
    _vars.yLabelFontSize = 'none';

    
    for(var key in userOptions) {
        if(userOptions.hasOwnProperty(key)){
            _vars[key] = userOptions[key];
        }
    }
    return _vars;
}
