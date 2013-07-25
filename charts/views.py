from django.shortcuts import render
from numpy import *
from netCDF4 import *
from datetime import date, timedelta
from pytz import timezone
import simplejson as json
import time
from django.http import HttpResponse

#const variables
NUM_POINTS = 288
TO_ROUND = 4
TO_IGNORE = ['base_time', 'samp_secs', 'lat', 'lon', 'alt', 'station', 'time_offset']
VARIABLE_KEYS = ['tdry', 'rh', 'pres', 'cpres0', 'dp', 'wdir', 'wspd', 'wmax', 'wsdev', 'wchill', 'raina', 'raina24', 'bat']
NAME_MAP = ['Temperature', 'Relative Humidity', 'Pressure corrected to Sea Level', 'Dew Point', 'Wind Direction', 'Wind Speed', 'Peak Gust', 'Rain']
UNIT_MAP = []

def homePage(request):
	return render(request, 'base.html')

def flab(request):
	fjson = getData('flab')
	return render(request, 'flab.html', {'fjson': fjson})

def mlab(request):
	mjson = getData('mlab')
	return render(request, 'mlab.html', {'mjson': mjson})

def nsf(request):
	nsfjson = getData('nsf')
	return render(request, 'nsf.html', {'nsfjson': nsfjson})

def nwsc(request):
	nwscjson = getData('nwsc')
	return render(request, 'nwsc.html', {'nwscjson': nwscjson})

def ajax(request):
	client_name = request.POST['name']
	client_time = int(request.POST['recentTime'])
	current_data = openFile(client_name, 0)
	time = getAjaxTime(current_data, client_name)
	holder = {}
	holder['t'] = time
	holder['r'] = client_time
	if request.method == 'POST':
		if time == client_time:
			holder['s'] = 'same'
			holder['n'] = client_name
			response = json.dumps(holder)
		else:
			holder = getAjaxData(current_data, client_name)
			holder['t'] = time
			holder['r'] = client_time
			holder['s'] = 'old'
			response = json.dumps(holder)
	else:
		response = ""
	current_data.close()
	return HttpResponse(response)

def getAjaxTime(current, lab_name):
	current = openFile(lab_name, 0)
	btime = current.variables['base_time'].getValue()
	time = current.variables['time_offset'][:]
	l = time.size - 1
	if lab_name == 'flab' or lab_name == 'mlab' or lab_name == 'nwsc':
		time_zone = timezone('America/Denver')
	else:
		time_zone = timezone('America/New_York')
	offset = datetime.now(time_zone).strftime('%z')
	offset = int(offset)*36
	return int(time[l] + btime + offset)

def getAjaxData(current, lab_name):
	h = {}
	for x in VARIABLE_KEYS:
		temp = current.variables[x][:]
		l = temp.size - 1
		item = temp[l]
		h[x] = round(item, TO_ROUND)
	return h

def getData(lab_name):
	'''
	gets the data for this labName
	returns a json object
	the format is {"variable_name":[list of data points], "...":[...], ...}
	adjust the lists at the top to add and remove variable names
	'''


	# open the files from today and yesterday
	# today will be current and yesterday will be last
	current_data = openFile(lab_name, 0)
	last_data = openFile(lab_name, 1)

	# determine the amount of data points needed from yesterday and it's total size
	full_size = last_data.variables['time_offset'].size
	last_length = NUM_POINTS - current_data.variables['time_offset'].size
	
	#get the time
	time_list = getTime(current_data, last_data, last_length, full_size, lab_name)
	holder = {'time' : time_list}
	#get the variables from the list and add to the holder dictionary
	for x in VARIABLE_KEYS:
		a_list = getVariable(x, current_data, last_data, last_length, full_size)
		holder[x] = a_list
	#close the files
	current_data.close()
	last_data.close()
	#convert the dictionary to json
	j = json.dumps(holder)
	#return the json object
	return j

def openFile(name, days_ago):
	'''
	name is the name of the relevant weather station
	days_ago is the number of days to go back for the file
	returns the contents of a netcdf from that station and that date
	'''
	#get the date from 'days_ago' to set the filename
	the_date = date.today() - timedelta(days_ago)
	#make the date into a formatted string
	date_string = str(the_date.year) + str(the_date.month).zfill(2) + str(the_date.day).zfill(2)
	#use the name of the lab and the date_string to get the proper file
	filename = '/net/www/weather/' + name + '/data/' + name + '.' + date_string + '.cdf'
	#open the file and store it in data
	data = Dataset(filename)
	return data

def getTime(current, last, length, full, name):
	'''
	current is the current_data netcdf object
	last is the last_data netcdf object
	length is the number of values needed from last_data
	full is the full amount of values in last_data
	returns a list of converted time values for a full day
	'''
	#get the proper timezone
	if name == 'flab' or name == 'mlab' or name == 'nwsc':
		time_zone = timezone('America/Denver')
	else:
		time_zone = timezone('America/New_York')
	#get the offset from utc time for the timezone
	#uses the current time so that if daylight savings time switched last night, 
	#then yesterday's times would be off by an hour 
	offset = datetime.now(time_zone).strftime('%z')
	#change it from '%HHMM' to an integer representing seconds
	#assumes that MM are both 0
	offset = int(offset)*36
	#get the current times in  a list
	times = current.variables['time_offset'][:]
	#add the current base_time to all the values
	base_time = current.variables['base_time'].getValue()
	times = times + base_time + offset
	#and the same for yesterday
	the_list = []
	if (length > 0):
		last_times = last.variables['time_offset'][:]
		base_time = last.variables['base_time'].getValue()
		#except splice it to size first, then add base time
		last_times = last_times[full - length:full]
		last_times = base_time + last_times + offset
		#create a list and store every value into it in order
		the_list = [a for a in last_times]
	for a in times:
		the_list.append(a)
	return the_list
 
def getVariable(key, current, last, length, full):
	'''
	key is the variable name
	current is the netcdf object from today
	last is the netcdf object from yesterday
	length is the number of values needed from yesterday
	full is the full size of last
	r is the number of points to round to
	returns a list containing the most recent data values from the netcdf's and related to key
	'''
	the_list = []
	if (length > 0):
		#get the values from yesterday and splice them to size
 		temp = last.variables[key][:]
 		temp = temp[full - length:full]
 		#create a list to hold the values
 		the_list = [round(a, TO_ROUND) for a in temp]
 	#get todays values and add them to the list
 	temp = current.variables[key][:]
 	for a in temp:
 		the_list.append(round(a, TO_ROUND))
 	return the_list