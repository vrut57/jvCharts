'use strict';
var jvCharts = require('./jvCharts.js'),
    jvComment = require('./jvComment.js'),
    jvEdit = require('./jvEdit.js'),
    jvBrush = require('./jvBrush.js'),
    jvSelect = require('./jvSelect.js');

jvCharts.prototype.initializeModes = initializeModes;
jvCharts.prototype.createCommentMode = createCommentMode;
jvCharts.prototype.createEditMode = createEditMode;
jvCharts.prototype.createDefaultMode = createDefaultMode;
jvCharts.prototype.createSelectMode = createSelectMode;
jvCharts.prototype.createBrushMode = createBrushMode;
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
 */
function initializeModes() {
    var chart = this,
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
        chart.toggleModes(chart.mode);
    }
}

/**
 * @name initializeCommentMode
 * @param {Object} comments contains all the comments for a viz
 * @desc function that initializes comment mode
 */
function createCommentMode() {
    var chart = this;
    return new jvComment({
        chartDiv: chart.chartDiv,
        comments: chart.config.comments || {},
        onSaveCallback: chart.config.callbacks.commentMode.onSave,
        getMode: () => {
            return chart.mode;
        }
    });
}

/**
 * @name initializeEditMode
 * @param {Object} lookandfeel describes the look and feel of the viz
 * @desc function that initializes comment mode
 */
function createEditMode() {
    var chart = this;
    return new jvEdit({
        chartDiv: chart.chartDiv,
        vizOptions: chart.config.editOptions || {},
        onSaveCallback: chart.config.callbacks.editMode.onSave
    });
}

/**
 * @name initializeBrushMode
 * @description initialize brush mode
 */
function createDefaultMode() {
    var chart = this;
    if (chart.config.callbacks.defaultMode.onBrush) {
        chart.brushMode = chart.createBrushMode();
    }
    return null;
}

function createBrushMode() {
    var chart = this;
    return new jvBrush({
        chartDiv: chart.chartDiv,
        jvChart: chart,
        onBrushCallback: chart.config.callbacks.defaultMode.onBrush
    });
}

function createSelectMode() {
    return true;
}

function toggleModes(mode) {
    var chart = this;
    chart.commentMode && chart.toggleCommentMode(mode);
    chart.editMode && chart.toggleEditMode(mode);
    //use brushMode in default mode
    // chart.brushMode && chart.toggleBrushMode(mode);
    chart.selectMode && chart.toggleSelectMode(mode);
    //brush mode is inside of default mode
    chart.toggleDefaultMode(mode);
}

function toggleDefaultMode(mode) {
    var chart = this;
    if (mode === 'default-mode') {
        chart.chartDiv.style('cursor', 'default');
        chart.showToolTip = true;
        var defaultMode = chart.config.callbacks.defaultMode;
        var entireSvg = chart.chartDiv.select('svg');
        var callbacks = {
            onDoubleClick: (event, that) => {
                if (typeof defaultMode.onDoubleClick === 'function') {
                    let retrunObj = chart[chart.config.type].getEventData.call(chart, event);
                    defaultMode.onDoubleClick(retrunObj);
                }
            },
            onClick: (event, that) => {
                if (typeof defaultMode.onClick === 'function') {
                    let retrunObj = chart[chart.config.type].getEventData.call(chart, event);
                    defaultMode.onClick(retrunObj);
                }
            }
        };
        if (chart.brushMode) {
            callbacks.mousedown = addBrushMousedown.bind(chart);
            callbacks.mouseup = () => {
                chart.chartDiv.select('svg').on('mousemove', false);
                chart.brushMode.removeBrush();
            };
        }
        registerClickEvents(entireSvg, callbacks);
    } else {
        chart.showToolTip = false;
        chart.removeHighlight();
    }
}

function toggleCommentMode(mode) {
    var chart = this;
    var commentObj = chart.commentMode;
    var entireSvg = chart.chartDiv.select('svg');
    if (mode === 'comment-mode') {
        chart.chartDiv.style('cursor', 'pointer');
        var callbacks = {
            onDoubleClick: (event, that) => {
                commentObj.makeComment(that);
                if (typeof chart.config.callbacks.commentMode.onDoubleClick === 'function') {
                    chart.config.callbacks.commentMode.onDoubleClick();
                }
            },
            onClick: (event, that) => {
                if (typeof chart.config.callbacks.commentMode.onClick === 'function') {
                    chart.config.callbacks.commentMode.onClick();
                }
            }
        };
        registerClickEvents(entireSvg, callbacks);

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
        var containerBox, x, y;
        if (brushContainer === undefined) {
            chart.brushMode.startBrush(d3.event);
            brushStarted = true;
        } else {
            containerBox = brushContainer.getBoundingClientRect();
            x            = d3.mouse(brushContainer)[0];
            y            = d3.mouse(brushContainer)[1];

            if (x < containerBox.left || y < containerBox.bottom) {
                chart.brushMode.startBrush(d3.event);
                brushStarted = true;
            } else {
                //maybe have a catch here for something
            }
        }
    });
}

function addBrushEvents() {
    var chart = this;
    var entireSvg = chart.chartDiv.select('svg');
    chart.chartDiv.style('cursor', 'default');
    entireSvg.on('mousedown', addBrushMousedown.call(chart));
    entireSvg.on('mouseup', () => {
        chart.chartDiv.select('svg').on('mousemove', false);
        chart.brushMode.removeBrush();
    });
}

function toggleBrushMode(mode) {
    var chart = this;
    if (mode === 'brush-mode') {
        chart.addBrushEvents();
    }
}

function toggleSelectMode(mode) {
    var chart = this;
    if (mode === 'select-mode') {
        var entireSvg = chart.chartDiv.select('svg');
        var callbacks = {
            onDoubleClick: (event, that) => {
                if (typeof chart.config.callbacks.selectMode.onDoubleClick === 'function') {
                    let retrunObj = chart[chart.config.type].getEventData.call(chart, event);
                    chart.config.callbacks.selectMode.onDoubleClick(retrunObj);
                }
            },
            onClick: (event, that) => {
                if (typeof chart.config.callbacks.selectMode.onClick === 'function') {
                    chart.config.callbacks.selectMode.onClick();
                }
            }
        };
        registerClickEvents(entireSvg, callbacks);
    }
}

function toggleEditMode(mode) {
    var chart = this;
    var editObj = chart.editMode;
    var entireSvg = editObj.chartDiv.select("svg");
    if (mode === 'edit-mode') {
        editObj.chartDiv.style('cursor', 'default');
        entireSvg.selectAll(".event-rect")
            .attr("display", "none");

        var callbacks = {
            onDoubleClick: (event, that) => {
                if (typeof chart.config.callbacks.editMode.onDoubleClick === 'function') {
                    chart.config.callbacks.editMode.onDoubleClick();
                }
            },
            onClick: (event, that, mouse) => {
                //edit mode events
                //going to be mouseover to highlight options for whatever piece you hover over
                var classText = d3.select(event.target).attr('class');
                if (classText) {
                    if (classText.indexOf('editable') >= 0) {
                        editObj.displayEdit(mouse, classText);
                    }
                }

                if (typeof chart.config.callbacks.editMode.onClick === 'function') {
                    chart.config.callbacks.editMode.onClick();
                }
            }
        };
        registerClickEvents(entireSvg, callbacks);

        entireSvg.selectAll('.editable').classed('pointer', true);
    } else {
        editObj.removeEdit();
        entireSvg.selectAll('.editable').classed('pointer', false);
        entireSvg.selectAll(".event-rect")
            .attr("display", "block");
    }
}

//using default parameters to show available parts of the callbacks object
function registerClickEvents(svg, {onClick = null, onDoubleClick = null, mousedown = null, mouseup = null}) {
    var down,
        tolerance = 5,
        wait = null;

    if (!onClick && !onDoubleClick) {
        svg.on('mousedown', false);
        svg.on('mouseup', false);
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
                onClick(d3.event, this);
            }
            return;
        }
        if (dist(down, d3.mouse(svg.node())) > tolerance) {
            //drag not click so return
            return;
        }
        if (wait) {
            window.clearTimeout(wait);
            wait = null;
            if (typeof onDoubleClick === 'function') {
                onDoubleClick(d3.event, this);
            }
        } else {
            wait = window.setTimeout(((e, mouse) => {
                return () => {
                    if (typeof onClick === 'function') {
                        onClick(e, this, mouse);
                    }
                    wait = null;
                };
                //d3.event and d3.mouse both lose their scope in a timeout and no longer return the expected value, so binding is necessary
            })(d3.event, d3.mouse(this)), 250);
        }
    });
}

//euclidean distance to determine if the mouse moved in between clicks for double click
function dist(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
}
