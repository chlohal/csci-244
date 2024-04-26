from datetime import datetime
from hashlib import sha256
from random import random
import json

from django.http import HttpResponseBadRequest, JsonResponse

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


buckets = {}

from django.views.generic import TemplateView

@method_decorator(csrf_exempt, name="dispatch")
class QrCodeApiView(TemplateView):
    def post(self, request):
        id = sha256(datetime.now() + str(random()))
        try:
            body = json.loads(request.body)
            buckets[id] = body 
            return JsonResponse({ "bucket_id": id })
        except:
            return HttpResponseBadRequest(request)
        

    def put(self, request, *args, **kwargs):
        id = kwargs["id"]
        try:
            body = json.loads(request.body)
            buckets[id] = body 
            return JsonResponse({ "bucket_id": id })
        except:
            return HttpResponseBadRequest(request)
    def patch(self, request, *args, **kwargs):
        id = kwargs["id"]
        if id not in buckets:
            buckets[id] = {}
        bucket = buckets.get(kwargs["id"])
        bucket_target = bucket
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

        return JsonResponse({ "bucket_id": id })

    def get(self, request, *args, **kwargs):
        print(self.request.path)
        return JsonResponse(buckets.get(kwargs["id"]), safe = False)
