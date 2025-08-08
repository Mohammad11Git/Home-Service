from rest_framework import serializers
from .models import OrderService, HomeService

from .serializers import AreaSerializer, RetrieveInputDataSerializer


class HomeServiceSpectacular(serializers.ModelSerializer):
    service_area = AreaSerializer(many=True)
    seller = serializers.CharField(max_length=150)

    class Meta:
        model = HomeService
        fields = [
            "title",
            "category",
            "average_price_per_hour",
            "service_area",
            "seller",
        ]
        depth = 2


class ClientSpectacular(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    username = serializers.CharField()
    photo = serializers.ImageField()


class ListOrdersSpectacular(serializers.ModelSerializer):
    home_service = HomeServiceSpectacular()
    client = ClientSpectacular()
    form = RetrieveInputDataSerializer(many=True)
    seller = ClientSpectacular()

    class Meta:
        model = OrderService
        fields = [
            "id",
            "create_date",
            "status",
            "home_service",
            "client",
            "form",
            "seller",
            "is_rateable",
            "expected_time_by_day_to_finish",
        ]


class RetrieveRatingsSpectacular(serializers.Serializer):
    id = serializers.IntegerField()
    quality_of_service = serializers.FloatField(required=True)
    commitment_to_deadline = serializers.FloatField(required=True)
    work_ethics = serializers.FloatField(required=True)
    client_comment = serializers.CharField(required=True)
    seller_comment = serializers.CharField(allow_null=True, required=False)
    rating_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")
    client = ClientSpectacular()


class HomeServiceSimpleSpectacular(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    category = serializers.CharField()


class RetrieveRatingsSpectacularForUsername(serializers.Serializer):
    id = serializers.IntegerField()
    quality_of_service = serializers.FloatField(required=True)
    commitment_to_deadline = serializers.FloatField(required=True)
    work_ethics = serializers.FloatField(required=True)
    client_comment = serializers.CharField(required=True)
    seller_comment = serializers.CharField(allow_null=True, required=False)
    rating_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")
    client = ClientSpectacular()
    home_service = HomeServiceSimpleSpectacular()
