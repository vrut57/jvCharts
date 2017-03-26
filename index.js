'use strict';

function paint(chartDiv, type, data) {
    let chart;
    //create jv chart object
    chart = new jvCharts({
        type: type,
        chartDiv: chartDiv,
        tipConfig: {
            type: 'simple'
        },
        options: data.options,
        setData: {
            data: data.data,
            dataTable: data.dataTableAlign,
            dataTableKeys: data.dataTableKeys,
            colors: COLOR
        }
    });
}

const COLOR = ['#0c4ba2', '#15b994', '#F41C3E', '#e8c316', '#8d2ad9', '#ee8620', '#08254d', '#0d6954', '#730911', '#a78c0e', '#3f0d66', '#984f08'];
const DATA = {
    'data': [{"Genre":"Action - Adventure","Average Revenue Domestic":101711366.17777778,"Average Revenue International":153345483.14444444},{"Genre":"Thriller - Horror","Average Revenue Domestic":42242142.10144927,"Average Revenue International":41770137.36231884},{"Genre":"Documentary","Average Revenue Domestic":14363397,"Average Revenue International":3073112},{"Genre":"Comedy - Musical","Average Revenue Domestic":62918773.79310345,"Average Revenue International":67238355.7586207},{"Genre":"Family - Animation","Average Revenue Domestic":89190820.1764706,"Average Revenue International":121787980.44117647},{"Genre":"Drama","Average Revenue Domestic":60554393.92366412,"Average Revenue International":61509470.16030534}],
    'dataTableAlign': {
        "label":"Genre",
        "value 1":"Average Revenue Domestic",
        "value 2":"Average Revenue International"
    },
    'dataTableKeys': [{"vizType":"label","type":"STRING","uri":"Genre","operation":{},"varKey":"Genre"},{"vizType":"value","type":"NUMBER","uri":"Average_Revenue_Domestic","operation":{"formula":"m: Average ( [ c: Revenue_Domestic ] [ c: Genre ] )","calculatedBy":["Revenue_Domestic"],"groupBy":["Genre"],"math":"Average"},"varKey":"Average_Revenue_Domestic"},{"vizType":"value","type":"NUMBER","uri":"Average_Revenue_International","operation":{"formula":"m: Average ( [ c: Revenue_International ] [ c: Genre ] )","calculatedBy":["Revenue_International"],"groupBy":["Genre"],"math":"Average"},"varKey":"Average_Revenue_International"}]
};

const DATA2 = {
    'data': [{"Genre":"Action - Adventure","Average Revenue Domestic":101711366.17777778,"Average Revenue International":153345483.14444444},{"Genre":"Thriller - Horror","Average Revenue Domestic":42242142.10144927,"Average Revenue International":41770137.36231884},{"Genre":"Documentary","Average Revenue Domestic":14363397,"Average Revenue International":3073112},{"Genre":"Comedy - Musical","Average Revenue Domestic":62918773.79310345,"Average Revenue International":67238355.7586207},{"Genre":"Family - Animation","Average Revenue Domestic":89190820.1764706,"Average Revenue International":121787980.44117647},{"Genre":"Drama","Average Revenue Domestic":60554393.92366412,"Average Revenue International":61509470.16030534}],
    'dataTableAlign': {
        "label":"Genre",
        "value":"Average Revenue Domestic"
    },
    'dataTableKeys': [{"vizType":"label","type":"STRING","uri":"Genre","operation":{},"varKey":"Genre"},{"vizType":"value","type":"NUMBER","uri":"Average_Revenue_Domestic","operation":{"formula":"m: Average ( [ c: Revenue_Domestic ] [ c: Genre ] )","calculatedBy":["Revenue_Domestic"],"groupBy":["Genre"],"math":"Average"},"varKey":"Average_Revenue_Domestic"},{"vizType":"value","type":"NUMBER","uri":"Average_Revenue_International","operation":{"formula":"m: Average ( [ c: Revenue_International ] [ c: Genre ] )","calculatedBy":["Revenue_International"],"groupBy":["Genre"],"math":"Average"},"varKey":"Average_Revenue_International"}]
};

const DATA3 = {
    'data': [{"Genre":"Action - Adventure","Average Revenue Domestic":101711366.17777778,"Average Revenue International":153345483.14444444},{"Genre":"Thriller - Horror","Average Revenue Domestic":42242142.10144927,"Average Revenue International":41770137.36231884},{"Genre":"Documentary","Average Revenue Domestic":14363397,"Average Revenue International":3073112},{"Genre":"Comedy - Musical","Average Revenue Domestic":62918773.79310345,"Average Revenue International":67238355.7586207},{"Genre":"Family - Animation","Average Revenue Domestic":89190820.1764706,"Average Revenue International":121787980.44117647},{"Genre":"Drama","Average Revenue Domestic":60554393.92366412,"Average Revenue International":61509470.16030534}],
    'dataTableAlign': {
        "label":"Genre",
        "x":"Average Revenue Domestic",
        "y":"Average Revenue International"
    },
    'dataTableKeys': [
        {"vizType":"label","type":"STRING","uri":"Genre","operation":{},"varKey":"Genre"},{"vizType":"value","type":"NUMBER","uri":"Average_Revenue_Domestic","operation":{"formula":"m: Average ( [ c: Revenue_Domestic ] [ c: Genre ] )","calculatedBy":["Revenue_Domestic"],"groupBy":["Genre"],"math":"Average"},"varKey":"Average_Revenue_Domestic"},{"vizType":"value","type":"NUMBER","uri":"Average_Revenue_International","operation":{"formula":"m: Average ( [ c: Revenue_International ] [ c: Genre ] )","calculatedBy":["Revenue_International"],"groupBy":["Genre"],"math":"Average"},"varKey":"Average_Revenue_International"}]
};

let chartDiv = d3.select('#chart-viz');
let chartDiv2 = d3.select('#chart-viz2');
let chartDiv3 = d3.select('#chart-viz3');
let chartDiv4 = d3.select('#chart-viz4');

paintAll();

function paintAll() {
    paint(chartDiv, 'bar', DATA);
    paint(chartDiv2, 'line', DATA);
    paint(chartDiv3, 'pie', DATA2);
    paint(chartDiv4, 'scatterplot', SCATTER_DATA);
}