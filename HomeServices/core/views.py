from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authtoken.serializers import AuthTokenSerializer
from knox.auth import AuthToken
from .serializers import RegisterSerializer, UserConfirmEmailSerializer, NormalUserSerializer, ListUsersSerializer, PasswordResetSerializer, UpdateNormalUser, ForgetPasswordResetSerializer, CheckForgetPasswordSerializer, UpdateUserPhotoSerializer , ChargeBalanceSerializer
from rest_framework.views import APIView
from django.shortcuts import render
from drf_spectacular.utils import extend_schema
from rest_framework import status, generics, permissions, parsers
from .models import Balance
from .spectacular_serializers import LoginSpectacular, UpdateProfileSpectacular, ConfirmCodeSpectacular, ResendCodeEmailSpectacular, MyBalanceSpectacular, ForgetPasswordResetSpectacular, CheckForgetPasswordSpectacular, UpdateNormalUserSpectacular
from .models import NormalUser, User
from services.serializers import Area, AreaSerializer, CategorySerializer
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
import random
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def get_user_info(user, host):
    if not user.photo:
        photo = None
    else:
        photo = host+user.photo.url
    if user.normal_user.average_fast_answer:
        average_fast_answer = user.normal_user.average_fast_answer
    else:
        average_fast_answer = None

    clients_number = 0
    for service in user.normal_user.home_services_seller.all():
        clients_number += service.number_of_served_clients
    # delta = average_fast_answer
    # if delta is not None :
    #     hours, remainder = divmod(delta.seconds, 3600)
    #     minutes, seconds = divmod(remainder, 60)
    #     time_string = f"{hours:02} hours , {minutes:02} minutes"

    #     days_string = f"{delta.days} days , " if delta.days else ""
    #     average_fast_answer = f"{days_string}{time_string}"

    average_rating = 0
    number_of_rated_services = 0
    if user.normal_user.home_services_seller.count() > 0:
        for service in user.normal_user.home_services_seller.all():
            if service.average_ratings != 0:
                average_rating += service.average_ratings
                number_of_rated_services += 1
        if number_of_rated_services > 0:
            average_rating /= number_of_rated_services

    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'mode': user.mode,
        'photo': photo,
        'birth_date': user.birth_date,
        'date_joined': user.date_joined,
        'gender': user.gender,
        'bio': user.normal_user.bio,
        'clients_number': clients_number,
        'services_number': user.normal_user.home_services_seller.count(),
        'average_fast_answer': average_fast_answer,
        'average_rating': average_rating,
        'area_id': user.area.id,
        'area_name': user.area.name,
    }


def Confirm_process(request):
    if request.user.is_active:

        return Response({'detail': "Email already verified"}, status=status.HTTP_400_BAD_REQUEST)

    if request.user.next_confirm_try is None or request.user.next_confirm_try <= timezone.now():
        request.user.confirmation_tries = 3
        request.user.next_confirm_try = timezone.now() + timedelta(hours=24)
        request.user.save()

    if request.user.confirmation_tries == 0:
        return Response({"detail": f"Try again after {request.user.next_confirm_try - timezone.now()}"}, status=status.HTTP_400_BAD_REQUEST)

    if request.user.confirmation_code == request.data.get('confirmation_code', None):
        request.user.is_active = True
        request.user.confirmation_code = None
        request.user.save()
        return Response({'detail': "Email verified successfully"}, status=status.HTTP_200_OK)
    else:
        request.user.confirmation_tries -= 1
        request.user.save()
        if request.user.confirmation_tries == 0:
            request.user.next_confirm_try = timezone.now() + timedelta(hours=24)
            request.user.save()
            return Response({"detail": f"Try again after{request.user.next_confirm_try - timezone.now()}"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Wrong code please try again"}, status=status.HTTP_400_BAD_REQUEST)


def send_process_verify_email(user):
    if user.is_active:
        return Response({'detail': "Email already verified"}, status=status.HTTP_400_BAD_REQUEST)
    if user.next_confirmation_code_sent is None or user.next_confirmation_code_sent <= timezone.now():
        user.resend_tries = 3
        user.next_confirmation_code_sent = timezone.now() + timedelta(hours=24)
        user.save()

    if user.resend_tries == 0:
        return Response({"detail": f"Can't send , try again after {user.next_confirmation_code_sent - timezone.now()}"}, status=status.HTTP_400_BAD_REQUEST)

    user.resend_tries -= 1
    user.confirmation_code = str(random.randint(100000, 999999))
    user.next_confirmation_code_sent = timezone.now() + timedelta(hours=24)
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

    return Response({"detail": "Code sent successfully , Please check your email inbox"}, status=status.HTTP_200_OK)


@extend_schema(
    request=AuthTokenSerializer,
    responses={200: LoginSpectacular, 400: None}
)
@api_view(['POST'])
def login_api(request):
    data = dict()
    data['username'] = request.data.get('username', '')
    data['password'] = request.data.get('password', '')
    if 'username' not in request.data and 'email' in request.data:
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(request.data['email'])
        except ValidationError:
            return Response({"email": ["Please input a valid email"]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            username = User.objects.get(email=request.data['email'])
        except User.DoesNotExist:
            return Response({"email": ["Email does not exist"]}, status=status.HTTP_400_BAD_REQUEST)
        data['username'] = username.username
        if not username.is_active:
            return Response({"email": ["Email must be confirmed"]}, status=status.HTTP_400_BAD_REQUEST)
    elif 'username' in request.data:
        try:
            current_user = User.objects.get(username=request.data['username'])
        except User.DoesNotExist:
            return Response({"username": ["Username does not exist"]}, status=status.HTTP_400_BAD_REQUEST)
        if not current_user.is_active:
            return Response({"email": ["Email must be confirmed"]}, status=status.HTTP_400_BAD_REQUEST)
    serializer = AuthTokenSerializer(data=data)
    if not serializer.is_valid():
        return Response({"detail": serializer.errors, "data": data}, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.validated_data['user']
    _, token = AuthToken.objects.create(user)
    host = 'http://' + request.get_host()
    return Response({
        'user_info': get_user_info(user, host),
        'token': {token}
    })


class RegisterUser(APIView):

    @extend_schema(
        responses={200: AreaSerializer(many=True)},
        description="list of area",

    )
    def get(self, request):
        serializer = AreaSerializer(Area.objects.all().order_by('name'), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=RegisterSerializer,
        responses={201: None},
    )
    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        normal_user = NormalUserSerializer(data=request.data)
        normal_user.is_valid(raise_exception=True)
        user = serializer.save()
        normal_user = normal_user.save(user=user)
        Balance.objects.create(user=normal_user)
        return Response({'detail': 'account registered please confirm your email.'}, status=status.HTTP_201_CREATED)


class ListUsers(APIView):
    @extend_schema(
        responses={200: ListUsersSerializer(many=True)}
    )
    def get(self, request):
        queryset = NormalUser.objects.filter(user__mode='seller')
        data = []
        for user in queryset:
            result = dict()
            result['username'] = user.user.username
            result['first_name'] = user.user.first_name
            result['last_name'] = user.user.last_name
            result['photo'] = 'http://' + \
                request.get_host() + user.user.photo.url
            result['average_rating'] = 0
            for service in user.home_services_seller.all():
                result['average_rating'] += service.average_ratings
            if user.home_services_seller.count():
                result['average_rating'] /= user.home_services_seller.count()
            result['categories'] = []
            if user.home_services_seller:
                for home_service in user.home_services_seller.all():
                    if home_service.category:
                        category = dict()
                        category['id'] = home_service.category.id
                        category['name'] = home_service.category.name
                        if home_service.category.photo:
                            category['photo'] = 'http://' + \
                                request.get_host() + home_service.category.photo.url
                        else:
                            category['photo'] = None
                        result['categories'].append(category)

            data.append(result)
        print(data)
        # serializer = ListUsersSerializer(data=data , many=True)
        # serializer.is_valid(raise_exception=False)
        return Response(data, status=status.HTTP_200_OK)


class RetrieveUser(APIView):
    @extend_schema(
        responses={200: LoginSpectacular, 404: None}
    )
    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response('Error 404 Not Found', status=status.HTTP_404_NOT_FOUND)

        if user.is_superuser:
            return Response('Error 404 Not Found', status=status.HTTP_404_NOT_FOUND)
        host = 'http://' + request.get_host()
        return Response(get_user_info(user, host), status=status.HTTP_200_OK)


@extend_schema(
    request=PasswordResetSerializer,
    responses={200: None, 400: None, 401: None}
)
class PasswordResetAPIView(APIView):
    serializer_class = PasswordResetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.password = make_password(
            serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


@extend_schema(
    request=ConfirmCodeSpectacular
)
class UserConfirmMessage(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if 'email' not in request.data:
            return Response({"email": ["This field is required"]}, status=status.HTTP_400_BAD_REQUEST)
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(request.data['email'])
        except ValidationError:
            return Response({"email": ["Please input a valid email"]}, status=status.HTTP_400_BAD_REQUEST)
        if 'confirmation_code' not in request.data:
            return Response({"confirmation_code": ["This field is required"]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            request.user = User.objects.get(email=request.data['email'])
        except User.DoesNotExist:
            return Response({"detail": "Email does not exist"}, status=status.HTTP_400_BAD_REQUEST)
        return Confirm_process(request=request)


@extend_schema(
    request=ResendCodeEmailSpectacular,
    responses={200: None, 400: None, 404: None, 500: None}
)
class ResendEmailMessage(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if 'email' not in request.data:
            return Response({"email": ["This field is required"]}, status=status.HTTP_400_BAD_REQUEST)
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(request.data['email'])
        except ValidationError:
            return Response({"email": ["Please input a valid email"]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=request.data['email'])
        except User.DoesNotExist:
            return Response({"detail": "Email does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        return send_process_verify_email(user=user)


class UpdateUser(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser]
    @extend_schema(
        responses={200: UpdateProfileSpectacular, 401: None},
        description="Note : The area is all area in the database "

    )
    def get(self, request):
        user = request.user
        host = 'http://' + request.get_host()
        context = get_user_info(user, host)
        area = Area.objects.all()
        area = AreaSerializer(data=area, many=True)
        area.is_valid()
        context['area'] = area.data
        return Response(context, status=status.HTTP_200_OK)

    @extend_schema(
        request=UpdateNormalUser,
        responses={200: LoginSpectacular, 400: None, 401: None}
    )
    def put(self, request):
        user = request.user
        serializer = UpdateNormalUser(data=request.data, instance=user)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        host = 'http://' + request.get_host()
        return Response(get_user_info(user, host), status=status.HTTP_200_OK)


class UpdateUserPhoto(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser]

    @extend_schema(
        request=UpdateUserPhotoSerializer,
        responses={200: None, 400: None, 401: None}
    )
    def put(self, request):
        user = request.user
        photo_serializer = UpdateUserPhotoSerializer(
            data=request.data, instance=user)
        photo_serializer.is_valid(raise_exception=True)
        photo_serializer.save()
        return Response("Photo Updated Successfully", status=status.HTTP_200_OK)


@extend_schema(
    responses={200: MyBalanceSpectacular, 401: None}
)
class RetrieverMyBalance(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"total_balance": request.user.normal_user.balance.total_balance})


def send_process_forget_password(user):

    if user.next_confirmation_code_sent is None or user.next_confirmation_code_sent <= timezone.now():
        user.resend_tries = 3
        user.next_confirmation_code_sent = timezone.now() + timedelta(hours=24)
        user.save()

    if user.resend_tries == 0:
        return Response({"detail": f"Can't send , try again after {user.next_confirmation_code_sent - timezone.now()}"}, status=status.HTTP_400_BAD_REQUEST)

    user.resend_tries -= 1
    user.forget_password_code = str(random.randint(100000, 999999))
    user.next_confirmation_code_sent = timezone.now() + timedelta(hours=24)
    user.save()
    subject = 'Reset your password'
    message = f'Please use the following 6-digit code to reset your password: {user.forget_password_code}'
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [user.email,]
    send_mail(subject, message, email_from, recipient_list)
    return Response({"detail": "Code sent successfully , Please check your email inbox"}, status=status.HTTP_200_OK)


@extend_schema(
    request=ResendCodeEmailSpectacular,
    responses={200: None, 400: None, 404: None, 500: None}
)
class SendForgetPasswordCode(APIView):
    def post(self, request):
        if 'email' not in request.data:
            return Response({"email": ["This field is required"]}, status=status.HTTP_400_BAD_REQUEST)
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(request.data['email'])
        except ValidationError:
            return Response({"email": ["Please input a valid email"]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=request.data['email'])
        except User.DoesNotExist:
            return Response({"detail": "Email does not exist"}, status=status.HTTP_400_BAD_REQUEST)
        return send_process_forget_password(user=user)


@extend_schema(
    request=ForgetPasswordResetSpectacular,
    responses={200: None, 400: None, 404: None}
)
class ForgetPasswordReset(APIView):
    serializer_class = ForgetPasswordResetSerializer

    def post(self, request):
        if 'email' not in request.data:
            return Response({"email": ["This field is required"]}, status=status.HTTP_400_BAD_REQUEST)
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(request.data['email'])
        except ValidationError:
            return Response({"email": ["Please input a valid email"]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=request.data['email'])
        except User.DoesNotExist:
            return Response({"detail": "Email does not exist"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.serializer_class(
            data=request.data, context={'user': user})
        serializer.is_valid(raise_exception=True)
        user.password = make_password(
            serializer.validated_data['new_password'])
        user.forget_password_code = None
        user.save()
        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


@extend_schema(
    request=CheckForgetPasswordSpectacular,
    responses={200: None, 400: None, 404: None}
)
class CheckForgetPasswordCode(APIView):
    serializer_class = CheckForgetPasswordSerializer

    def post(self, request):
        if 'email' not in request.data:
            return Response({"email": ["This field is required"]}, status=status.HTTP_400_BAD_REQUEST)
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(request.data['email'])
        except ValidationError:
            return Response({"email": ["Please input a valid email"]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=request.data['email'])
        except User.DoesNotExist:
            return Response({"detail": "Email does not exist"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.serializer_class(
            data=request.data, context={'user': user})

        serializer.is_valid(raise_exception=True)
        return Response("👍")


@extend_schema(
    request=AuthTokenSerializer,
    responses={200: LoginSpectacular, 400: None}
)
@api_view(['POST'])
def login_provider(request):
    data = dict()
    data['username'] = request.data.get('username', '')
    data['password'] = request.data.get('password', '')
    if 'username' not in request.data and 'email' in request.data:
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(request.data['email'])
        except ValidationError:
            return Response({"email": ["Please input a valid email"]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            username = User.objects.get(email=request.data['email'])
        except User.DoesNotExist:
            return Response({"email": ["Email does not exist"]}, status=status.HTTP_400_BAD_REQUEST)
        data['username'] = username.username
        if not username.is_active:
            return Response({"email": ["Email must be confirmed"]}, status=status.HTTP_400_BAD_REQUEST)
    elif 'username' in request.data:
        try:
            current_user = User.objects.get(username=request.data['username'])
        except User.DoesNotExist:
            return Response({"username": ["Username does not exist"]}, status=status.HTTP_400_BAD_REQUEST)
        if not current_user.is_active:
            return Response({"email": ["Email must be confirmed"]}, status=status.HTTP_400_BAD_REQUEST)
    serializer = AuthTokenSerializer(data=data)
    if not serializer.is_valid():
        return Response({"detail": serializer.errors, "data": data}, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.validated_data['user']
    if not user.is_provider:
        return Response({"detail": 'Your account does not support this feature'}, status=status.HTTP_400_BAD_REQUEST)

    _, token = AuthToken.objects.create(user)
    if user.is_staff:
        balance = -1
    else:
        balance = user.normal_user.balance.total_balance
    response = {
        'is_admin': user.is_staff,
        'balance': balance,
        'token': {token}
    }
    return Response(response)

class ChargeBalance(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self , request ):
        serializer = ChargeBalanceSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        try :
            user = User.objects.get(username = serializer.validated_data['username'])
        except User.DoesNotExist :
            return Response({'detail' : "User dose not exist"} , status=status.HTTP_404_NOT_FOUND)
        if not user.normal_user :
            return Response({'detail' : "User dose not exist"} , status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_staff :
            if request.user.normal_user.balance.total_balance < serializer.validated_data['charged_balance'] :
                return Response({'detail':"You don't have enough balance"} , status=status.HTTP_400_BAD_REQUEST)
            request.user.normal_user.balance.total_balance -= serializer.validated_data['charged_balance']
        user.normal_user.balance.total_balance += serializer.validated_data['charged_balance']
        if not request.user.is_staff :
            request.user.normal_user.balance.save()
        user.normal_user.balance.save()
        return Response('Success')
