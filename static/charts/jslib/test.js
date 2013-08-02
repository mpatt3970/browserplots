function makeChart(attr, data, time) {
    var chart_data = [];
    for (var i = 0; i < data.length; i++) {
        chart_data.push([time[i]*1000, data[i]]);
    }
    d = chart_data;
    //set units to metric or english based on global variable metric
    if (metric) {
        var units = attr[2]
    } else {
        var units = attr[3]
    }
    var plot_type = 'spline'
    if (attr[4].indexOf('scatter') !== -1) {
        plot_type = 'scatter'
    }
	var chart = new Highcharts.Chart({
        chart: {
            //id of where to render it, in this case the shortname from attributes
            renderTo: attr[0],
            //the type of chart and type of animation
            type: plot_type,
            animation: Highcharts.svg
            //svg isn't supported by IE8 and earlier so graphs won't display properly
        },
        title: {
            text: attr[1]
        },
        xAxis: {
            type: "datetime",
            title: {
                text: 'Local Time'
            }
        },
        yAxis: {
            title: {
                text: units
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
            data: d
        }]
    });
    return chart;
}

function initialize(object, attr) {
    var array_of_arrays = [],
    data = [],
    options = [],
    selected = [],
    charts = [],
    time = object['time'],
    attributes = [];
    //hold up this could be handled on the Python side
    var $o = $('#optionsContainer'),
    $c = $('#chartContainer');
    $o.append('<form><fieldset data-role="controlgroup" data-type="horizontal">');
    var count = 0;
    for (var key in object) {
        if (key != 'time') {
            //to initialize with all charts selected:
            //change selected.push(false) to selected.push(true)
            //add a checked attribute to the checkboxes
            //uncomment the for loop with $c.append(..) and charts.push(...)
            data.push(object[key]);
            selected.push(false);
            options.push(key);
            attributes.push(attr[key]);
            $o.append('<input type="checkbox" name="checkbox-' + count + '" id="checkbox-' + count + '"/>');
            $o.append('<label for="checkbox-' + count + '" data-inline="true">' + attr[key][1] + '</label>');
            count++;
        }
    }
    $o.append('</fieldset></form>');
    $("input[type='checkbox']").checkboxradio();
    array_of_arrays = [data, attributes, selected, charts, time];
    /*
    for (var i = 0; i < array_of_arrays[0]; i++) {
        $c.append('<div id="' + key + '" class="chart"></div>');
        charts.push(makeChart(attributes[i], data[i], time));
    }
    */
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
            setTimeout( function() { ajaxCall(array_of_arrays); }, timeout_length);
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
        var name = array_of_arrays[1][i][0];
        var e_units = array_of_arrays[1][i][3];
        if (!metric) {
            if (e_units == 'Fahrenheit') {
                var toAdd = Math.round(10000*(recent[name]*1.8 + 32))/10000;
            }
            else if (e_units == 'inches Hg') {
                var toAdd = Math.round(10000*recent[name]*.0295299830714)/10000;
            }
            else if (e_units == 'miles/hour') {
                var toAdd = Math.round(10000*recent[name]*2.23694)/10000;
            }
            else if (e_units == 'inches') {
                var toAdd = Math.round(10000*recent[name]*0.0393701)/10000;
            }
            else {
                var toAdd = recent[name]
            }
        } else {
            var toAdd = recent[name];
        }
        /*
        consider having to add two types of data here
        */
        array_of_arrays[0][i].push(toAdd);
        array_of_arrays[0][i].shift();
        if (array_of_arrays[2][i]) {
            var chart_data = [];
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                chart_data.push([array_of_arrays[4][j]*1000, array_of_arrays[0][i][j]])
            }
            array_of_arrays[3][i].series[0].setData(chart_data);
        }
    }
    return array_of_arrays;
}

function updateSelections(array_of_arrays) {
    for (var i = 0; i < array_of_arrays[1].length; i++) {
        if ($('input[name=checkbox-' + i +']').prop("checked")) {
            if (!array_of_arrays[2][i]) {
                //the checkbox is now selected but previously was not
                //add a chart
                $('#chartContainer').append('<div id="' + array_of_arrays[1][i][0] + '" class="chart"></div>');
                array_of_arrays[3][i] = (makeChart(array_of_arrays[1][i], array_of_arrays[0][i], array_of_arrays[4]));
                array_of_arrays[2][i] = true;
            }
        } else {
            if (array_of_arrays[2][i]) {
                //the checkbox is no longer selected but previously was selected
                //remove and clear the chart
                array_of_arrays[3][i].destroy();
                $('#' + array_of_arrays[1][i][0]).remove();
                array_of_arrays[2][i] = false;
            }
        }
    }
    return array_of_arrays;
}

function convert_to_english(array_of_arrays) {
    for (var i = 0; i < array_of_arrays[0].length; i++) {
        m_units = array_of_arrays[1][i][2];
        if (m_units == 'Celsius') {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                array_of_arrays[0][i][j] = Math.round( (array_of_arrays[0][i][j]*1.8 + 32)*10000)/10000;
            }
        }
        else if (m_units == 'hPa') {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                array_of_arrays[0][i][j] = Math.round(10000*array_of_arrays[0][i][j]*.0295299830714)/10000;
            }
        }
        else if (m_units == 'meters/second') {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                array_of_arrays[0][i][j] = Math.round(10000*array_of_arrays[0][i][j]*2.23694)/10000;
            }
        }
        else if (m_units == 'millimeters') {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                array_of_arrays[0][i][j] = Math.round(10000*array_of_arrays[0][i][j]*0.0393701)/10000;
            }
        }
        if (array_of_arrays[2][i]) {
            array_of_arrays[3][i].destroy();
            array_of_arrays[3][i] = (makeChart(array_of_arrays[1][i], array_of_arrays[0][i], array_of_arrays[4]));
        }
    }
    return array_of_arrays;
}

function convert_to_metric(array_of_arrays) {
    for (var i = 0; i < array_of_arrays[0].length; i++) {
        e_units = array_of_arrays[1][i][3];
        if (e_units == 'Fahrenheit') {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                array_of_arrays[0][i][j] = Math.round(10000*(array_of_arrays[0][i][j]-32)*5/9)/10000;
            }
        }
        else if (e_units == 'inches Hg') {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                array_of_arrays[0][i][j] = Math.round(10000*array_of_arrays[0][i][j]/.0295299830714)/10000;
            }
        }
        else if (e_units == 'miles/hour') {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                array_of_arrays[0][i][j] = Math.round(10000*array_of_arrays[0][i][j]/2.23694)/10000;
            }
        }
        else if (e_units == 'inches') {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                array_of_arrays[0][i][j] = Math.round(10000*array_of_arrays[0][i][j]/0.0393701)/10000;
            }
        }
        if (array_of_arrays[2][i]) {
            array_of_arrays[3][i].destroy();
            array_of_arrays[3][i] = (makeChart(array_of_arrays[1][i], array_of_arrays[0][i], array_of_arrays[4]));
        }
    }
    return array_of_arrays;
}

//set a global variable to mark if it's metric or english units
var metric = true;
$('document').ready( function() {
	var obj = jQuery.parseJSON(json);
    var attr = jQuery.parseJSON(attributes);
    var the_array = initialize(obj, attr);
    the_array = ajaxCall(the_array);
    $('#convert').change( function() {
        if (!metric) {
            metric = true;
            the_array = convert_to_metric(the_array);
        } else {
            metric = false;
            the_array = convert_to_english(the_array);
        }
    });
    $('input:checkbox').change( function() {
        the_array = updateSelections(the_array);
    });
});
