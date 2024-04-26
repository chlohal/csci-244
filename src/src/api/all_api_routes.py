from django.urls import path
from .. import views

from .block_types import block_types


api_patterns = [
    path("bucket/<id>", views.JsonBucketView.as_view()),
    path("bucket/<id>/<path>", views.JsonBucketView.as_view()),
    path("block_types", block_types)
]