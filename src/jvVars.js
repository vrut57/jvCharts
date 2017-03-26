'use strict';
var jvCharts = require('./jvCharts.js');

jvCharts.prototype.getDefaultOptions = getDefaultOptions;

function getDefaultOptions() {
    var options = {};

    //General Styles/Attributes
    options.gray = "#cccccc";
    options.strokeWidth = "2px";
    options.black = "#000000";


    //Component Specific Styles/Attributes
    options.axisColor = options.gray;
    options.axisWidth = options.strokeWidth;


    return options;
}
