import pytest
from mixer.backend.django import mixer
from hypothesis.extra.django import TestCase
from rest_framework.test import APIClient
from rest_framework.reverse import reverse , reverse_lazy
from core.views import User , NormalUser, Balance
from services.models import Area
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
    
    def test_login_success(self):
        user = mixer.blend(NormalUser)
        password = user.user.password 
        user.user.set_password(password)
        user.user.save()
        url = reverse('login_api')
        data = {'email':user.user.email , 'password':password}
        response = self.client.post(url , data = data)
        assert response.status_code == 200
        assert response.json()['user_info']['username'] == user.user.username
        assert response.json() !=None
        assert len(response.json()['token'][0]) != 0
    
    def test_login_email_not_confirmed(self):
        user = mixer.blend(NormalUser)
        password = user.user.password 
        user.user.set_password(password)
        user.user.is_active = False
        user.user.save()
        url = reverse('login_api')
        data = {'email':user.user.email , 'password':password}
        response = self.client.post(url , data = data)
        assert response.status_code == 400 
    
    def test_login_wrong_password(self):
        user = mixer.blend(NormalUser)
        password = user.user.password 
        user.user.set_password(password)
        user.user.save()
        url = reverse('login_api')
        data = {'email':user.user.email , 'password':'1234'}
        response = self.client.post(url , data = data)
        assert response.status_code == 400

    def test_register_success(self):
        url = reverse('register_api')
        mixer.blend(Area)
        data = {
            "username": "test",
            "password": "tEst1234*",
            "password2": "tEst1234*",
            "email": "user@example.com",
            "first_name": "test",
            "last_name": "test",
            "birth_date": "2019-08-24",
            "gender": "Male",
            "mode": "client",
            "area": 1
            }
        response = self.client.post(url , data = data )
        query  = NormalUser.objects.last()

        print(response.json())
        assert response.status_code == 201
        assert query.user.username == 'test'

    def test_list_users(self):

        user1 = mixer.blend(NormalUser , user__mode = 'seller')
        user2 = mixer.blend(NormalUser , user__mode = 'seller')

        url = reverse('list_users')

        response = self.client.get(url)
        assert response.status_code == 200 
        assert len(response.json()) == 3

    def test_retrieve_user(self):
        user1 = mixer.blend(NormalUser)
        user2 = mixer.blend(NormalUser)

        url1 = reverse('retrieve_user',kwargs={'username':user1.user.username})
        url2 = reverse('retrieve_user',kwargs={'username':user2.user.username})
        url3 = reverse('retrieve_user',kwargs={'username':'not_a_usernaaaame'})
        response1 = self.client.get(url1)
        response2 = self.client.get(url2)
        response3 = self.client.get(url3)

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response3.status_code == 404
        assert response1.json()['username'] == user1.user.username
        assert response2.json()['username'] == user2.user.username
    
    def test_logout(self):
        user = mixer.blend(User)
        _, token = AuthToken.objects.create(user)
        self.client.credentials(HTTP_AUTHORIZATION="token " + token)

        url = reverse('logout')
        self.client.post(url)
        query = AuthToken.objects.all()

        assert query.count() == 1
    
    def test_password_reset(self):
        url = reverse('password_reset')
        data = {
            'old_password' : self.user_password,
            'new_password' : 'q1111w2222',
            'new_password2' :'q1111w2222',
        }
        self.user_password ='q1111w2222'
        response = self.client.post(path=url , data= data)
        self.global_user=NormalUser.objects.get(user = self.global_user.user)
        assert response.status_code == 200
        assert self.global_user.user.check_password(self.user_password)
    
    def test_password_reset_unauthorized_user(self):
        user = APIClient()
        data = {
            'old_password' : self.user_password,
            'new_password' : 'q1111w2222',
            'new_password2' : 'q1111w2222'
        }
        url = reverse('password_reset')
        response = user.post(path = url ,data=data)

        assert response.status_code == 401
    
    def test_password_reset_incorrect_password(self):
        url = reverse('password_reset')
        data = {
            'old_password' : 'bla bla bla',
            'new_password' : 'q1q1q1w2w2w2',
            'new_password2' :'q1q1q1w2w2w2',
        }
        response = self.client.post(path=url , data= data)
        self.global_user=NormalUser.objects.get(user = self.global_user.user)
        assert response.status_code == 400
        assert not self.global_user.user.check_password('q1q1q1w2w2w2')

    def test_update_profile_get_request(self):
        url = reverse('update_profile')
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.json() != None
        assert len(response.json()['area']) >0 

    # @given(strategies.characters() , strategies.characters(), strategies.characters())
    def test_update_profile_put_request(self , bio = 'bio', first_name = 'first_name', last_name = 'last_name' ):
        data = {
        "bio": bio,
        "user": {
            "first_name": first_name,
            "last_name": last_name,
            "birth_date": "2019-08-24",
            "area": 1
            }
        }
        url = reverse_lazy('update_profile')
        response = self.client.put(url, data=data , format='json')
        self.global_user=NormalUser.objects.get(user = self.global_user.user)
        assert response.status_code==200
        assert response.json() != None 
        assert self.global_user.bio == data['bio']
        assert self.global_user.user.first_name == data['user']['first_name']
        assert self.global_user.user.last_name == data['user']['last_name']

    def test_update_user_photo(self):
        url = reverse('update_user_photo')
        response = self.client.put(url)
        user = User.objects.get(pk = self.global_user.user.id)
        assert response.status_code == 200
        assert user.photo.url == '/media/profile/Male.jpg'

    def test_confirm_email_success(self):
        user = mixer.blend(User)
        user.is_active =False 
        user.confirmation_code = 123456
        user.confirmation_tries =1
        user.next_confirm_try = timezone.now() + timedelta(hours= 1)
        user.save()
        url = reverse('confirm_email')
        response = self.client.post(url , data = {'email':user.email , 'confirmation_code':123456})
        print(response.json())
        confirmed_user = User.objects.get(pk = self.global_user.user.id)

        assert response.status_code ==200 
        assert confirmed_user.is_active ==True
        assert confirmed_user.confirmation_code is None
    
    def test_confirm_email_errors_class(self):
        url= reverse('confirm_email')
        response1 = self.client.post(url)
        response2 = self.client.post(url , data = {'email':'invalid email' , 'confirmation_code':123456})
        response3 = self.client.post(url , data = {'email': self.global_user.user.email , 'confirmation_code':123456})
        response4 = self.client.post(url , data = {'email': self.global_user.user.email})
        response5 = self.client.post(url , data = {'email': 'blablabla@bla.bla' , 'confirmation_code':123456})

        assert response1.status_code == 400
        assert response2.status_code == 400
        assert response3.status_code == 400 
        assert response4.status_code == 400 
        assert response5.status_code == 400

    def test_confirm_email_errors_in_process(self):
        url = reverse('confirm_email')
        user = mixer.blend(User , is_active = True)
        response1 =self.client.post(url , data = {'email': user.email , 'confirmation_code':123456})

        user.is_active =False 
        user.confirmation_code = 123456
        user.confirmation_tries =0
        user.next_confirm_try = timezone.now() + timedelta(hours= 1)
        user.save()

        response2 = self.client.post(url , data = {'email': user.email , 'confirmation_code':123456})

        assert response1.status_code == 400
        assert response1.json() == {'detail':"Email already verified"}
        assert response2.status_code == 400

    def test_my_balance_success(self):
        url = reverse('my_balance')
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.json()['total_balance'] >= 0  
    
    def test_my_balance_error(self):
        url = reverse('my_balance')
        client = APIClient()
        response = client.get(url)

        assert response.status_code == 401
    
    def test_forget_password_reset_success(self):
        url = reverse('forget_password_reset')
        self.global_user.user.forget_password_code = 123456
        self.global_user.user.save()

        response = self.client.post(url ,
            {  
                'email':self.global_user.user.email,
                'forget_password_code': 123456,
                'new_password': 'q1111w2222',
                'new_password2' : 'q1111w2222',
            }
        )

        user = User.objects.get(pk= self.global_user.user.id)
        assert response.status_code == 200
        assert user.check_password('q1111w2222')

    def test_forget_password_reset_wrong_code(self):
        url = reverse('forget_password_reset')
        self.global_user.user.forget_password_code = 123456
        self.global_user.user.save()

        response = self.client.post(url ,
            {  
                'email':self.global_user.user.email,
                'forget_password_code': 654321,
                'new_password': 'q1111w2222',
                'new_password2' : 'q1111w2222',
            }
        )

        assert response.status_code == 400

    def test_login_provider_error_not_a_provider(self):
        url = reverse('login_provider')
        response = self.client.post(
            url ,
            {
                'username' : self.global_user.user.username,
                'password' : self.user_password
            }
        )

        assert response.status_code == 400
    
    def test_login_provider_success(self):
        url = reverse('login_provider')
        self.global_user.user.is_provider = True
        self.global_user.user.save()
        response = self.client.post(
            url ,
            {
                'username' : self.global_user.user.username,
                'password' : self.user_password
            }
        )
        assert response.status_code == 200
        assert response.json() != None

    def test_charge_balance_error_no_enough_money(self):
        url = reverse('charge_balance')
        self.global_user.balance.total_balance = 0
        self.global_user.balance.save()
        user = mixer.blend(Balance )
        response = self.client.post(
            url ,
            {
                'username': user.user.user.username,
                'charged_balance' : 100
            }
        )

        assert response.status_code == 400
    
    def test_charge_balance_success(self):
        url = reverse('charge_balance')
        self.global_user.balance.total_balance = 100
        self.global_user.balance.save()
        user = mixer.blend(Balance , total_balance = 0)
        response = self.client.post(
            url ,
            {
                'username': user.user.user.username,
                'charged_balance' : 100
            }
        )
        balance = Balance.objects.get(pk = user.id)
        assert response.status_code == 200
        assert balance.total_balance == 100 