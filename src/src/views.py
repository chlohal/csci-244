from django.http import HttpResponse
from django.shortcuts import render
import os
import json

def index(request):
    return HttpResponse(request)


def edit(request):
    return render(request, "edit.html", {})
