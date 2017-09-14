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
            onDoubleClick: (event, node, mouse) => {
                if (typeof defaultMode.onDoubleClick === 'function') {
                    let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    retrunObj.eventType = 'doubleClick';
                    defaultMode.onDoubleClick(retrunObj);
                }
            },
            onClick: (event, node, mouse) => {
                if (typeof defaultMode.onClick === 'function') {
                    let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    retrunObj.eventType = 'click';
                    defaultMode.onClick(retrunObj);
                }
            },
            onHover: (event, node, mouse) => {
                let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                retrunObj.eventType = 'hover';
                defaultMode.onHover(retrunObj);
            },
            offHover: (event, node, mouse) => {
                let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                retrunObj.eventType = 'offHover';
                defaultMode.offHover(retrunObj);
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
        registerClickEvents(entireSvg, callbacks);
    } else {
        //remove tooltips and any highlights
        chart.showToolTip = false;
        chart.removeHighlight();
    }
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
                onDoubleClick: (event, node, mouse) => {
                    commentObj.makeComment(node);
                    if (typeof chart.config.callbacks.commentMode.onDoubleClick === 'function') {
                        let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                        retrunObj.eventType = 'doubleClick';
                        chart.config.callbacks.commentMode.onDoubleClick(retrunObj);
                    }
                },
                onClick: (event, node, mouse) => {
                    if (typeof chart.config.callbacks.commentMode.onClick === 'function') {
                        let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                        retrunObj.eventType = 'click';
                        chart.config.callbacks.commentMode.onClick(retrunObj);
                    }
                }
            };
        registerClickEvents(entireSvg, callbacks);
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
            onDoubleClick: (event, node, mouse) => {
                if (typeof chart.config.callbacks.editMode.onDoubleClick === 'function') {
                    let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    retrunObj.eventType = 'doubleClick';
                    chart.config.callbacks.editMode.onDoubleClick(retrunObj);
                }
            },
            onClick: (event, node, mouse) => {
                //edit mode events
                //going to be mouseover to highlight options for whatever piece you hover over
                let classText = d3.select(event.target).attr('class');
                if (classText) {
                    if (classText.indexOf('editable') >= 0) {
                        editObj.displayEdit(mouse, classText);
                    }
                }

                if (typeof chart.config.callbacks.editMode.onClick === 'function') {
                    let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    retrunObj.eventType = 'click';
                    chart.config.callbacks.editMode.onClick(retrunObj);
                }
            }
        };
        //clear svg listeners
        registerClickEvents(entireSvg);
        //add chart div level listeners
        registerClickEvents(editObj.chartDiv, callbacks);

        editObj.chartDiv.selectAll('.editable').classed('pointer', true);
    } else {
        //clear chart div level listeners
        registerClickEvents(editObj.chartDiv);
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
            onDoubleClick: (event, node, mouse) => {
                if (typeof chart.config.callbacks.selectMode.onDoubleClick === 'function') {
                    let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    retrunObj.eventType = 'doubleClick';
                    chart.config.callbacks.selectMode.onDoubleClick(retrunObj);
                }
            },
            onClick: (event, node, mouse) => {
                if (typeof chart.config.callbacks.selectMode.onClick === 'function') {
                    let retrunObj = chart[chart.config.type].getEventData.call(chart, event, mouse);
                    retrunObj.eventType = 'click';
                    chart.config.callbacks.selectMode.onClick(retrunObj);
                }
            }
        };
        registerClickEvents(chart.chartDiv.select('svg'), callbacks);
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
    registerClickEvents(entireSvg, callbacks);
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
* @param {object} listeners - callbacks to run for each type of click event
* @return {undefined} - no return
*/
function registerClickEvents(svg, { onClick = null, onDoubleClick = null, mousedown = null, mouseup = null, onHover = null, offHover = null } = {}) {
    //using default parameters to show available parts of the callbacks object
    var down,
        tolerance = 5,
        clickTimer = null,
        hoverTimer = null,
        hoverTargetEle,
        CLICK_TIMER = 250,
        HOVER_TIMER = 3000,
        onHoverFired = false,
        onHoverData = null;

    svg.on('mousedown', false);
    svg.on('mouseup', false);
    if (typeof onHover === 'function') {
        svg.on('mouseout', () => {
            if (onHoverFired && typeof offHover === 'function') {
                offHover(...onHoverData);
            }
            hoverTargetEle = null;
            window.clearTimeout(hoverTimer);
        });
        svg.on('mousemove', function () {
            if (hoverTargetEle !== d3.event.target) {
                onHoverFired = false;
                if (onHoverFired && typeof offHover === 'function') {
                    offHover(...onHoverData);
                }
                //create new timer and assign to hover target ele
                window.clearTimeout(hoverTimer);
                hoverTargetEle = d3.event.target;
                hoverTimer = window.setTimeout(((e, mouse) => {
                    return () => {
                        if (typeof onHover === 'function') {
                            onHoverData = [e, this, mouse];
                            onHover(...onHoverData);
                            onHoverFired = true;
                        }
                        clickTimer = null;
                    };
                    //d3.event and d3.mouse both lose their scope in a timeout and no longer return the expected value, so binding is necessary
                })(d3.event, d3.mouse(this)), HOVER_TIMER);
            }
        });
    } else {
        //clear possible hover listeners
        svg.on('mousemove', false);
        svg.on('mouseout', false);
    }

    svg.on('mousedown', () => {
        down = d3.mouse(svg.node());
        if (typeof mousedown === 'function') {
            mousedown();
        }
    });

    svg.on('mouseup', function () {
        if (typeof mouseup === 'function') {
            mouseup();
        }
        if (!onDoubleClick) {
            if (typeof onClick === 'function') {
                onClick(d3.event, this, d3.mouse(this));
            }
            return;
        }
        if (dist(down, d3.mouse(svg.node())) > tolerance) {
            //drag not click so return
            return;
        }
        if (clickTimer) {
            window.clearTimeout(clickTimer);
            clickTimer = null;
            if (typeof onDoubleClick === 'function') {
                onDoubleClick(d3.event, this, d3.mouse(this));
            }
        } else {
            clickTimer = window.setTimeout(((e, mouse) => {
                return () => {
                    if (typeof onClick === 'function') {
                        onClick(e, this, mouse);
                    }
                    clickTimer = null;
                };
                //d3.event and d3.mouse both lose their scope in a timeout and no longer return the expected value, so binding is necessary
            })(d3.event, d3.mouse(this)), CLICK_TIMER);
        }
    });
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
