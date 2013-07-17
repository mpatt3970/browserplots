from django.shortcuts import render
from numpy import *
from netCDF4 import *
import datetime
import simplejson as json
import time

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

def openFile(name, days_ago):
	#get the date to set the filename
	now = datetime.datetime.now()
	year = str(now.year)
	month = str(now.month).zfill(2)
	day = str(now.day - days_ago).zfill(2)
	filename = '/net/www/weather/' + name + '/data/' + name + '.' + year + month + day + '.cdf'
	#open the file and store it in data
	data = Dataset(filename)
	return data

def getData(labName):
	#number of data points to send
	numPoints = 288
	#number of values to round data values to
	toRound = 4

	data = openFile(labName, 0)
	ydata = openFile(labName, 1)
	ybtime = ydata.variables['base_time'].getValue();
	ytimes = ydata.variables['time_offset'][:]
	#get the base time
	btime = data.variables['base_time'].getValue()
	#store the subsequent times in an array
	times = data.variables['time_offset'][:]
	fullDay = ytimes.size
	ylength = numPoints - times.size
	ystart = ytimes.size - ylength
	ytimes[ystart:fullDay]
	ytimes = ytimes + btime

	
	#offset each value in time by the base_time
	times = times + btime
	time_list = [ a for a in ytimes ]
	for a in times:
		time_list.append(a)
	holder = {'time': time_list}
	#create a list of variables to ignore
	toIgnore = ['base_time', 'samp_secs', 'lat', 'lon', 'alt', 'station', 'time_offset']
	for x in ydata.variables.keys():
		for y in toIgnore:
			if (x == y):
				break
		else:
			temp = ydata.variables[x][:]
			temp = temp[ystart:fullDay]
			rounded_list = [ round(elem, toRound) for elem in temp ]
			holder[x] = rounded_list
	#iterate through every variable key
	for x in data.variables.keys():
		#ignore certain variables by checking against a list of what to ignore
		#and breaking the loop in those cases
		for y in toIgnore:
			if (x == y):
				break
		#continue for the right variables
		else:
			#store the variable in temp
			temp = data.variables[x][:]
			rounded_list = [ round(elem, toRound) for elem in temp ]
			for a in rounded_list:
				holder[x].append(a)
	data.close()
	ydata.close()
	j = json.dumps(holder)
	return j

