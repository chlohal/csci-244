from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views.generic import CreateView
from django.http import HttpResponse
from django.shortcuts import render
import os
import json

from .debug_json_bucket_api import *

def index(request):
    return HttpResponse(request)


def edit(request, id):
    return render(request, "edit.html", {})


class SignUpView(CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"