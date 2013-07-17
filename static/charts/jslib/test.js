function makeChart(name, data, time, data2) {
	if (data2.length > 1) {
		d2 = []
		for (var i = 0; i < data2.length; i++) {
			d2.push([time[i]*1000, data2[i]]);
		}
	}
	else {
		d2 = []
	}
	d = [];
	for (var i = 0; i < data.length; i++) {
		d.push([time[i]*1000, data[i]]);
	}
	var chart = new Highcharts.Chart({
        chart: {
            //id of where to render it, the selected[i].longname is both for making the id and passed to this function as 'a'
            renderTo: name,
            //the type of chart and type of animation
            type: 'spline',
            animation: Highcharts.svg
            //svg isn't supported by IE8 and earlier so graphs won't display properly
        },
        title: {
            text: name
        },
        xAxis: {
            type: "datetime"
        },
        yAxis: {
            title: {
                text: name
            }
        },
        //turns off the legend
        legend: {
            enabled: false
        },
        //turns off allowing users to easily print just the chart
        exporting: {
            enabled: false
        },
        series: [{
            name: 'data',
            type: 'spline',
            data: d
        }, 
        {
        	name: 'data2',
        	type: 'spline',
        	data: d2
        }]
    });
}

$('document').ready( function() {
	var obj = jQuery.parseJSON(json);
	for (var key in obj) {
		$('#test').append(key + ': ' + obj[key] + '<br>');
	}

	$('#test').append(obj['time'].length)

	$('#chartContainer').append('<div id="Temperature" class="chart" style="border-style: solid; min-width: 400px; height: 400px; margin: 0 auto"></div>');
	makeChart('Temperature', obj['tdry'], obj['time'], obj['dp']);
	$('#chartContainer').append('<div id="Relative Humidity" class="chart" style="border-style: solid; min-width: 400px; height: 400px; margin: 0 auto"></div>');
	makeChart('Relative Humidity', obj['rh'], obj['time'], []);
	$('#chartContainer').append('<div id="Pressure" class="chart" style="border-style: solid; min-width: 400px; height: 400px; margin: 0 auto"></div>');
	makeChart('Pressure', obj['cpres0'], obj['time'], []);
	$('#chartContainer').append('<div id="Wind Speed" class="chart" style="border-style: solid; min-width: 400px; height: 400px; margin: 0 auto"></div>');
	makeChart('Wind Speed', obj['wspd'], obj['time'], obj['wmax']);
	$('#chartContainer').append('<div id="Rain Accumulation" class="chart" style="border-style: solid; min-width: 400px; height: 400px; margin: 0 auto"></div>');
	makeChart('Rain Accumulation', obj['raina'], obj['time'], []);
});