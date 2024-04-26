from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views.generic import CreateView
from django.http import HttpResponse
from django.shortcuts import redirect, render
import os
from json import dumps

from .models import CanvasToken, Flowchart

def index(request):
    if request.user != None:
        return redirect("/my-flows")
    return render(request, "index.html")

def create_flow_view(request):
    return render(request, "create.html")

def list_flows_view(request):
    flows = Flowchart.objects.filter(user=request.user).only("name", "id").all()
    return render(request, "flows.html", { "flows": flows })


def edit(request, id):
    canvas_token_exists = CanvasToken.objects.filter(user=request.user).exists()
    
    return render(request, "edit.html", { 
        "canvas_token_exists": dumps(canvas_token_exists)
    })

def present_qr_code(request, **kwargs):
    return render(request, "qr/present.html", {
        "qrcode": kwargs['qrcode']
    })


class SignUpView(CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"