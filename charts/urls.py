from django.conf.urls import patterns, include, url
from charts import views

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
	url("", include('django_socketio.urls')),
    url(r'^$', views.homePage),
    url(r'^flab/$', views.flab),
    url(r'^mlab/$', views.mlab),
    url(r'^nsf/$', views.nsf),
    url(r'^nwsc/$', views.nwsc),
)
