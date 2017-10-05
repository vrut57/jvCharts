'use strict';
//add all required files
import 'jvVars.js';
import 'jvEvents.js';
import 'jvTip.js';
import 'jvBrush.js';
import 'jvComment.js';
import 'jvEdit.js';
import 'visuals/jvBar.js';
import 'visuals/jvPie.js';
import 'visuals/jvLine.js';
import 'visuals/jvScatter.js';
import 'visuals/jvArea.js';
import 'visuals/jvGantt.js';
import 'visuals/jvHeatmap.js';
import 'visuals/jvPack.js';
import 'visuals/jvRadial.js';
import 'visuals/jvSankey.js';
import 'visuals/jvSingleAxis.js';
import 'visuals/jvSunburst.js';
import 'visuals/jvTreemap.js';
import 'visuals/jvWordCloud.js';
import 'visuals/jvBoxWhisker.js';
import 'visuals/jvBubble.js';
import 'visuals/jvClustergram.js';

//attach jv charts objects to the window
import jvCharts from 'jvCharts.js';
import jvBrush from 'jvBrush.js';
import jvComment from 'jvComment.js';
import jvEdit from 'jvEdit.js';
import jvSelect from 'jvSelect';
//import jvDoodle from 'jvDoodle.js';

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
