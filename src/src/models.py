from django.db import models

class Student(models.Model):
    name = models.TextField()
    uuid = models.TextField()

class BlockCategory(models.Model):
    name = models.CharField(max_length = 60, primary_key=True)
    color = models.CharField(max_length = 7)

class BlockType(models.Model):
    category = models.ForeignKey(BlockCategory, on_delete = models.CASCADE)
    name = models.CharField(max_length = 30)
    id = models.CharField(max_length = 164, primary_key=True)

class BlockFlow(models.Model):
    block = models.ForeignKey(BlockType, on_delete = models.CASCADE)
    id = models.CharField(max_length=50, primary_key=True)
    label = models.CharField(max_length=65)
    flow_type = models.CharField(max_length=30)
    is_input = models.BooleanField()