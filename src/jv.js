'use strict';
//purpose of this file is to attach jv charts objects to the window

var jvCharts = require('./jvCharts.js');
var jvBrush = require('./jvBrush.js');
var jvComment = require('./jvComment.js');
var jvEdit = require('./jvEdit.js');
var jvSelect = require('./jvSelect');

window.jvCharts = jvCharts;
window.jvBrush = jvBrush;
window.jvComment = jvComment;
window.jvEdit = jvEdit;
window.jvSelect = jvSelect;
