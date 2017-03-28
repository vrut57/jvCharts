'use strict';
var jvCharts = require('./jvCharts.js');

jvCharts.prototype.getDefaultOptions = getDefaultOptions;

function getDefaultOptions(userOptions = {}) {
    console.log(userOptions);
    var _vars = {};

    //General Styles/Attributes
    //colors
    _vars.gray = "#cccccc";
    _vars.white = '#FFFFFF';
    _vars.black = '#000000';
    _vars.backgroundColor = 'none';
    _vars.strokeWidth = "2px";
    
    _vars.thresholds = 'none'; //if not none, expected to be an array
    _vars.thresholdLegend = false;

    //Action Attributes
    _vars.highlightBorderColor = _vars.black;
    _vars.highlightBorderWidth = "2px";

    //Component Specific Styles/Attributes
    _vars.axisColor = _vars.gray;
    _vars.axisWidth = _vars.strokeWidth;
    _vars.displayValues = false;
    _vars.toggleLegend = false;
    _vars.legendMax = 9;
    _vars.gridSize = 12;
    _vars.xReversed = false;
    _vars.yReversed = false;

    //font styles
    _vars.fontSize = '12px';
    _vars.fontColor = _vars.black;
    _vars.xLabelFontSize = 'none';
    _vars.yLabelFontSize = 'none';

    //Heatmap Specific Styles/Attributes
    _vars.color = "#ff0000";
    _vars.toggleLegend = false;
    _vars.buckets = "10";
    _vars.colorLabel = 'none';
    _vars.min = "0";
    _vars.max = "10";
    _vars.domainArray = "";
    _vars.step = "1";
    _vars.quantiles = true;
    _vars.heatLegendSpacing = 2;
    _vars.heatGridSize = 20;
    _vars.colors = [
      "#fbf2d2",
      "#fdedb5",
      "#fee7a0",
      "#ffda84",
      "#ffc665",
      "#feb44e",
      "#fea743",
      "#fd9b3f",
      "#fd8c3c",
      "#fd7735",
      "#fd602f",
      "#fb4b29",
      "#f43723",
      "#ea241e",
      "#e0161c",
      "#d60b20",
      "#c80324",
      "#b10026",
      "#870025",
      "#620023"
    ];

    //pie specific
    _vars.pieBorder = _vars.white;
    _vars.emptyLegendSquare = _vars.white;


    //add user options
    for(var key in userOptions) {
        if(userOptions.hasOwnProperty(key)){
            _vars[key] = userOptions[key];
        }
    }
    return _vars;
}
