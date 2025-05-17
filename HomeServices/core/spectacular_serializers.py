from rest_framework import serializers
from .models import User , Balance ,NormalUser

class  LoginSpectacular(serializers.ModelSerializer):
    bio = serializers.CharField(max_length = 1000)
    average_fast_answer = serializers.DurationField()
    clients_number  = serializers.IntegerField()
    services_number = serializers.IntegerField()
    average_rating = serializers.FloatField()
    area_id = serializers.IntegerField()
    area_name= serializers.CharField()
    class Meta :
        model = User
        fields = ['id','username','email','first_name','last_name',
                  'mode','photo','birth_date','date_joined','gender','bio','average_fast_answer' ,'clients_number','services_number','average_rating' , 'area_id','area_name']

class ListAreaSpectacular(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
class UpdateProfileSpectacular(serializers.ModelSerializer):
    bio = serializers.CharField(max_length = 1000)
    average_fast_answer = serializers.DurationField()
    clients_number  = serializers.IntegerField()
    services_number = serializers.IntegerField()
    area = ListAreaSpectacular(many=True)
    class Meta :
        model = User
        fields = ['id','username','email','first_name','last_name',
                  'mode','photo','birth_date','date_joined','gender','bio','average_fast_answer' ,'clients_number','services_number' , 'area']
        

class ResendCodeEmailSpectacular(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
    )
class ConfirmCodeSpectacular(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
    )
    confirmation_code = serializers.CharField()

class MyBalanceSpectacular(serializers.ModelSerializer):
    class Meta :
        model = Balance
        fields = ['total_balance']

class ForgetPasswordResetSpectacular(serializers.Serializer):
    email = serializers.EmailField(required=True)
    forget_password_code = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password2= serializers.CharField(required=True)

class CheckForgetPasswordSpectacular(serializers.Serializer):
    email = serializers.EmailField(required=True)
    forget_password_code = serializers.CharField(required=True)

class UpdateUserSpectacular(serializers.ModelSerializer):
    class Meta :
        model = User
        fields = ['first_name','last_name','birth_date','area']

class UpdateNormalUserSpectacular(serializers.ModelSerializer):
    user = UpdateUserSpectacular()
    photo = serializers.ImageField(max_length = 128 , required=False)
    bio = serializers.CharField(max_length = 512 , required= False , allow_blank=True)
    class Meta :
        model = NormalUser
        fields = ['photo','bio','user']
