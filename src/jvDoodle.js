/*** jvDoodle  ***/
function jvDoodle(configObj) {
    'use strict';
    var doodleObj = this;
    doodleObj.chartDiv = configObj.chartDiv;
    doodleObj.jvChart  = configObj.jvChart;
    doodleObj.toggleDrawMode = function (toggleBool) {
        if (toggleBool) {
            document.getElementById('jvDoodle-canvas').style = 'display:block;';
            document.getElementById('jvDoodle-modes').style  = 'display:block;';
        } else {
            document.getElementById('jvDoodle-canvas').style = 'display:none;';
            document.getElementById('jvDoodle-modes').style  = 'display:none;'; 
        }
    };
     
    doodleObj.redos     = [];
    doodleObj.undos     = [];
    doodleObj.paint     = false;
    doodleObj.lastX     = null;
    doodleObj.lastY     = null;
    doodleObj.svgEle    = document.getElementsByClassName('editable-svg')[0];
    doodleObj.eraseMode = Symbol('erase');
    doodleObj.drawMode  = Symbol('draw');
    doodleObj.mode      = doodleObj.drawMode;
    doodleObj.drawEle   = document.getElementById('jvDoodle-draw');
    doodleObj.undoEle   = document.getElementById('jvDoodle-undo');
    doodleObj.redoEle   = document.getElementById('jvDoodle-redo'); 
    doodleObj.eraseEle  = document.getElementById('jvDoodle-erase');
    doodleObj.clearEle  = document.getElementById('jvDoodle-clear');
    doodleObj.colorEle  = document.getElementById('jvDoodle-color');
    
    doodleObj.jvChart.ctx.canvas.width  = doodleObj.chartDiv.nodes()[0].clientWidth;
    doodleObj.jvChart.ctx.canvas.height = doodleObj.chartDiv.nodes()[0].clientHeight;
     
    doodleObj.undos.push(doodleObj.jvChart.ctx.getImageData(0, 0, doodleObj.jvChart.ctx.canvas.width, doodleObj.jvChart.ctx.canvas.height));
    buildEventListeners(doodleObj);
}

/********************************************* All Draw Mode Functions **************************************************/ 
/** undo
 *
 * Undoes last canvas action taken
 *
 */
jvDoodle.prototype.undo = function () {
    const doodleObj = this;

    if (doodleObj.undos.length > 1) {
        const redo = doodleObj.undos.pop();
        doodleObj.redos.push(redo);
        doodleObj.load();
    }
};

/** redo
 *
 * Redoes undone actions
 *
 */
jvDoodle.prototype.redo = function () {
    const doodleObj = this;

    if (doodleObj.redos.length > 0) {
        const undo = doodleObj.redos.pop();
        doodleObj.undos.push(undo);
        doodleObj.load();
    }
};


/** load
 *
 * Loads context image data
 *
 */
jvDoodle.prototype.load = function () {
    const doodleObj = this;

    doodleObj.jvChart.ctx.putImageData(doodleObj.undos[doodleObj.undos.length - 1], 0, 0);
};


/** save
 *
 * Saves context image data
 *
 */
jvDoodle.prototype.save = function () {
    const doodleObj = this;

    doodleObj.undos.push(doodleObj.jvChart.ctx.getImageData(0, 0, doodleObj.jvChart.ctx.canvas.width, doodleObj.jvChart.ctx.canvas.height));
};

/** draw
 *
 * Draws to canvas
 *
 */
jvDoodle.prototype.draw = function (x, y, isDown) {
    const doodleObj = this;

    if (isDown) {
        doodleObj.jvChart.ctx.beginPath();
        doodleObj.jvChart.ctx.moveTo(doodleObj.lastX, doodleObj.lastY);
        doodleObj.jvChart.ctx.lineTo(x, y);
        doodleObj.jvChart.ctx.closePath();
        doodleObj.jvChart.ctx.stroke();
    }
    
    doodleObj.lastX = x;
    doodleObj.lastY = y;
};

/** erase
 *
 * Clears specific parts of the canvas
 *
 */
jvDoodle.prototype.erase = function (x, y, isDown) {
    const doodleObj = this;

    if (isDown) {
        doodleObj.jvChart.ctx.clearRect(x, y, doodleObj.jvChart.ctx.lineWidth + 5, doodleObj.jvChart.ctx.lineWidth + 5);
    }

    doodleObj.lastX = x;
    doodleObj.lastY = y;  
};

//private functions

/** buildEventListeners 
 *
 * Sets up all the event listeners for jvDoodle UI elements
 *
 */
const buildEventListeners = doodleObj => {
    doodleObj.eraseEle.onclick = event => {
        doodleObj.mode                  = doodleObj.eraseMode;
        doodleObj.jvChart.cvs.style     = 'pointer-events: auto;';
        doodleObj.jvChart.cvs.className = 'jvDoodle-erase'; 
        doodleObj.drawEle.className     = '';
        doodleObj.eraseEle.className    = 'jvDoodle-active';
    };

    doodleObj.drawEle.onclick = event => {
        doodleObj.mode                  = doodleObj.drawMode;
        doodleObj.jvChart.cvs.style     = 'pointer-events: auto;';
        doodleObj.jvChart.cvs.className = 'jvDoodle-draw';
        doodleObj.drawEle.className     = 'jvDoodle-active';
        doodleObj.eraseEle.className    = '';
    };

    doodleObj.clearEle.onclick = event => {
        if (doodleObj.mode === doodleObj.eraseMode) {
            doodleObj.mode = doodleObj.drawMode;
            doodleObj.drawEle.className = 'jvDoodle-active';
        } else if (doodleObj.mode === doodleObj.svgMode) {
            doodleObj.mode = doodleObj.svgMode;
        }

        doodleObj.eraseEle.className = '';
        
        doodleObj.jvChart.ctx.clearRect(0, 0, doodleObj.jvChart.ctx.canvas.width, doodleObj.jvChart.ctx.canvas.height);
        doodleObj.save();
    };

    doodleObj.jvChart.cvs.onmousedown = event => {
        const mousePos = getMousePos(doodleObj.jvChart.cvs, event);

        doodleObj.paint = true;
        if (doodleObj.mode === doodleObj.drawMode) {
            doodleObj.draw(mousePos.x, mousePos.y, false);
        } else if (doodleObj.mode === doodleObj.eraseMode) {
            doodleObj.erase(mousePos.x, mousePos.y, false);
        }
    };

    doodleObj.jvChart.cvs.onmousemove = event => {
        const mousePos = getMousePos(doodleObj.jvChart.cvs, event);

        if (doodleObj.mode === doodleObj.drawMode) {
            if (doodleObj.paint) {
                doodleObj.draw(mousePos.x, mousePos.y, true);
            }
        } else if (doodleObj.mode === doodleObj.eraseMode) {
            if (doodleObj.paint) {
                doodleObj.erase(mousePos.x, mousePos.y, true);
            }
        }
    };

    doodleObj.jvChart.cvs.onmouseenter = event => {
        const mousePos = getMousePos(doodleObj.jvChart.cvs, event);
        if (event.buttons === 1) {
            doodleObj.paint = true;
        }
        doodleObj.lastX = undefined;
        doodleObj.lastY = undefined;
        if (doodleObj.mode === doodleObj.drawMode) {
            if (doodleObj.paint) {
                doodleObj.draw(mousePos.x, mousePos.y, true);
            }
        } else if (doodleObj.mode === doodleObj.eraseMode) {
            if (doodleObj.paint) {
                doodleObj.erase(mousePos.x, mousePos.y, true);
            }
        }
    };

    doodleObj.jvChart.cvs.onmouseup = () => {
        doodleObj.paint = false;
        doodleObj.save();
    };

    doodleObj.jvChart.cvs.onmouseleave = () => {
        doodleObj.paint = false;
    };

    doodleObj.undoEle.onclick = () => {
        doodleObj.undo();
    };

    doodleObj.redoEle.onclick = () => {
        doodleObj.redo();
    };

    doodleObj.colorEle.onchange = () => {
        doodleObj.jvChart.ctx.strokeStyle = doodleObj.colorEle.value;
    };
};

/** getMousePos
 *
 * Gets mouse position based on canvas coordinates
 *
 */
function getMousePos(cvs, event) {
    const rect = cvs.getBoundingClientRect();

    return {
        x: Math.round((event.pageX - rect.left) / (rect.right - rect.left) * cvs.width),
        y: Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * cvs.height)
    };
};

module.exports = jvDoodle;