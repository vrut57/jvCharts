'use strict';
//add all required files
require('./jvVars.js');
require('./jvTip.js');
require('./jvBrush.js');
require('./jvComment.js');
require('./jvEdit.js');
require('./visuals/jvBar.js');
require('./visuals/jvPie.js');
require('./visuals/jvLine.js');
require('./visuals/jvScatter.js');
require('./visuals/jvArea.js');
require('./visuals/jvGantt.js');
require('./visuals/jvHeatmap.js');
require('./visuals/jvPack.js');
require('./visuals/jvRadial.js');
require('./visuals/jvSankey.js');
require('./visuals/jvSingleAxis.js');
require('./visuals/jvSunburst.js');
require('./visuals/jvTreemap.js');
require('./visuals/jvWordCloud.js');

//attach jv charts objects to the window
var jvCharts = require('./jvCharts.js');
var jvBrush = require('./jvBrush.js');
var jvComment = require('./jvComment.js');
var jvEdit = require('./jvEdit.js');
var jvSelect = require('./jvSelect');

//Comment out to remove from window object - if you are not using jvCharts as a minified file
window.jvCharts = jvCharts;
window.jvBrush = jvBrush;
window.jvComment = jvComment;
window.jvEdit = jvEdit;
window.jvSelect = jvSelect;
