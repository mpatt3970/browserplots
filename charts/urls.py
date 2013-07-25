from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('charts.views',
    (r'^$', 'homePage'),
    (r'^flab/$', 'flab'),
    (r'^mlab/$', 'mlab'),
    (r'^nsf/$', 'nsf'),
    (r'^nwsc/$', 'nwsc'),
    (r'^ajax/$', 'ajax'),
)
