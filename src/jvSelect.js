/***  jvEdit ***/
function jvSelect(configObj) {
    "use strict";
    var selectObj = this;
    selectObj.chartDiv = configObj.chartDiv;
    selectObj.toggleSelectMode = function (toggleBool) {
        var entireSvg = selectObj.chartDiv.select("svg");
        if(toggleBool){
            entireSvg.on('click', function(){
                var target = d3.select(d3.event.target);
                console.log(target);
            });
            entireSvg.on('dblclick', false);
        }
        else{
        }

    }
}


/********************************************* Select Mode Functions **************************************************/



module.exports = jvSelect;