from datetime import datetime
from hashlib import sha256
from random import random
import json

from django.http import HttpRequest, HttpResponse, HttpResponseBadRequest, JsonResponse

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
            tkn = request.user.canvastoken.token
            return JsonResponse(tkn, safe=False)
        except:
           return HttpResponse(status=404)
        
@method_decorator(csrf_exempt, name="dispatch")
class CanvasApiProxyView(TemplateView):
    def dispatch(self, request: HttpRequest, *args, **kwargs) -> HttpResponse:
        try:
            api_url = request.user.canvastoken.api_url
            tkn = request.user.canvastoken.token

            print(api_url)
            built_url = api_url + "/api/" + kwargs["api_query_path"]

            body = None
            if len(request.body):
                body = request.body

            resp = requests.request(
                url=built_url,
                method=request.method,
                data=body,
                headers={
                    "Accept": "application/json",
                    "Authorization": f"Bearer {tkn}"
                }
            )
            return HttpResponse(content=resp.text, status=resp.status_code, headers={ "Content-Type": "application/json" })
        except:
           return HttpResponse(status=400)