from datetime import datetime
from hashlib import sha256
from random import random
import json

from django.http import HttpResponseBadRequest, JsonResponse

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


buckets = {}

from django.views.generic import TemplateView

from ..models import BlockCategory, BlockFlow, BlockType

def block_types(request):
    
    return JsonResponse([
        {"name": cat.name,
        "color": cat.color,
        "blocks": [
            {
                "name": block.name,
                "id": block.id,
                "flows": [
                    {
                        "label": flow.label,
                        "type": flow.flow_type,
                        "id": flow.id,
                        "is_input": flow.is_input
                     } for flow in block.blockflow_set.all()
                ]
             } for block in cat.blocktype_set.all()
        ]
        }
        for cat in BlockCategory.objects.all()
    ], safe=False)
