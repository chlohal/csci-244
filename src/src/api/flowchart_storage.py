from datetime import datetime
from hashlib import sha256
from random import random
import json

from django.http import HttpResponseBadRequest, JsonResponse, HttpResponse

from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from ..models import Flowchart


buckets = {}

from django.views.generic import TemplateView

@method_decorator(csrf_exempt, name="dispatch")
class FlowchartStorageView(TemplateView):
    def post(self, request):
        try:
            body = json.loads(request.body)
            name = str(body)
            if(name == ""):
                return HttpResponseBadRequest(request)
            
            new_chart = Flowchart.objects.create(
                user=request.user,
                name=name, 
                contents={"blocks": dict()}
            )
            return JsonResponse({ "id": new_chart.id }, status=201)
        except:
            return HttpResponseBadRequest(request)
        
    def delete(self, request, *args, **kwargs):
        try:
            id = kwargs["id"]
            chart = get_object_or_404(Flowchart, id=id)
            
            if chart.user != request.user:
                return HttpResponse(status=403)

            chart.delete()

            return HttpResponse(content=204)
        except:
            return HttpResponseBadRequest(request)

    def put(self, request, *args, **kwargs):
        try:
            id = kwargs["id"]
            chart = get_object_or_404(Flowchart, id=id)
            
            if chart.user != request.user:
                return HttpResponse(status=403)

            body = json.loads(request.body)
            chart.contents = body
            chart.last_edit = datetime.now()
            chart.save()

            return JsonResponse({ "saved": True, "id": id })
        except:
            return HttpResponseBadRequest(request)
        
    def patch(self, request, *args, **kwargs):
        try:
            id = kwargs["id"]
            chart = get_object_or_404(Flowchart, id=id)
            
            if chart.user != request.user:
                return HttpResponse(status=403)
            
            bucket_target = chart.contents
            path = kwargs["path"].split(".")

            for path_component in path[0:-1]:
                print(path_component)
                if path_component not in bucket_target:
                    bucket_target[path_component] = {}

                bucket_target = bucket_target[path_component]
            try: 
                if request.body == b"undefined" or len(request.body) == 0:
                    bucket_target.pop(path[-1])
                else:
                    bucket_target[path[-1]] = json.loads(request.body)
            except:
                return HttpResponseBadRequest(request)

            chart.last_edit = datetime.now()
            chart.save()

            return JsonResponse({ "saved": True, "id": id })
        except:
            return HttpResponseBadRequest(request)

    def get(self, request, *args, **kwargs):
        try:
            id = kwargs["id"]
            chart = get_object_or_404(Flowchart, id=id)
            
            if chart.user != request.user:
                return HttpResponse(status=403)


            return JsonResponse(chart.contents, safe=False)
        except:
            return HttpResponseBadRequest(request)
