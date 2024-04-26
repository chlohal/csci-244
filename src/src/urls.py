"""
URL configuration for src project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.decorators import login_required

from .client_flows.user_flow import user_flow_view

from .views import SignUpView
from . import views

from .api.all_api_routes import api_patterns

urlpatterns = [
    path('', views.index, name='Index'),
    path('edit/<id>', login_required(views.edit), name="Edit"),
    path('create', login_required(views.create_flow_view), name="Create"),
    path('my-flows', login_required(views.list_flows_view), name="My Flows"),
    path('admin/', admin.site.urls),
    path("accounts/signup/", SignUpView.as_view(), name="signup"),
    path("accounts/", include("django.contrib.auth.urls")),
    path("api/", include(api_patterns)),
    path("qr/render/", views.render_qr_code),
    path("qr/present/<qrcode>", views.present_qr_code),
    path("userflow/<context>/<path:path_remaining>", user_flow_view)
]
