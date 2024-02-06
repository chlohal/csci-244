from django.http import HttpResponse
from django.shortcuts import render
import os


def index(request):
    ...


def edit(request):
    return render(request, "edit.html", {})
