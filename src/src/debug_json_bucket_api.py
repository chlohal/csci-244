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
class JsonBucketView(TemplateView):
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

    def get(self, request, *args, **kwargs):
        print(self.request.path)
        return JsonResponse({"data": buckets.get(kwargs["id"])})