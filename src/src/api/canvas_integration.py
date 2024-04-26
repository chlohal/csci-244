from datetime import datetime
from hashlib import sha256
from random import random
import json

from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


from django.views.generic import TemplateView
import requests

from ..models import CanvasToken

@method_decorator(csrf_exempt, name="dispatch")
class CanvasIntegrationManagerView(TemplateView):
    def post(self, request):
        try:
            body = json.loads(request.body)

            token = body["token"]
            api_url = body["api_url"]
            
            url = api_url + '/api/v1/courses'
            headers = {'Authorization': f'Bearer {token}'}
            courses = requests.get(url, headers=headers).json()

            if isinstance(courses, dict) and "erorrs" in dict:
                return HttpResponseBadRequest(request)

            CanvasToken.objects.get_or_create(
                user=request.user,
                token=token,
                api_url=api_url
            )
            return HttpResponse(status=201)
        except:
            return HttpResponseBadRequest()
    
    def get(self, request, *args, **kwargs):
        try:
            tkn = request.canvastoken.token
            print(request.user)
            return JsonResponse(tkn, safe=False)
        except:
            return HttpResponse(status=404)