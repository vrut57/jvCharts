var jvCharts = require('../../jvcharts.min.js');

describe("Bar Chart Test", function(){

	 beforeEach(function() {
	    var test1 = "test1 is working";
	    var test2 = "test2 is not working";

	    var barChart = new jvCharts({
	    	type: "bar", 
            name: scope.chartCtrl.chartName,
            options: localChartData.uiOptions,
            chartDiv: scope.chartCtrl.chartDiv,
            tipConfig: tipConfig,
            localCallbackRelatedInsights: relatedInsights,
            localCallbackRemoveHighlight: removeHighlight,
            setData: {
                data: localChartData.viewData,
                dataTable: localChartData.dataTableAlign,
                dataTableKeys: localChartData.dataTableKeys,
                colors: VIZ_COLORS.COLOR_SEMOSS
            },
            paint: true
	    })


	  });

	 it("test 1 should be working", function(){
	 	expect(test1).toEqual("test1 is working");
	 })

	 it("test 2 should not be working", function(){
	 	expect(test2).toEqual("test2 is not working");
	 })

});