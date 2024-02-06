from django.http import HttpResponse
from django.shortcuts import render
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def index(request):
    ...


def edit(request):
    return render(request, "edit.html", {})
