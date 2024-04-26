from django.urls import path

from .block_types import block_types

from .flowchart_storage import FlowchartStorageView
from .canvas_integration import CanvasIntegrationManagerView
from .debug_json_bucket_api import JsonBucketView
from .per_block.qrcode import QrCodeApiView

from django.contrib.auth.decorators import login_required

api_patterns = [
    path("flowcharts", login_required(FlowchartStorageView.as_view())),
    path("flowcharts/<id>", login_required(FlowchartStorageView.as_view())),
    path("flowcharts/<id>/<path>", login_required(FlowchartStorageView.as_view())),
    path("block_types", block_types),
    path("blocks/qrcode", login_required(QrCodeApiView.as_view())),
    path("integrate/canvas", login_required(CanvasIntegrationManagerView.as_view())),
]