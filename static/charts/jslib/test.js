function makeChart(attr, data, time) {
    /*
    this function receives a plot's attributes, data values, and the time array as parameters
    it checks if the plots are paired and constructs plots accordingly
    and returns the chart object at the end
    */
    //first check if this is a paired plot by trying to access an array one level deeper than a non paired plot would have
    if (data[0][0]) {
        //it is a paired plot
        //id of where to render it, in this case the shortname from the first array in attributes
        var id = attr[0][0];
        var plot_type = 'spline';
        if (attr[0][4].indexOf('scatter') !== -1) {
            plot_type = 'scatter'
        }
        //combines the different names into a title
        var title = attr[0][1];
        //indexed to 1 since we already put in the first name
        for (var i = 1; i < attr.length; i++) {
            title = title + ' and ' + attr[i][1];
        }
        //set units to metric or english based on global variable metric
        //assumes all combined plots share units
        if (metric) {
            var units = attr[0][2]
        } else {
            var units = attr[0][3]
        }
        var d = [];
        for (var i = 0; i < data.length; i++) {
            var chart_data = [];
            for (var j = 0; j < data[i].length; j++) {
                chart_data.push([time[j]*1000, data[i][j]])
            }
            d.push(chart_data);
        }
    } else {
        //it isnt a paired plot
        //id of where to render it, in this case the shortname from attributes
        var id = attr[0]
        var plot_type = 'spline'
        if (attr[4].indexOf('scatter') !== -1) {
            plot_type = 'scatter'
        }
        var title = attr[1];
        var chart_data = [];
        for (var i = 0; i < data.length; i++) {
            chart_data.push([time[i]*1000, data[i]]);
        }
        d = [chart_data];
        //set units to metric or english based on global variable metric
        if (metric) {
            var units = attr[2]
        } else {
            var units = attr[3]
        }
    }
	var chart = new Highcharts.Chart({
        chart: {
            renderTo: id,
            //the type of chart and type of animation
            type: plot_type,
            animation: Highcharts.svg
            //svg isn't supported by IE8 and earlier so graphs won't display properly
        },
        title: {
            text: title
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
        }
    });
    for (var i = 0; i < d.length; i++) {
        var series = {
            name: 'data',
            data: d[i]
        }
        chart.addSeries(series);
    }
    return chart;
}

function initialize(object, attr) {
    /*
    this function receives both json objects as parameters
    object contains the data
    attr contains the attributes
    it fills various arrays with the info from the json objects
    and maintains the same index for each variable across the arrays
    then returns a master array containing all the other arrays
    */

    //instead of a mess of nested arrays could define an object to hold this stuff for each variable and store the objects in a single array

    var array_of_arrays = [], //the master array to hold the other array
    data = [], //holds arrays of numbers with the data
    selected = [], //holds boolean values indicating if a variable is selected(true) or not(false)
    charts = [], //holds the chart objects returned by the makeCharts function
    time = object['time'], //holds integers that represent the time in local time in seconds since Jan 1, 1970
    attributes = [], //holds arrays of strings with this format [short name, long name, metric units, english units, plot-type]
    used = ['time']; //holds which variables don't get their own plot, for example paired plots and time

    //hold up this could be handled on the Python side...
    var $o = $('#optionsContainer');
    $o.append('<form><fieldset data-role="controlgroup" data-type="horizontal">');

    var count = 0;
    //loop through the json objects
    for (var key in object) {
        //set a marker to indicate if this variable isn't in the used array
        //cause if it is in the used array, we don't want to push it onto the other arrays
        var marker = true;
        for (var i = 0; i < used.length; i++) {
            if (key == used[i]) {
                marker = false;
            }
        }
        if (marker) {
            //set some default values to add in case there is no paired plot
            var data_to_add = object[key];
            var attr_to_add = attr[key];
            var label = attr[key][1]; //sets the option label
            var plots_to_add = []; //holds the indices of the plots to add if any
            //check if this plot type matches any other plot types
            for (var other_key in attr) {
                //if the plot types match and the short names are different
                if (attr[key][4] == attr[other_key][4] && attr[key][0] !== attr[other_key][0]) {
                    //account for the paired plot so the option isnt repeated
                    used.push(attr[other_key][0]);
                    //store the keys of the plots to add
                    plots_to_add.push(other_key);
                }
            }
            i
            //if there are some paired plots, change the to_adds from default values into arrays with the default value as the first element
            //so that more values can be pushed onto them
            if (plots_to_add.length > 0) {
                data_to_add = [data_to_add];
                attr_to_add = [attr_to_add];
            }
            //then push each additional plot onto these arrays from the plots_to_add
            for (var j = 0; j < plots_to_add.length; j++) {
                data_to_add.push(object[plots_to_add[j]]);
                attr_to_add.push(attr[plots_to_add[j]]);
                //and add the other names to the options label separated by ands
                label = label + ' and ' + attr[plots_to_add[j]][1];
            }
            data.push(data_to_add);
            selected.push(false);
            attributes.push(attr_to_add);
            $o.append('<input type="checkbox" name="checkbox-' + count + '" id="checkbox-' + count + '"/>');
            $o.append('<label for="checkbox-' + count + '" data-inline="true">' + label + '</label>');
            count++;
        }
    }
    $o.append('</fieldset></form>');
    $("input[type='checkbox']").checkboxradio();
    array_of_arrays = [data, attributes, selected, charts, time];
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

function convertRecent(value, e_units) {
    if (!metric) {
            if (e_units == 'Fahrenheit') {
                var toAdd = Math.round(10000*(value*1.8 + 32))/10000;
            }
            else if (e_units == 'inches Hg') {
                var toAdd = Math.round(10000*value*.0295299830714)/10000;
            }
            else if (e_units == 'miles/hour') {
                var toAdd = Math.round(10000*value*2.23694)/10000;
            }
            else if (e_units == 'inches') {
                var toAdd = Math.round(10000*value*0.0393701)/10000;
            }
            else {
                var toAdd = value
            }
        } else {
            var toAdd = value;
        }
        return toAdd;
}

function updateCharts(recent, array_of_arrays) {
    array_of_arrays[4].push(recent.t);
    array_of_arrays[4].shift();
    for (var i = 0; i < array_of_arrays[0].length; i++) {
        if (array_of_arrays[0][i][0][0]) {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                var name = array_of_arrays[1][i][j][0];
                var e_units = array_of_arrays[1][i][j][3];
                toAdd = convertRecent(recent[name], e_units);
                array_of_arrays[0][i][j].push(toAdd);
                array_of_arrays[0][i][j].shift();
            }
        } else {
            var name = array_of_arrays[1][i][0]
            var e_units = array_of_arrays[1][i][3];
            toAdd = convertRecent(recent[name], e_units);
            array_of_arrays[0][i].push(toAdd);
            array_of_arrays[0][i].shift();
        }
        if (array_of_arrays[2][i]) {
            array_of_arrays[3][i].destroy();
            array_of_arrays[3][i] = (makeChart(array_of_arrays[1][i], array_of_arrays[0][i], array_of_arrays[4]));
        }
    }
    return array_of_arrays;
}

function updateSelections(array_of_arrays) {
    for (var i = 0; i < array_of_arrays[1].length; i++) {
        if ($('input[name=checkbox-' + i +']').prop("checked")) {
            if (!array_of_arrays[2][i]) {
                //the checkbox is now selected but previously was not
                //check if its a paired plot by checking one array deeper than a nonpaired plot would have
                if (array_of_arrays[0][i][0][0]) {
                    //set id equal to the shortname of the first element in the attributes array
                    var id = array_of_arrays[1][i][0][0];
                } else {
                    var id = array_of_arrays[1][i][0];
                }
                //add a chart and give its div a border
                $('#chartContainer').prepend('<div id="' + id + '" class="chart"></div>')
                array_of_arrays[3][i] = (makeChart(array_of_arrays[1][i], array_of_arrays[0][i], array_of_arrays[4]));
                array_of_arrays[2][i] = true;
            }
        } else {
            if (array_of_arrays[2][i]) {
                //the checkbox is no longer selected but previously was selected
                //check if its a paired plot by checking one array deeper than a nonpaired plot would have
                if (array_of_arrays[0][i][0][0]) {
                    //set id equal to the shortname of the first element in the attributes array
                    var id = array_of_arrays[1][i][0][0];
                } else {
                    var id = array_of_arrays[1][i][0];
                }
                //remove and clear the chart as well as removing the border
                $('#' + id).remove();
                array_of_arrays[3][i].destroy();
                array_of_arrays[2][i] = false;
            }
        }
    }
    return array_of_arrays;
}

function convert_to_english(array_of_arrays) {
    for (var i = 0; i < array_of_arrays[0].length; i++) {
        if (array_of_arrays[0][i][0][0]) {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                m_units = array_of_arrays[1][i][j][2];
                if (m_units == 'Celsius') {
                    for (var k = 0; k < array_of_arrays[0][i][j].length; k++) {
                        array_of_arrays[0][i][j][k] = Math.round( (array_of_arrays[0][i][j][k]*1.8 + 32)*10000)/10000;
                    }
                }
                else if (m_units == 'hPa') {
                    for (var k = 0; k < array_of_arrays[0][i][j].length; k++) {
                        array_of_arrays[0][i][j][k] = Math.round(10000*array_of_arrays[0][i][j][k]*.0295299830714)/10000;
                    }
                }
                else if (m_units == 'meters/second') {
                    for (var k = 0; k < array_of_arrays[0][i][j].length; k++) {
                        array_of_arrays[0][i][j][k] = Math.round(10000*array_of_arrays[0][i][j][k]*2.23694)/10000;
                    }
                }
                else if (m_units == 'millimeters') {
                    for (var k = 0; k < array_of_arrays[0][i][j].length; k++) {
                        array_of_arrays[0][i][j][k] = Math.round(10000*array_of_arrays[0][i][j][k]*0.0393701)/10000;
                    }
                }
            }
        } else {
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
        if (array_of_arrays[0][i][0][0]) {
            for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                e_units = array_of_arrays[1][i][j][3];
                if (e_units == 'Fahrenheit') {
                    for (var k = 0; k < array_of_arrays[0][i][j].length; k++) {
                        array_of_arrays[0][i][j][k] = Math.round( (array_of_arrays[0][i][j][k] - 32)*5/9*10000)/10000;
                    }
                }
                else if (e_units == 'inches Hg') {
                    for (var k = 0; k < array_of_arrays[0][i][j].length; k++) {
                        array_of_arrays[0][i][j][k] = Math.round(10000*array_of_arrays[0][i][j][k]/.0295299830714)/10000;
                    }
                }
                else if (e_units == 'miles/hour') {
                    for (var k = 0; k < array_of_arrays[0][i][j].length; k++) {
                        array_of_arrays[0][i][j][k] = Math.round(10000*array_of_arrays[0][i][j][k]/2.23694)/10000;
                    }
                }
                else if (e_units == 'inches') {
                    for (var k = 0; k < array_of_arrays[0][i][j].length; k++) {
                        array_of_arrays[0][i][j][k] = Math.round(10000*array_of_arrays[0][i][j][k]/0.0393701)/10000;
                    }
                }
            }
        } else {
            e_units = array_of_arrays[1][i][3];
            if (e_units == 'Fahrenheit') {
                for (var j = 0; j < array_of_arrays[0][i].length; j++) {
                    array_of_arrays[0][i][j] = Math.round( (array_of_arrays[0][i][j] - 32)*5/9*10000)/10000;
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
