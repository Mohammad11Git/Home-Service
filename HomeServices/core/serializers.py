from rest_framework import serializers
from .models import User , Balance , NormalUser
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from django.utils.http import urlsafe_base64_encode ,urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.urls import reverse
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.validators import ValidationError
from services.serializers import CategorySerializer
import random
from datetime import timedelta
from services.serializers import AreaSerializer
from django.template.loader import render_to_string
from django.utils.html import strip_tags

gender_choices = [('Male', 'Male'), ('Female', 'Female')]
mode_choices = [('client', 'buyer'), ('seller', 'seller_buyer')]

class UserConfirmEmailSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()

    def validate(self, data):
        try:
            uid = urlsafe_base64_decode(data['uidb64']).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        if user is not None and default_token_generator.check_token(user, data['token']):
            user.is_active = True
            user.email_confirmed_at = timezone.now()
            user.save()
            return data
        else:
            raise serializers.ValidationError('Invalid or expired confirmation link')


class BalanceSerializer(serializers.ModelSerializer):
    class Meta :
        model= Balance
        fields = ['total_balance','pending_balance','withdrawable_balance','earnings']

class NormalUserSerializer(serializers.ModelSerializer):
    class Meta :
        model = NormalUser
        fields = ['bio']

class ListUsersSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True)
    average_rating = serializers.FloatField()
    class Meta :
        model = User
        fields = ['username','first_name','last_name','photo' ,'categories','average_rating']

class  RetrieveUserSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(max_length = 1000)
    date_joined = serializers.DateTimeField(format = '%Y-%m-%d %H:%M:%S')
    class Meta :
        model = User
        fields = ['id','username','email','first_name','last_name','mode','photo','birth_date','date_joined','gender','bio']

class PasswordResetSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password2= serializers.CharField(required=True)
    def validate_new_password(self, value):
        user = self.context['request'].user
        try:
            validate_password(password=value, user=user)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect password.")
        return value
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2'] :
            raise serializers.ValidationError({"password": "New password fields didn't match."})
        return super().validate(attrs)


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
            required=True,
            validators=[UniqueValidator(queryset=User.objects.all())]
            )

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    birth_date = serializers.DateField(required=False)
    gender = serializers.ChoiceField(choices=gender_choices, required=True)
    mode = serializers.ChoiceField(choices=mode_choices, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name', 'birth_date', 'gender', 'mode', 'area')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'area': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            birth_date=validated_data.get('birth_date', None),
            gender=validated_data['gender'],
            mode=validated_data['mode'],
            area=validated_data['area']
        )
        user.set_password(validated_data['password'])
        user.is_active = False
        user.confirmation_tries = 3
        user.resend_tries = 2
        user.confirmation_code = str(random.randint(100000, 999999))
        user.save()

        # subject = 'Confirm your email'
        # message = f'Please use the following 6-digit code to confirm your email address: {user.confirmation_code}'
        # email_from = settings.EMAIL_HOST_USER
        # recipient_list = [user.email,]
        # send_mail(subject, message, email_from, recipient_list)
        
        subject = 'Confirm your email'
        html_message = render_to_string('core/email_confirmation.html', {'code': user.confirmation_code})
        plain_message = strip_tags(html_message)
        from_email = settings.EMAIL_HOST_USER
        to = user.email

        send_mail(subject, plain_message, from_email, [to], html_message=html_message)

        return user

class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta :
        model = User
        fields = ['first_name','last_name','birth_date','area']

class UpdateNormalUser(serializers.ModelSerializer):
    user = UpdateUserSerializer()
    bio = serializers.CharField(max_length = 512 , required= False , allow_blank=True)
    class Meta :
        model = NormalUser
        fields = ['bio','user']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data is not None:
            if 'area' not in user_data:
                raise serializers.ValidationError({"area":"This field is required"})
            user_data['area']= user_data['area'].id
            user_serializer = UpdateUserSerializer(instance=instance, data=user_data)
            user_serializer.is_valid(raise_exception=True)
            user_serializer.save()

        if validated_data.get('bio' , None) is not None:
            instance.normal_user.bio = validated_data['bio']

        instance.save()
        instance.normal_user.save()
        return instance
class UpdateUserPhotoSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(max_length = 128 , required=False)
    class Meta :
        model = User
        fields = ['photo']
    def update(self, instance, validated_data):
        photo = validated_data.get('photo',None)
        if photo is not None :
            instance.photo.save(photo.name , photo , save=False)
        else :
            instance.photo= None
        instance.save()
        return instance
class ForgetPasswordResetSerializer(serializers.Serializer):
    forget_password_code = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password2= serializers.CharField(required=True)
    def validate_new_password(self, value):
        user = self.context['user']
        try:
            validate_password(password=value, user=user)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    def validate_forget_password_code(self, value):
        user = self.context['user']
        if user.forget_next_confirm_try is None or user.forget_next_confirm_try <= timezone.now() :
            user.forget_confirmation_tries = 3
            user.forget_next_confirm_try = timezone.now() + timedelta(hours=24)
            user.save()

        if user.forget_confirmation_tries == 0 :
            raise serializers.ValidationError(f"Try again after {user.forget_next_confirm_try - timezone.now()}")

        else :
            if user.forget_password_code is not None and user.forget_password_code == value :
                return value
            user.forget_confirmation_tries -=1
            user.save()
            if user.forget_confirmation_tries ==0 :
                user.forget_next_confirm_try = timezone.now() + timedelta(hours=24)
                user.save()
                raise serializers.ValidationError(f"Try again after {user.forget_next_confirm_try - timezone.now()}")
            raise serializers.ValidationError("Wrong code please try again 🙃")

    def validate(self, attrs):
        if 'new_password' not in attrs or 'new_password2' not in attrs or attrs['new_password'] != attrs['new_password2'] :
            raise serializers.ValidationError({"password": "New password fields didn't match."})
        return super().validate(attrs)

class CheckForgetPasswordSerializer(serializers.Serializer):
    forget_password_code = serializers.CharField(required=True)

    def validate_forget_password_code(self, value):
        user = self.context['user']
        if user.forget_next_confirm_try is None or user.forget_next_confirm_try <= timezone.now() :
            user.forget_confirmation_tries = 3
            user.forget_next_confirm_try = timezone.now() + timedelta(hours=24)
            user.save()

        if user.forget_confirmation_tries == 0 :
            raise serializers.ValidationError(f"Try again after {user.forget_next_confirm_try - timezone.now()}")

        else :
            if user.forget_password_code is not None and user.forget_password_code == value :
                return value
            user.forget_confirmation_tries -=1
            user.save()
            if user.forget_confirmation_tries ==0 :
                user.forget_next_confirm_try = timezone.now() + timedelta(hours=24)
                user.save()
                raise serializers.ValidationError(f"Try again after {user.forget_next_confirm_try - timezone.now()}")
            raise serializers.ValidationError("Wrong code please try again 🙃")


class ChargeBalanceSerializer(serializers.Serializer):
    charged_balance = serializers.IntegerField()
    username = serializers.CharField()


    def validate_charged_balance(self , value):
        if value <=0 :
            raise serializers.ValidationError("This field must be positive")
        return value
