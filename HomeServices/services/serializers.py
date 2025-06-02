from rest_framework import serializers
from .models import (
    HomeService,
    Area,
    Category,
    OrderService,
    Rating,
    InputField,
    input_choices,
    InputData,
    Earnings,
)
from core.models import User


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = "__all__"


class AreaBYIdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        field = "id"


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class UsernameSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "photo"]


class NormalUsernameSerializer(serializers.ModelSerializer):
    user = UsernameSerializer()

    class Meta:
        model = User
        fields = ["user"]


class HomeServiceSerializer(serializers.ModelSerializer):
    service_area = AreaSerializer(many=True)

    class Meta:
        model = HomeService
        fields = ["title", "category", "average_price_per_hour", "service_area"]
        depth = 2


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = [
            "quality_of_service",
            "commitment_to_deadline",
            "work_ethics",
            "client_comment",
        ]

    def validate_quality_of_service(self, value):
        if value < 1.0 or value > 5.0:
            raise serializers.ValidationError("value must be between 1.0 and 5.0")
        return value

    def validate_commitment_to_deadline(self, value):
        if value < 1.0 or value > 5.0:
            raise serializers.ValidationError("value must be between 1.0 and 5.0")
        return value

    def validate_work_ethics(self, value):
        if value < 1.0 or value > 5.0:
            raise serializers.ValidationError("value must be between 1.0 and 5.0")
        return value


class ListOrdersSerializer(serializers.ModelSerializer):
    home_service = HomeServiceSerializer()

    class Meta:
        model = OrderService
        fields = [
            "id",
            "create_date",
            "status",
            "home_service",
            "expected_time_by_day_to_finish",
        ]


class ListHomeServicesSerializer(serializers.ModelSerializer):
    category = CategorySerializer()
    service_area = AreaSerializer(many=True)
    seller = NormalUsernameSerializer()

    class Meta:
        model = HomeService
        fields = [
            "id",
            "title",
            "category",
            "average_price_per_hour",
            "seller",
            "service_area",
            "average_ratings",
        ]


class RetrieveHomeServices(serializers.ModelSerializer):
    category = CategorySerializer()
    service_area = AreaSerializer(many=True)
    seller = NormalUsernameSerializer()

    class Meta:
        model = HomeService
        fields = [
            "id",
            "title",
            "description",
            "category",
            "average_price_per_hour",
            "seller",
            "service_area",
            "number_of_served_clients",
            "average_ratings",
        ]


class InputFieldSerializer(serializers.ModelSerializer):
    field_type = serializers.ChoiceField(choices=input_choices, required=True)

    class Meta:
        model = InputField
        fields = ["title", "field_type", "note"]


class CreateHomeServiceSerializer(serializers.ModelSerializer):
    form = InputFieldSerializer(many=True, write_only=True)

    class Meta:
        model = HomeService
        fields = [
            "title",
            "description",
            "category",
            "average_price_per_hour",
            "service_area",
            "form",
        ]

    def validate_form(self, value):
        if len(value) < 4 or len(value) > 10:
            raise serializers.ValidationError(
                "Number of fields must be between 3 and 10"
            )
        return value

    def validate_average_price_per_hour(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Average price per hour must be greater than 0"
            )
        return value

    def create(self, validated_data):
        form_data = validated_data.pop("form")
        service_area_data = validated_data.pop("service_area")
        home_service = HomeService.objects.create(
            seller=self.context["request"].user.normal_user, **validated_data
        )
        home_service.save()
        for field_data in form_data:
            InputField.objects.create(home_service=home_service, **field_data)

        service_area_data = set(service_area_data)

        for area in service_area_data:
            home_service.service_area.add(area)
        return home_service


class RetrieveUpdateHomeServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeService
        fields = ["title", "description", "average_price_per_hour", "service_area"]


class InputFieldSerializerAll(serializers.ModelSerializer):
    field_type = serializers.ChoiceField(choices=input_choices, required=True)

    class Meta:
        model = InputField
        fields = ["id", "title", "field_type", "note"]


class InputDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = InputData
        fields = ["field", "content"]


class RetrieveInputDataSerializer(serializers.ModelSerializer):
    field = InputFieldSerializer()

    class Meta:
        model = InputData
        fields = ["field", "content"]


class RatingDetailSerializer(serializers.ModelSerializer):
    rating_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")

    class Meta:
        model = Rating
        fields = [
            "id",
            "quality_of_service",
            "commitment_to_deadline",
            "work_ethics",
            "client_comment",
            "seller_comment",
            "rating_time",
        ]


class GetEarningsSerializer(serializers.ModelSerializer):
    # service = RetrieveHomeServices()
    class Meta:
        model = Earnings
        fields = ["created_date", "beneficiary", "earnings"]
        depth = 2
