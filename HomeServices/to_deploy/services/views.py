from rest_framework.views import APIView
from .models import (
    Category,
    Area,
    HomeService,
    Rating,
    GeneralServicesPrice,
    Earnings,
    InputData,
    InputField,
    OrderService,
)
from .serializers import (
    AreaSerializer,
    CategorySerializer,
    RatingSerializer,
    InputFieldSerializer,
    ListOrdersSerializer,
    ListHomeServicesSerializer,
    RetrieveHomeServices,
    CreateHomeServiceSerializer,
    RetrieveUpdateHomeServiceSerializer,
    InputFieldSerializerAll,
    InputDataSerializer,
    RetrieveInputDataSerializer,
    RatingDetailSerializer,
    GetEarningsSerializer,
)
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status, generics
from rest_framework import permissions
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from django.db.models import Q, Avg, F, Sum
from django.db import transaction
from datetime import timedelta
from .spectacular import (
    RetrieveRatingsSpectacular,
    RetrieveRatingsSpectacularForUsername,
)
from datetime import timedelta
from django_q.tasks import schedule
from django_q.models import Schedule
from core.models import NormalUser
import arrow


@transaction.atomic
def taking_money(
    user: NormalUser,
    required_balance: float,
    order: OrderService,
    general_services: list[GeneralServicesPrice],
):
    order.status = "Under Review"
    order.save()
    user.balance.total_balance -= required_balance
    user.balance.save()
    for beneficiary in general_services:
        Earnings.objects.create(
            order=order, earnings=beneficiary.price, beneficiary=beneficiary.beneficiary
        )
    return True


def get_form_data(order: OrderService):
    serializer = RetrieveInputDataSerializer(data=order.input_data_set, many=True)
    serializer.is_valid(raise_exception=False)
    return serializer.data


class IsOwner(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        return obj.seller == request.user.normal_user


class ListCategories(APIView):
    @extend_schema(responses={200: CategorySerializer(many=True)})
    def get(self, request):
        queryset = Category.objects.all()
        serializer = CategorySerializer(data=queryset, many=True)
        serializer.is_valid()
        return Response(serializer.data, status=status.HTTP_200_OK)


def is_rateable(order: OrderService):
    rateable = None
    try:
        order.rating
        rateable = False
    except:
        pass
    if (
        order.expected_time_by_day_to_finish is not None
        and order.answer_time is not None
    ):
        expected_finish_time = order.answer_time + timedelta(
            days=order.expected_time_by_day_to_finish
        )
    else:
        expected_finish_time = None
    if (
        order.status != "Pending"
        and rateable is None
        and (
            order.is_rateable
            or (
                expected_finish_time is not None
                and (timezone.now() > expected_finish_time)
            )
        )
    ):
        rateable = True
    if rateable is None:
        rateable = False
    return rateable


@extend_schema(exclude=True)
class MyOrders(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request):
        queryset = OrderService.objects.filter(client=request.user.normal_user)
        serializer = ListOrdersSerializer(data=queryset, many=True)
        serializer.is_valid(raise_exception=False)
        for i, order in enumerate(queryset):
            serializer.data[i]["client"] = order.client.user.to_dict(request.get_host())
            serializer.data[i]["seller"] = order.home_service.seller.user.to_dict(
                request.get_host()
            )

            serializer.data[i]["form"] = get_form_data(order=order)
            serializer.data[i]["is_rateable"] = is_rateable(order=order)
            serializer.data[i][
                "expected_time_by_day_to_finish"
            ] = order.expected_time_by_day_to_finish
        return Response(serializer.data)


@extend_schema(exclude=True)
class ReceivedOrders(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.mode == "client":
            return Response(
                {
                    "detail": "Error 403 Forbidden , you are a buyer you don't receive orders"
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        queryset = OrderService.objects.filter(
            home_service__seller=request.user.normal_user
        ).filter(~Q(status="Rejected"))
        serializer = ListOrdersSerializer(data=queryset, many=True)
        serializer.is_valid()
        i = 0
        for order in queryset:
            serializer.data[i]["client"] = order.client.user.to_dict(request.get_host())
            serializer.data[i]["seller"] = order.home_service.seller.user.to_dict(
                request.get_host()
            )

            if order.status != "Pending":
                serializer.data[i]["form"] = get_form_data(order=order)
            else:
                serializer.data[i]["form"] = []
            serializer.data[i]["is_rateable"] = is_rateable(order=order)
            serializer.data[i][
                "expected_time_by_day_to_finish"
            ] = order.expected_time_by_day_to_finish
            i += 1
        return Response(serializer.data)


@extend_schema(
    description="NOTE : When you use this api use :<br> 1 - ( services/list_home_services?username=\{username\} ) to filter \
       the services for this user <br> 2 -  ( services/list_home_services?category=\{category name\} ) to filter the services by category\
        3 - ( services/list_home_services?category=\{category name\}&title=\{string you want to contains in the title\} ) to filter the services by category and title<br>\
            4 - else it will returns all services<br>\
                NOTE 2 : If the user is logged in it will be filter by service area depending on his area "
)
class ListHomeServices(generics.ListAPIView):
    queryset = HomeService.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = ListHomeServicesSerializer

    def get_queryset(self):
        areas = []
        if not self.request.user.is_authenticated:
            areas = Area.objects.all()
        else:
            areas = [self.request.user.area]

        queryset = HomeService.objects.filter(service_area__in=areas)

        username = self.request.GET.get("username")
        category = self.request.GET.get("category")
        title = self.request.GET.get("title")

        if username:
            queryset = queryset.filter(seller__user__username=username)

        if category and title:
            queryset = queryset.filter(category__name=category, title__contains=title)
        elif title:
            queryset = queryset.filter(title__contains=title)
        elif category:
            queryset = queryset.filter(category__name=category)

        queryset = queryset.order_by("-average_ratings").distinct()

        return queryset


@extend_schema(responses={200: RetrieveHomeServices})
class HomeServiceDetail(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RetrieveHomeServices
    queryset = HomeService.objects.all()


@extend_schema(exclude=True)
class CreateHomeService(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CreateHomeServiceSerializer


@extend_schema(exclude=True)
class RetrieveUpdateHomeService(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    serializer_class = RetrieveUpdateHomeServiceSerializer
    lookup_url_kwarg = "home_service_id"
    queryset = HomeService.objects.all()


class ListArea(generics.ListAPIView):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [permissions.AllowAny]


@extend_schema(exclude=True)
class DeleteHomeService(generics.DestroyAPIView):
    queryset = HomeService
    serializer_class = CreateHomeServiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    lookup_url_kwarg = "home_service_id"


# this function looks at the previous form and delete it if there is no data connected to it , it will be deleted
def delete_or_update_form(last_newest_input_fields: InputField):
    # check if any one of the previous form fields is connected to data  (its enough to check one filed)
    if last_newest_input_fields[0].field_data.count() == 0:
        last_newest_input_fields.delete()
        return True
    for input_field in last_newest_input_fields:
        input_field.is_newest = False
        input_field.save()
    return True


@extend_schema(exclude=True)
class UpdateFormHomeService(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, home_service_id):
        try:
            home_service = HomeService.objects.get(pk=home_service_id)
        except HomeService.DoesNotExist:
            return Response("404 NOT FOUND", status=status.HTTP_404_NOT_FOUND)

        if home_service.seller != request.user.normal_user:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        queryset = InputField.objects.filter(
            home_service=home_service,
            home_service__seller=request.user.normal_user,
            is_newest=True,
        )
        serializer = InputFieldSerializer(data=queryset, many=True)
        serializer.is_valid(raise_exception=False)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request: Request, home_service_id: int):
        try:
            home_service = HomeService.objects.get(pk=home_service_id)
        except HomeService.DoesNotExist:
            return Response("404 NOT FOUND", status=status.HTTP_404_NOT_FOUND)

        if home_service.seller != request.user.normal_user:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        # TODO edit all the querysets to use is_newest field for filtering
        last_newest_input_fields = InputField.objects.filter(
            home_service=home_service,
            home_service__seller=request.user.normal_user,
            is_newest=True,
        )
        serializer = InputFieldSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        if len(serializer.validated_data) < 3 or len(serializer.validated_data) > 10:
            return Response(
                {"detail": ["Number of fields must be between 3 and 10"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        delete_or_update_form(
            last_newest_input_fields
        )  # i made this function because django dose not run the query until we need to
        # display the data or returns it , so the data will not be deleted after the (put) function ends
        # and all the old data and the created data will be deleted ,so if we didn't make (delete_data function)
        # the (queryset) will not run the query until the (put) function end and all old data
        # and created data will appear when the query run, so it deletes all of it
        serializer.save(home_service=home_service)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(exclude=True)
class MakeOrderService(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, service_id):
        try:
            home_service = HomeService.objects.get(pk=service_id)
        except HomeService.DoesNotExist:
            return Response(
                {"detail": ["404 NOT FOUND"]}, status=status.HTTP_404_NOT_FOUND
            )
        form = home_service.field.filter(is_newest=True)
        serializer = InputFieldSerializerAll(data=form, many=True)
        serializer.is_valid(raise_exception=False)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, service_id):
        try:
            home_service = HomeService.objects.get(pk=service_id)
        except HomeService.DoesNotExist:
            return Response(
                {"detail": ["404 NOT FOUND"]}, status=status.HTTP_404_NOT_FOUND
            )
        if "form_data" not in request.data:
            return Response(
                {"form_data": "This field is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(request.data["form_data"], list):
            return Response(
                {"form_data": "This field must be list"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if "expected_time_by_day_to_finish" not in request.data:
            return Response(
                {"expected_time_by_day_to_finish": "This field is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if home_service.seller == request.user.normal_user:
            return Response(
                {"detail": "You can't order service from yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        rateable_services = OrderService.objects.filter(
            client=request.user.normal_user, is_rateable=True
        )

        if rateable_services.count() > 0:
            return Response(
                {"detail": "You have unrated services please rate it and order again"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        check_sended_orders = OrderService.objects.filter(
            client=request.user.normal_user, home_service=home_service, status="Pending"
        )
        if check_sended_orders.count() > 0:
            return Response(
                {"detail": "you have already ordered this service"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            expected_time_by_day_to_finish = int(
                request.data["expected_time_by_day_to_finish"]
            )
        except ValueError:
            return Response(
                {"expected_time_by_day_to_finish": "This value must be integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = InputDataSerializer(data=request.data["form_data"], many=True)
        serializer.is_valid(raise_exception=True)
        if expected_time_by_day_to_finish is not None and (
            expected_time_by_day_to_finish < 1 or expected_time_by_day_to_finish > 90
        ):
            return Response(
                {
                    "expected_time_by_day_to_finish": "expected_time_by_day_to_finish must be between 1 and 90"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # make sure that all fields belong to this service exist
        validated_data = []
        for input_field_1 in home_service.field.filter(is_newest=True):
            is_exists = False
            for input_field_2 in serializer.data:
                if input_field_1.id == input_field_2["field"]:
                    is_exists = True
                    validated_data.append(input_field_2)
                    break
            if not is_exists:
                return Response(
                    {
                        "detail": f"Error fields are not compatible (you did'nt send field : {input_field_1.id})"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        new_order = OrderService.objects.create(
            client=request.user.normal_user,
            home_service=home_service,
            expected_time_by_day_to_finish=expected_time_by_day_to_finish,
        )
        new_order.save()
        index = 0
        all_fields = home_service.field.filter(is_newest=True)
        for input_data in validated_data:
            InputData.objects.create(
                field=all_fields[index], content=input_data["content"], order=new_order
            ).save()
            index += 1

        return Response("Success", status=status.HTTP_200_OK)


@extend_schema(exclude=True)
class CancelOrder(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, order_id):
        try:
            order = OrderService.objects.get(pk=order_id)
        except OrderService.DoesNotExist:
            return Response(
                {"detail": "404 NOT FOUND"}, status=status.HTTP_404_NOT_FOUND
            )
        if request.user.normal_user != order.client:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        if order.status != "Pending":
            return Response(
                {"detail": "Unexpected error"}, status=status.HTTP_400_BAD_REQUEST
            )
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(exclude=True)
class RejectOrder(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, order_id):
        try:
            order = OrderService.objects.get(pk=order_id)
        except OrderService.DoesNotExist:
            return Response(
                {"detail": "404 NOT FOUND"}, status=status.HTTP_404_NOT_FOUND
            )
        if order.home_service.seller != request.user.normal_user:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        if order.status != "Pending":
            return Response(
                {"detail": "Unexpected error"}, status=status.HTTP_400_BAD_REQUEST
            )
        order.status = "Rejected"
        order.answer_time = timezone.now()
        average_fast_answer = (
            OrderService.objects.exclude(status="Pending")
            .annotate(average=Avg(F("answer_time") - F("create_date")))
            .values("average")[0]["average"]
        )
        order.home_service.seller.average_fast_answer = average_fast_answer
        order.save()
        order.home_service.seller.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(exclude=True)
class AcceptOrder(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, order_id):
        try:
            order = OrderService.objects.get(pk=order_id)
        except OrderService.DoesNotExist:
            return Response(
                {"detail": "404 NOT FOUND"}, status=status.HTTP_404_NOT_FOUND
            )
        if order.home_service.seller != request.user.normal_user:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        if order.status != "Pending":
            return Response(
                {"detail": "Unexpected error"}, status=status.HTTP_400_BAD_REQUEST
            )

        required_balance = GeneralServicesPrice.objects.all().aggregate(Sum("price"))[
            "price__sum"
        ]
        if (
            required_balance is not None
            and request.user.normal_user.balance.total_balance < required_balance
        ):
            return Response(
                {"detail": "You don't have enough money"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        general_services = GeneralServicesPrice.objects.all()

        if not taking_money(
            general_services=general_services,
            order=order,
            required_balance=required_balance,
            user=request.user.normal_user,
        ):
            return Response(
                {"detail": "Unexpected error"}, status=status.HTTP_400_BAD_REQUEST
            )

        order.answer_time = timezone.now()
        average_fast_answer = (
            OrderService.objects.filter(~Q(status="Pending"))
            .annotate(time=F("answer_time") - F("create_date"))
            .aggregate(Avg("time"))["time__avg"]
        )
        order.home_service.seller.average_fast_answer = average_fast_answer
        order.save()
        order.home_service.seller.save()
        schedule(
            "services.tasks.update_status_to_underway",
            order.id,
            schedule_type=Schedule.ONCE,
            minutes=15,
            next_run=arrow.utcnow().shift(minutes=15).datetime,
        )
        return Response(get_form_data(order=order), status=status.HTTP_200_OK)


@extend_schema(exclude=True)
class AcceptAfterUnderReview(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, order_id):
        try:
            order = OrderService.objects.get(pk=order_id)
        except OrderService.DoesNotExist:
            return Response(
                {"detail": "404 NOT FOUND"}, status=status.HTTP_404_NOT_FOUND
            )
        if order.home_service.seller != request.user.normal_user:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        if order.status != "Under review":
            return Response(
                {"detail": "Unexpected error"}, status=status.HTTP_400_BAD_REQUEST
            )
        order.status = "Underway"
        order.save()
        return Response("Success")


@extend_schema(exclude=True)
class RejectAfterUnderReview(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, order_id):
        try:
            order = OrderService.objects.get(pk=order_id)
        except OrderService.DoesNotExist:
            return Response(
                {"detail": "404 NOT FOUND"}, status=status.HTTP_404_NOT_FOUND
            )
        if order.home_service.seller != request.user.normal_user:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        if order.status != "Under review":
            return Response(
                {"detail": "Unexpected error"}, status=status.HTTP_400_BAD_REQUEST
            )
        order.status = "Rejected"
        order.save()
        return Response("Success")


@extend_schema(exclude=True)
class FinishOrder(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, order_id):
        try:
            order = OrderService.objects.get(pk=order_id)
        except OrderService.DoesNotExist:
            return Response(
                {"detail": "404 NOT FOUND"}, status=status.HTTP_404_NOT_FOUND
            )
        if order.home_service.seller != request.user.normal_user:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        if order.status != "Underway":
            return Response(
                {"detail": "Unexpected error"}, status=status.HTTP_400_BAD_REQUEST
            )
        order.end_service = timezone.now()
        order.is_rateable = True
        order.status = "Expire"
        order.save()
        return Response("Order finished", status=status.HTTP_200_OK)


@extend_schema(exclude=True)
class MakeRateAndComment(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = OrderService.objects.get(pk=order_id)
        except OrderService.DoesNotExist:
            return Response(
                {"detail": "404 NOT FOUND"}, status=status.HTTP_404_NOT_FOUND
            )
        if order.client != request.user.normal_user:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        try:
            rate = Rating.objects.get(order_service=order)
        except Rating.DoesNotExist:
            rate = None
        if rate is not None:
            return Response(
                {"detail": "You have already rated this service"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if is_rateable(order=order):
            serializer = RatingSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(order_service=order)
            order.status = "Expire"
            order.is_rateable = False
            average_rate_for_this_order = (
                float(
                    serializer.validated_data["quality_of_service"]
                    + serializer.validated_data["commitment_to_deadline"]
                    + serializer.validated_data["work_ethics"]
                )
                / 3
            )
            order.home_service.average_ratings = (
                float(
                    order.home_service.average_ratings
                    * order.home_service.number_of_served_clients
                )
                + average_rate_for_this_order
            ) / (order.home_service.number_of_served_clients + 1)
            order.home_service.number_of_served_clients += 1
            order.home_service.save()
            order.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                {"detail": "The order has not finished yet"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@extend_schema(exclude=True)
class SellerComment(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, rating_id):
        try:
            rating = Rating.objects.get(pk=rating_id)
        except Rating.DoesNotExist:
            return Response(
                {"detail": "The client does not rate this service yet"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if rating.order_service.home_service.seller != request.user.normal_user:
            return Response(
                {"detail": "403 FORBIDDEN"}, status=status.HTTP_403_FORBIDDEN
            )
        if "seller_comment" not in request.data:
            return Response(
                {"seller_comment": "This field is required "},
                status=status.HTTP_400_BAD_REQUEST,
            )
        rating.seller_comment = request.data["seller_comment"]
        rating.save()
        return Response("Success", status=status.HTTP_200_OK)


@extend_schema(responses={200: RetrieveRatingsSpectacular(many=True)})
class ListRatingsByService(APIView):
    def get(self, request, service_id):
        ratings = Rating.objects.filter(order_service__home_service__id=service_id)
        serializer = RatingDetailSerializer(data=ratings, many=True)
        serializer.is_valid(raise_exception=False)

        for i, rate in enumerate(ratings):
            serializer.data[i]["client"] = rate.order_service.client.user.to_dict(
                request.get_host()
            )
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(responses={200: RetrieveRatingsSpectacularForUsername(many=True)})
class ListRatingsByUsername(APIView):
    def get(self, request, username):
        try:
            user = NormalUser.objects.get(user__username=username)
        except NormalUser.DoesNotExist:
            return Response(
                {"detail": "User does not exists"}, status=status.HTTP_400_BAD_REQUEST
            )

        ratings = Rating.objects.filter(order_service__home_service__seller=user)
        serializer = RatingDetailSerializer(data=ratings, many=True)
        serializer.is_valid(raise_exception=False)

        for i, rate in enumerate(ratings):
            serializer.data[i]["client"] = rate.order_service.client.user.to_dict(
                request.get_host()
            )

        return Response(serializer.data, status=status.HTTP_200_OK)


class GetEarnings(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(responses={200: GetEarningsSerializer(many=True), 403: None})
    def get(self, request):
        queryset = Earnings.objects.all()
        serializer = GetEarningsSerializer(data=queryset, many=True)
        serializer.is_valid(raise_exception=False)
        index = 0
        if queryset.count() > 0:
            for i, earning in enumerate(queryset):
                if earning.order:
                    serializer.data[index][
                        "home_service"
                    ] = earning.order.home_service.to_dict()
                else:
                    serializer.data[index]["home_service"] = {
                        "title": None,
                        "seller": None,
                        "service_id": None,
                        "seller_full_name": None,
                    }

        return Response(serializer.data)
