import pytest
from mixer.backend.django import mixer
from hypothesis.extra.django import TestCase
from rest_framework.test import APIClient
from rest_framework.reverse import reverse , reverse_lazy
from services.models import Area , HomeService , Category
from core.models import NormalUser , Balance , User
from knox.auth import AuthToken
from hypothesis import strategies , given
from datetime import timedelta
from django.utils import timezone

pytest_mark = pytest.mark.django_db

class TestCoreAPIViews(TestCase):
    def setUp(self):

        self.client = APIClient()
        self.user_password = 'q111w222'
        self.global_user = mixer.blend(NormalUser ,user__mode = 'seller'  , user__gender = 'Male')
        self.global_user.user.set_password(self.user_password)
        Balance.objects.create(total_balance = 1000 , user = self.global_user)
        self.global_user.user.save()
        _, self.token = AuthToken.objects.create(self.global_user.user )
        self.client.credentials(HTTP_AUTHORIZATION="token " + self.token)
        mixer.blend(Category)
    def test_create_service(self):
        url = reverse('create_service')
        data = {
                "form": 
                [

                        {
                            "title": "string",
                            "field_type": "text",
                            "note": "string"
                        },
                        {
                            "title": "string",
                            "field_type": "text",
                            "note": "string"
                        },
                        {
                            "title": "string",
                            "field_type": "text",
                            "note": "string"
                        },
                        {
                            "title": "string",
                            "field_type": "text",
                            "note": "string"
                        }
                    ],
                "title": "test title",
                "description": "string",
                "category": 1,
                "average_price_per_hour": 4294967295,
                "service_area": 
                [

                    1

                ]

            }
        print(data)
        response  = self.client.post(
            url ,
            data,
            format ='json'
        )
        service = HomeService.objects.last()
        assert response.status_code == 201
        assert service.title == 'test title'
    
    def test_retrieve_update_service_success(self):
        x= mixer.blend(HomeService , seller = self.global_user)
        url = reverse_lazy('retrieve_update_service' , kwargs={'home_service_id':x.id})
        data = {
            "title": "string",
            "description": "string",
            "average_price_per_hour": 4294967295,
            "service_area": [
                1
            ]
        }
        response = self.client.put(url , data , format = 'json')

        service = HomeService.objects.last()
        
        assert response.status_code == 200
        assert service.title == 'string'
    
    def test_delete_service_success(self):
        x = mixer.blend(HomeService , seller = self.global_user)
        url = reverse_lazy('delete_service' , kwargs={'home_service_id' : x.id})
        response = self.client.delete(url)
        query = HomeService.objects.filter(pk = x.id)

        assert response.status_code == 204
        assert query.count() == 0

    
