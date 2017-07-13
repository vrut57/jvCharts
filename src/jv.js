'use strict';
//add all required files
require('./jvVars.js');
require('./jvEvents.js');
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
require('./visuals/jvBoxWhisker.js');
require('./visuals/jvBubble.js');
require('./visuals/jvClustergram.js');

//attach jv charts objects to the window
var jvCharts = require('./jvCharts.js');
var jvBrush = require('./jvBrush.js');
var jvComment = require('./jvComment.js');
var jvEdit = require('./jvEdit.js');
var jvSelect = require('./jvSelect');
// var jvDoodle = require('./jvDoodle.js');

//Comment out to remove from window object - if you are not using jvCharts as a minified file
window.jvCharts = jvCharts;
window.jvBrush = jvBrush;
window.jvComment = jvComment;
window.jvEdit = jvEdit;
window.jvSelect = jvSelect;


//add polyfill for Object.assign() if unsupported
if (typeof Object.assign !== 'function') {
    Object.assign = function (target) { //.length of function is 2
        'use strict';
        if (target == null) { //TypeError if undefined or null
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource != null) { //Skip over if undefined or null
                for (var nextKey in nextSource) {
                    //Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}
