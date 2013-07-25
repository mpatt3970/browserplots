function makeChart(name, data, time) {
    var chart_data = [];
    for (var i = 0; i < data.length; i++) {
        chart_data.push([time[i]*1000, data[i]]);
    }
    d = chart_data;
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
            id: name,
            name: 'data',
            type: 'spline',
            data: d
        }]
    });
    return chart;
}

function initialize(object) {
    var array_of_arrays = [],
    data = [],
    options = [],
    selected = [],
    charts = [],
    time = object['time'];
    var $o = $('#optionsContainer'),
    $c = $('#chartContainer');
    $o.append('<fieldset data-role="controlgroup" id="field">');
    for (var key in object) {
        if (key != 'time' && key != 'pres' && key != 'bat' && key != 'wsdev' && key != 'wchill' && key != 'raina24') {
            options.push(key);
            data.push(object[key]);
            $o.append('<label><input type="checkbox" name="checkbox-' + key + '" class="checkbox" checked>' + key + '</label>');
        }
    }
    $o.append('</fieldset>');
    $("input[type='checkbox']").checkboxradio();
    for (var i = 0; i < data.length; i++) {
        $c.append('<div id="' + options[i] + '" class="chart"></div>');
        charts.push(makeChart(options[i], data[i], time));
    }
    selected = options;
    array_of_arrays = [data, options, selected, charts, time];
    return array_of_arrays;
}

function ajaxCall(array_of_arrays) {
    if(window.location.href.indexOf("flab") > -1) {
        name = 'flab';
    }
    else if(window.location.href.indexOf("mlab") > -1) {
        name = 'mlab';
    }
    else if(window.location.href.indexOf("nwsc") > -1) {
        name = 'nwsc';
    }
    else if(window.location.href.indexOf("nsf") > -1) {
        name = 'nsf';
    }
    else {
        name = '';
    }
    l = array_of_arrays[4].length -  1;
    t = array_of_arrays[4][l];
    $.ajax({
        type: "POST",
        url: "/ajax/",
        data: {
            'recentTime' : t,
            'name' : name,
            'csrfmiddlewaretoken' : $("input[name=csrfmiddlewaretoken]").val()
        },
        dataType: 'json',
        success: function(data) {
            array_of_arrays = ajaxSuccess(data, array_of_arrays);
        },
        complete: function() {
            setTimeout( function() { ajaxCall(array_of_arrays); }, 5000);
        }
    });
    return array_of_arrays;
}

function ajaxSuccess(data, array_of_arrays) {
    if (data.s == 'same') {
        return array_of_arrays;
    }
    else {
        return updateCharts(data, array_of_arrays);
    }
}

function updateCharts(recent, array_of_arrays) {
    array_of_arrays[4].push(recent.t);
    array_of_arrays[4].shift();
    for (var i = 0; i < array_of_arrays[1].length; i++) {
        var name = array_of_arrays[1][i];
        array_of_arrays[0][i].push(recent[name]);
        array_of_arrays[0][i].shift();
        var chart_data = []
        for (var j = 0; j < array_of_arrays[0][i].length; j++) {
            chart_data.push([array_of_arrays[4][j]*1000, array_of_arrays[0][i][j]])
        }
        array_of_arrays[3][i].series[0].setData(chart_data);
    }
    return array_of_arrays;
}

$('document').ready( function() {
	var obj = jQuery.parseJSON(json);
    var the_array = initialize(obj);
    the_array = ajaxCall(the_array);
});



