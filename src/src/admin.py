from django.contrib import admin

# Register your models here.
from .models import BlockCategory, BlockType, BlockFlow

admin.site.register(BlockCategory)
admin.site.register(BlockType)
admin.site.register(BlockFlow)