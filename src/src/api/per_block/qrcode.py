from datetime import datetime
from hashlib import sha256
from random import random
import json
from uuid import UUID, uuid4

from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


from django.views.generic import TemplateView

from ...models import Flowchart, QrCodeId

@method_decorator(csrf_exempt, name="dispatch")
class QrCodeApiView(TemplateView):
    def post(self, request):
        try:
            body = json.loads(request.body)
            flowchart = Flowchart.objects.get(id=UUID(hex=body["flowchart_id"]))


            new_obj, created = QrCodeId.objects.get_or_create(
                flowchart=flowchart,
                block_in_flowchart_id=body["block_id"]
            )

            id = new_obj.uuid

            return JsonResponse(str(id), safe=False, status=201)
        except Exception as e:
            print(e)
            return HttpResponseBadRequest(request)