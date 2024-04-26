from datetime import date
from uuid import UUID
from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views.generic import CreateView
from django.http import HttpResponse
from django.shortcuts import redirect, render
import os
from json import dumps
import qrcode

from .models import AttendanceDayPolyfillRecordings, CanvasToken, Flowchart

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

def render_qr_code(request):
    resp = HttpResponse(content_type="image/png")
    qrcode.make(request.GET.get("data")).save(resp, "PNG")
    return resp

def edit_attendance(request, **kwargs):
    try: 
        if request.GET.get("delete", None):
            to_del = request.GET.get("delete", None)
            AttendanceDayPolyfillRecordings.objects.filter(id=to_del).delete()
        
        day = request.GET.get("day", date.today().strftime("%Y-%m-%d"))
        day = date(*[int(x or 0) for x in day.split("-")])
        day_ymd = day.strftime("%Y-%m-%d")

        chart_id = UUID(hex=kwargs['flowchart'])

        if Flowchart.objects.get(id=chart_id).user != request.user:
            return HttpResponse(status=403)
        
        recordings = AttendanceDayPolyfillRecordings.objects.filter(by_flowchart=chart_id, recorded_at__date=day).all()

        return render(request, "edit-attendance.html", { "recordings": recordings, "day": day, "day_ymd": day_ymd })
    except:
        return HttpResponse(status=400)

class SignUpView(CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"