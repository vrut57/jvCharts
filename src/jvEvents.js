/***jvEvents
 * Eventing layer on top of JV Charts to allow custom callbacks to be attached to mouse events
 */
'use strict';

var jvCharts = require('./jvCharts.js'),
    jvComment = require('./jvComment.js'),
    jvEdit = require('./jvEdit.js'),
    jvBrush = require('./jvBrush.js');

jvCharts.prototype.initializeModes = initializeModes;
jvCharts.prototype.createDefaultMode = createDefaultMode;
jvCharts.prototype.createCommentMode = createCommentMode;
jvCharts.prototype.createEditMode = createEditMode;
jvCharts.prototype.createBrushMode = createBrushMode;
jvCharts.prototype.createSelectMode = createSelectMode;
jvCharts.prototype.toggleModes = toggleModes;
jvCharts.prototype.toggleDefaultMode = toggleDefaultMode;
jvCharts.prototype.toggleCommentMode = toggleCommentMode;
jvCharts.prototype.toggleEditMode = toggleEditMode;
jvCharts.prototype.toggleBrushMode = toggleBrushMode;
jvCharts.prototype.toggleSelectMode = toggleSelectMode;
jvCharts.prototype.addBrushEvents = addBrushEvents;

/**
* @name initializeModes
* @desc function that initializes and creates the chart toolbar
* @return {undefined} - no return
*/
function initializeModes() {
    let chart = this,
        callbacks = chart.config.callbacks;

    //check if callbacks are needed
    if (callbacks) {
        for (let mode in callbacks) {
            //loop through all the types of modes to initialize the mode and register the appropriate events
            if (callbacks.hasOwnProperty(mode) && callbacks[mode]) {
                let camelCaseMode = mode.charAt(0).toUpperCase() + mode.slice(1);
                chart[mode] = chart['create' + camelCaseMode]();
            }
        }
        if (chart.editMode) {
            chart.editMode.applyAllEdits();
        }
        chart.toggleModes(chart.mode);
    } else {
        chart.createDefaultMode();
        //user has not defined any other modes, so just use default mode
        chart.toggleDefaultMode('default-mode');
    }
}

/**
* @name createDefaultMode
* @desc function that initializes and creates the default mode
* @return {undefined} - no return
*/
function createDefaultMode() {
    let chart = this;
    if (chart.config.callbacks && chart.config.callbacks.defaultMode.onBrush) {
        chart.brushMode = chart.createBrushMode(chart.config.callbacks.defaultMode.onBrush);
    }
}

/**
* @name createCommentMode
* @desc function that initializes and creates the comment mode
* @return {jvComment} - created comment mode
*/
function createCommentMode() {
    let chart = this;
    return new jvComment({
        chartDiv: chart.chartDiv,
        comments: chart.config.comments || {},
        onSaveCallback: chart.config.callbacks.commentMode.onSave,
        getMode: function () {
            return chart.mode;
        }
    });
}

/**
* @name createEditMode
* @desc function that initializes and creates the edit mode
* @return {jvEdit} - created edit mode object
*/
function createEditMode() {
    let chart = this;
    return new jvEdit({
        chartDiv: chart.chartDiv,
        vizOptions: chart.config.editOptions || {},
        onSaveCallback: chart.config.callbacks.editMode.onSave
    });
}

/**
* @name createBrushMode
* @desc function that initializes and creates the brush mode
* @param {function} callbackParam - function that is an optional callback for brush mode
* @return {jvBrush} - created brush mode object
*/
function createBrushMode(callbackParam) {
    let chart = this,
        callback = callbackParam;
    if (!callback) {
        if (chart.config.callbacks.brushMode && typeof chart.config.callbacks.brushMode.onBrush === 'function') {
            callback = chart.config.callbacks.brushMode.onBrush;
        } else {
            console.log('no brush callback, pass it into the callbacks option');
            return null;
        }
    }
    return new jvBrush({
        chartDiv: chart.chartDiv,
        jvChart: chart,
        onBrushCallback: callback
    });
}

/**
* @name createSelectMode
* @desc function that initializes and creates the select mode
* @return {boolean} - true since the creation of a mode is only called when callbacks for the mode exist
*/
function createSelectMode() {
    return true;
}

/**
* @name toggleModes
* @desc sets the correct events for the specific mode param
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleModes(mode) {
    let chart = this;
    chart.toggleDefaultMode(mode);
    chart.commentMode && chart.toggleCommentMode(mode);
    chart.editMode && chart.toggleEditMode(mode);
    chart.brushMode && chart.toggleBrushMode(mode);
    chart.selectMode && chart.toggleSelectMode(mode);
}

/**
* @name toggleDefaultMode
* @desc updates event listeners for default mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleDefaultMode(mode) {
    let chart = this;
    if (mode === 'default-mode') {
        let defaultMode = chart.config.callbacks ? chart.config.callbacks.defaultMode : false,
            entireSvg = chart.chartDiv.select('svg'),
            callbacks;
        //change cursor and show tooltips
        chart.chartDiv.style('cursor', 'default');
        chart.showToolTip = true;

        //return if no callbacks exist
        if (!defaultMode) {
            return;
        }
        callbacks = {
            onDoubleClick: (event, mouse) => {
                if (typeof defaultMode.onDoubleClick === 'function') {
                    defaultMode.onDoubleClick(getEventObj(event, mouse, chart, 'doubleClick'));
                }
            },
            onClick: (event, mouse) => {
                if (typeof defaultMode.onClick === 'function') {
                    defaultMode.onClick(getEventObj(event, mouse, chart, 'click'));
                }
            },
            onHover: (event, mouse) => {
                defaultMode.onHover(getEventObj(event, mouse, chart, 'onHover'));
            },
            offHover: (event, mouse) => {
                defaultMode.offHover(getEventObj(event, mouse, chart, 'offHover'));
            },
            onKeyPress: () => {
                let e = d3.event;
                defaultMode.onKeyPress({
                    eventType: 'onKeyPress',
                    key: e.key,
                    event: e,
                    keyCode: e.keyCode
                });
            }
        };

        if (defaultMode.onBrush && chart.brushMode) {
            callbacks.mousedown = addBrushMousedown.bind(chart);
            callbacks.mouseup = () => {
                chart.chartDiv.select('svg').on('mousemove', false);
                chart.chartDiv.select('svg').style('cursor', 'default');
                chart.brushMode.removeBrush();
            };
        }
        registerClickEvents(entireSvg, callbacks, chart.config.currentEvent);
    } else {
        //remove tooltips and any highlights
        chart.showToolTip = false;
        chart.removeHighlight();
    }
}

function getEventObj(event, mouse, chart, eventType) {
    let returnObj = {};
    if (event.hasOwnProperty('eventType')) {
        returnObj = event;
    } else {
        returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
        returnObj.mouse = mouse;
    }
    returnObj.eventType = eventType;
    return returnObj;
}

/**
* @name toggleCommentMode
* @desc updates event listeners for comment mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleCommentMode(mode) {
    let chart = this,
        commentObj = chart.commentMode;
    if (mode === 'comment-mode') {
        let entireSvg = chart.chartDiv.select('svg'),
            callbacks = {
                onDoubleClick: (event, mouse) => {
                    commentObj.makeComment(event.target);
                    if (typeof chart.config.callbacks.commentMode.onDoubleClick === 'function') {
                        let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                        returnObj.eventType = 'doubleClick';
                        chart.config.callbacks.commentMode.onDoubleClick(returnObj);
                    }
                },
                onClick: (event, mouse) => {
                    if (typeof chart.config.callbacks.commentMode.onClick === 'function') {
                        let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                        returnObj.eventType = 'click';
                        chart.config.callbacks.commentMode.onClick(returnObj);
                    }
                }
            };
        registerClickEvents(entireSvg, callbacks, chart.config.currentEvent);
        //set cursor for comment mode
        chart.chartDiv.style('cursor', 'pointer');
        //add movementlisteners
        chart.chartDiv.selectAll('.min-comment')
            .on('mousedown', function () {
                //logic to move comments
                commentObj.createMoveListener(d3.select(this));
            })
            .on('mouseup', () => {
                if (commentObj.moved) {
                    commentObj.updatePosition(commentObj);
                }
                commentObj.moved = false;
                chart.chartDiv.on('mousemove', false);
            });
    } else {
        commentObj.removeComment();
    }
}

/**
* @name toggleEditMode
* @desc updates event listeners for edit mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleEditMode(mode) {
    let chart = this,
        editObj = chart.editMode,
        entireSvg = editObj.chartDiv.select('svg');
    if (mode === 'edit-mode') {
        editObj.chartDiv.style('cursor', 'default');
        entireSvg.selectAll('.event-rect')
            .attr('display', 'none');

        let callbacks = {
            onDoubleClick: (event, mouse) => {
                if (typeof chart.config.callbacks.editMode.onDoubleClick === 'function') {
                    let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    returnObj.eventType = 'doubleClick';
                    chart.config.callbacks.editMode.onDoubleClick(returnObj);
                }
            },
            onClick: (event, mouse) => {
                //edit mode events
                //going to be mouseover to highlight options for whatever piece you hover over
                let classText = d3.select(event.target).attr('class');
                if (classText) {
                    if (classText.indexOf('editable') >= 0) {
                        editObj.displayEdit(mouse, classText);
                    }
                }

                if (typeof chart.config.callbacks.editMode.onClick === 'function') {
                    let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    returnObj.eventType = 'click';
                    chart.config.callbacks.editMode.onClick(returnObj);
                }
            }
        };
        //clear svg listeners
        registerClickEvents(entireSvg, {}, chart.config.currentEvent);
        //add chart div level listeners
        registerClickEvents(editObj.chartDiv, callbacks, chart.config.currentEvent);

        editObj.chartDiv.selectAll('.editable').classed('pointer', true);
    } else {
        //clear chart div level listeners
        editObj.removeEdit();
        entireSvg.selectAll('.editable').classed('pointer', false);
        entireSvg.selectAll('.event-rect')
            .attr('display', 'block');
    }
}

/**
* @name toggleBrushMode
* @desc updates event listeners for brush mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleBrushMode(mode) {
    var chart = this;
    if (mode === 'brush-mode' && chart.config.callbacks.brushMode) {
        chart.addBrushEvents();
    }
}

/**
* @name toggleSelectMode
* @desc updates event listeners for select mode
* @param {string} mode - specified mode to toggle to
* @return {undefined} - no return
*/
function toggleSelectMode(mode) {
    var chart = this;
    if (mode === 'select-mode') {
        let callbacks = {
            onDoubleClick: (event, mouse) => {
                if (typeof chart.config.callbacks.selectMode.onDoubleClick === 'function') {
                    let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    returnObj.eventType = 'doubleClick';
                    chart.config.callbacks.selectMode.onDoubleClick(returnObj);
                }
            },
            onClick: (event, mouse) => {
                if (typeof chart.config.callbacks.selectMode.onClick === 'function') {
                    let returnObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    returnObj.eventType = 'click';
                    chart.config.callbacks.selectMode.onClick(returnObj);
                }
            }
        };
        registerClickEvents(chart.chartDiv.select('svg'), callbacks, chart.config.currentEvent);
    }
}

/**
* @name addBrushEvents
* @desc registers events for brush mode
* @return {undefined} - no return
*/
function addBrushEvents() {
    let chart = this,
        entireSvg = chart.chartDiv.select('svg'),
        callbacks = {
            mousedown: addBrushMousedown.bind(chart),
            mouseup: () => {
                chart.chartDiv.select('svg').on('mousemove', false);
                chart.brushMode.removeBrush();
            }
        };
    registerClickEvents(entireSvg, callbacks, chart.config.currentEvent);
}

/**
* @name addBrushMousedown
* @desc creates mousedown event for brush mode
* @return {undefined} - no return
*/
function addBrushMousedown() {
    var chart = this,
        brushStarted = false,
        brushContainer = chart.chartDiv.select('.' + chart.config.type + '-container').node(),
        entireSvg = chart.chartDiv.select('svg'),
        timeMouseDown = new Date().getTime();
    entireSvg.on('mousemove', () => {
        var timeMouseMove = new Date().getTime();
        if (timeMouseDown > timeMouseMove - 10) {
            //mouse move happend too quickly, chrome bug
            return;
        }
        if (brushStarted) {
            return;
        }
        let containerBox,
            x,
            y,
            mouse;
        if (brushContainer === undefined) {
            chart.brushMode.startBrush(d3.event);
            brushStarted = true;
        } else {
            containerBox = brushContainer.getBoundingClientRect();
            mouse = d3.mouse(entireSvg.node());
            x = mouse[0];
            y = mouse[1];

            if (x < containerBox.right && y < containerBox.bottom && x > containerBox.left && y > containerBox.top) {
                chart.brushMode.startBrush(d3.event);
                brushStarted = true;
            }
        }
    });
}

/**
* @name registerClickEvents
* @desc register handler for jv events
* @param {d3element} svg - d3 selected element to bind events on
* @param {object} callbacks - callbacks to run for each type of click event
* @return {undefined} - no return
*/
function registerClickEvents(svg, callbacks = {}, currentEvent = {}) {
    //using default parameters to show available parts of the callbacks object
    var down,
        tolerance = 5,
        clickTimer = null,
        hoverTimer = null,
        hoverTargetEle,
        CLICK_TIMER = 250,
        HOVER_TIMER = 2000,
        onHoverFired = false,
        onHoverData = null;

    svg.on('mousedown', false);
    svg.on('mouseup', false);
    svg.on('mousemove', false);
    svg.on('mouseout', false);
    svg.on('keyup', false);
    svg.on('focus', false);

    if (typeof callbacks.onHover === 'function' || typeof callbacks.offHover === 'function') {
        svg.on('mouseout', () => {
            if (currentEvent.type === 'onHover' && typeof callbacks.offHover === 'function') {
                callbacks.offHover(currentEvent.data);
                currentEvent = {};
            } else if (onHoverFired && typeof callbacks.offHover === 'function') {
                callbacks.offHover(...onHoverData);
            }
            hoverTargetEle = null;
            window.clearTimeout(hoverTimer);
        });
        svg.on('mousemove', function () {
            if (hoverTargetEle !== d3.event.target || (d3.event.target && hoverTargetEle && hoverTargetEle.classList.value !== d3.event.target.classList.value)) {
                //create new timer and assign to hover target ele
                window.clearTimeout(hoverTimer);
                hoverTimer = null;
                hoverTargetEle = d3.event.target;

                let mouse = d3.mouse(this);
                if (currentEvent.type === 'onHover' && hoverTargetEle) {
                    callbacks.offHover(currentEvent.data);
                    currentEvent = {};
                    onHoverFired = false;

                    return;
                }
                if (onHoverFired && typeof offHover === 'function') {
                    callbacks.offHover(...onHoverData);
                    onHoverFired = false;
                    return;
                }
                onHoverFired = false;

                hoverTimer = window.setTimeout(callHover.bind(this, d3.event, mouse), HOVER_TIMER);

                function callHover(e, m) {
                    if (typeof callbacks.onHover === 'function') {
                        onHoverData = [e, m, this];
                        callbacks.onHover(...onHoverData);
                        onHoverFired = true;
                    }
                }
            }
        });
    }
 
    if (typeof callbacks.onKeyUp === 'function') {
        svg.on('keyup', callbacks.onKeyUp);
        svg.on('focus', () => { });
        svg.node().focus();
    }

    if (typeof callbacks.onKeyDown === 'function') {
        svg.on('keydown', callbacks.onKeyDown);
        svg.on('focus', () => { });
        svg.node().focus();
    }

    if (typeof callbacks.mousedown === 'function') {
        svg.on('mousedown', () => {
            down = d3.mouse(svg.node());
            callbacks.mousedown();
        });
    }

    svg.on('mouseup', function () {
        if (typeof callbacks.mouseup === 'function') {
            callbacks.mouseup();
        }
        if (typeof callbacks.onDoubleClick !== 'function') {
            //run single click if double click doesnt exist
            singleClick(d3.event, d3.mouse(this), callbacks.onClick);
        } else if (typeof callbacks.onDoubleClick === 'function') {
            if (dist(down, d3.mouse(svg.node())) > tolerance) {
                //drag not click so return
                return;
            }
            //need to determine whether single or double click
            if (clickTimer) {
                window.clearTimeout(clickTimer);
                clickTimer = null;
                callbacks.onDoubleClick(d3.event, d3.mouse(this), this);
            } else {
                //d3.event and d3.mouse both lose their scope in a timeout and no longer return the expected value, so binding is necessary
                clickTimer = window.setTimeout(singleClick.bind(this, d3.event, d3.mouse(this), callbacks.onClick), CLICK_TIMER);
            }
        }
    });
}

function singleClick(e, mouse, onClick) {
    if (typeof onClick === 'function') {
        onClick(e, mouse, this);
    }
}

/**
* @name dist
* @desc euclidean distance to determine if the mouse moved in between clicks for double click
* @param {array} a - point a
* @param {array} b - point b
* @return {number} - distance between a and b
*/
function dist(a, b) {
    if (a && b && Array.isArray(a) && Array.isArray(b)) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
    }
    return 0;
}
