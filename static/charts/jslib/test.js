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

function initialize(object, attr, cookie) {
    /*
    this function receives both json objects as parameters
    object contains the data
    attr contains the attributes
    it fills various arrays with the info from the json objects
    and maintains the same index for each variable across the arrays
    then returns a master array containing all the other arrays
    */
    prechosen = parseCookie(cookie);
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
            if (prechosen[key]) {
                console.log(key + " was chosen");
                selected.push(true);
                $o.append('<input type="checkbox" name="checkbox-' + count + '" id="checkbox-' + count + '" checked/>');
            } else {
                console.log(key + " was NOT chosen");
                selected.push(false);
                $o.append('<input type="checkbox" name="checkbox-' + count + '" id="checkbox-' + count + '"/>');
            }
            attributes.push(attr_to_add);
            $o.append('<label for="checkbox-' + count + '" data-inline="true">' + label + '</label>');
            count++;
        }
    }
    $o.append('</fieldset></form>');
    $("input[type='checkbox']").checkboxradio();
    array_of_arrays = [data, attributes, selected, charts, time];
    for (var i = 0; i < array_of_arrays[0].length; i++) {
        if (array_of_arrays[2][i]) {
            if (array_of_arrays[0][i][0][0]) {
                var id = array_of_arrays[1][i][0][0];
            } else {
                var id = array_of_arrays[1][i][0];
            }
            $('#chartContainer').prepend('<div id="' + id + '" class="chart"></div>')
            if (metric) {
                array_of_arrays[3][i] = makeChart(array_of_arrays[1][i], array_of_arrays[0][i], array_of_arrays[4]);
            }
        }
    }
    if (!metric) {
        array_of_arrays = convert_to_english(array_of_arrays);
    }
    return array_of_arrays;
}

function parseCookie(cookie) {
    var selected_objects = {};
    if (cookie == "empty") {
        return '';
    } else {
        var cookie_array = cookie.split("/");
        for (var i = 0; i < cookie_array.length; i += 2) {
            console.log(cookie_array[i] + " is " + cookie_array[i+1]);
            if (cookie_array[i] == 'metric') {
                metric = stringToBool(cookie_array[i + 1]);
                if (!metric) {
                    $('#convert').val("English");
                    $('select').selectmenu('refresh', true);
                } else {
                    $('#convert').val("Metric");
                    $('select').selectmenu('refresh', true);
                }
            } else {
                selected_objects[cookie_array[i]] = stringToBool(cookie_array[i + 1]);
            }
        }
    }
    return selected_objects;
}

function stringToBool(the_string) {
    if (the_string == "true") {
        return true;
    } else {
        return false;
    }
}

function ajaxCall(array_of_arrays) {
    /*This function accepts the array holder as a parameter
    it finds out the labname by checking the url
    it gets the most recent time value stored in the array holder
    it sends the labname, recent time, and a token back to the server
    if it is a success, it calls ajaxSuccess
    and whether it succeeds or fails, it calls itself in timeout_length milliseconds
    then it returns the holder array (modified by ajaxSuccess) to the main function
    */
    var name = getName();
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

function getName() {
    var name = '';
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
    return name;
}

function ajaxSuccess(data, array_of_arrays) {
    /*
    if the data is the same, return the same holder array
    otherwise, return the updateCharts function
    */
    if (data.s == 'same') {
        return array_of_arrays;
    }
    else {
        return updateCharts(data, array_of_arrays);
    }
}

function convertRecent(value, e_units) {
    /*
    if the user has selected english units, then the new values must be converted 
    before they can be added, this converts a single value based on what its unit is
    then returns the converted value
    */
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
    /*
    This function accepts the recent values and the holder array as parameter
    the recent values are indexed by variable shortnames
    for each array holding info, push on the new value and shift off the oldest value
    for the arrays chosen to be charted, destroy the old chart and make a new one
    then return the new array
    */
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
    /*
    this function accepts the holder array as a parameter
    for each option, it checks if the user selected that option
    if it was previously selected, do nothing
    if it wasn't previously selected, make the holder div and the chart for that option
    and set the indicator value to true
    if the user didn't select that option,
    if it was previously selected, delete the div, destroy the chart, and set the indicator to false
    then return the holder array with the indicator values updated
    */
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
    updateCookie(array_of_arrays);
    return array_of_arrays;
}

function updateCookie(array_of_arrays) {
    lab_name = getName();
    var selections = 'metric/' + metric;
    //since it only allows strings and key values to be sent by ajax, the selected info and shortnames will be stored in a string
    //the string format is metric/true/short_name/true/short_name/false/short_name/true/...
    //and the key value is related to the lab_name
    for (var i = 0; i < array_of_arrays[2].length; i++) {
        if (array_of_arrays[0][i][0][0]) {
            //if it is a paired div
            //set the short name to the first element's short name
            var short_name = array_of_arrays[1][i][0][0];
        } else {
            //not paired, so use normal short name
            var short_name = array_of_arrays[1][i][0];
        }
        var selected = array_of_arrays[2][i];
        selections = selections + '/' + short_name + '/' + selected
    }
    $.ajax({
        type: "POST",
        url: "/updateCookie/",
        data: {
            'name': lab_name,
            'selections': selections,
            'csrfmiddlewaretoken' : $("input[name=csrfmiddlewaretoken]").val()
        },
        dataType: 'json',
        success: function(data) {
            console.log(data);
        }
    });
}

function convert_to_english(array_of_arrays) {
    /*
    accepts the holder array as a parameter
    this is a hardcoded conversion based on units
    Math.round only rounds to an int so each value is multipled by 10^4 before rounding then divided by 10^4
    this gives 4 decimal places to each value
    return the holder array with the converted values
    */
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
            if (array_of_arrays[3][i]) {
                array_of_arrays[3][i].destroy();
            }
            array_of_arrays[3][i] = (makeChart(array_of_arrays[1][i], array_of_arrays[0][i], array_of_arrays[4]));
        }
    }
    updateCookie(array_of_arrays);
    return array_of_arrays;
}

function convert_to_metric(array_of_arrays) {
     /*
    accepts the holder array as a parameter
    this is a hardcoded conversion based on units
    Math.round only rounds to an int so each value is multipled by 10^4 before rounding then divided by 10^4
    this gives 4 decimal places to each value
    deal with paired variables and solo variables separately since they are indexed differently
    return the holder array with the converted values
    */
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
    updateCookie(array_of_arrays);
    return array_of_arrays;
}


//set a global variable to mark if it's metric or english units
var metric = true;

//this is the main function
$('document').ready( function() {
    /*
    first it stores the json objects containing the data and attributes into variables
    it initializes the holder array based on these json objects
    it begins the longpolling with the ajaxCall
    if the units are changed, it switches the global variable metric and converts the values
    if the selected options are changed, it updates based on the new selections
    */
	var obj = jQuery.parseJSON(json);
    var attr = jQuery.parseJSON(attributes);
    var the_array = initialize(obj, attr, presets);
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
