from django.db import models

class Student(models.Model):
    name = models.TextField()
    uuid = models.TextField()
