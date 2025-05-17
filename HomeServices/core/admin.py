from django.contrib import admin
#from django.contrib.admin.decorators import ad
# Register your models here.
from .models import User ,NormalUser , Balance

admin.site.register(User)
admin.site.register(NormalUser)
admin.site.register(Balance)
