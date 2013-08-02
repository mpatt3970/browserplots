'''if default is true, then all graphs will be treated as individual line plots and will use the available attributes from the netCDF file to fill out these arrays'''
DEFAULT = False


FILE_PATH = '/net/www/weather/'
CALL_TIMEOUT = 5000
NUM_POINTS = 288
TO_ROUND = 4
VARIABLE_KEYS = ['tdry', 'dp', 'rh', 'cpres0', 'wdir', 'wspd', 'wmax', 'raina']
NAME_MAP = ['Temperature', 'Dew Point', 'Relative Humidity', 'Pressure corrected to Sea Level', 'Wind Direction', 'Wind Speed', 'Peak Gust', 'Rain']
M_UNIT_MAP = ['Celsius', 'Celsius', 'percent', 'hPa', 'degrees', 'meters/second', 'meters/second', 'millimeters' ]
E_UNIT_MAP = ['Fahrenheit', 'Fahrenheit', 'percent', 'inches Hg', 'degrees', 'miles/hours', 'miles/hour', 'inches']
PLOT_MAP = ['line-1', 'line-1', 'line-2', 'line-3', 'scatter-1', 'line-4', 'line-4', 'line-5']