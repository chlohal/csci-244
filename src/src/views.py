from django.http import HttpResponse
from django.shortcuts import render
import os
import json

from .debug_json_bucket_api import *

def index(request):
    return HttpResponse(request)


def edit(request, id):
    return render(request, "edit.html", {})