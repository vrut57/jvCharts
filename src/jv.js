'use strict';
//purpose of this file is to attach jv charts objects to the window

var jvCharts = require('./jvCharts.js');
jvCharts = require('./visuals/jvLine.js');
jvCharts = require('./visuals/jvBar.js');
jvCharts = require('./visuals/jvPie.js');

window.jvCharts = jvCharts;