from django.urls import path
from . import views
urlpatterns = [
    path('categories' , views.ListCategories.as_view()),
    path('list_all_area' ,views.ListArea.as_view() ),
    path('my_orders' , views.MyOrders.as_view()),
    path('received_orders' , views.ReceivedOrders.as_view()),
    path('list_home_services' , views.ListHomeServices.as_view()),
    path('home_service/detail/<int:pk>' , views.HomeServiceDetail.as_view()),
    path('create_service' , views.CreateHomeService.as_view() , name = 'create_service'),
    path('retrieve_update_home_service/<int:home_service_id>' , views.RetrieveUpdateHomeService.as_view() 
         , name= 'retrieve_update_service'),
    path('delete_home_service/<int:home_service_id>' , views.DeleteHomeService.as_view() ,
         name= 'delete_service'),
    path('update_form_home_service/<int:home_service_id>', views.UpdateFormHomeService.as_view()),
    path('order_service/<int:service_id>', views.MakeOrderService.as_view(),
         name = 'create_order_service'),
    path('cancel_order/<int:order_id>',views.CancelOrder.as_view()),
    path('reject_order/<int:order_id>',views.RejectOrder.as_view()),
    path('accept_order/<int:order_id>',views.AcceptOrder.as_view()),
    path('accept_after_review/<int:order_id>', views.AcceptAfterUnderReview.as_view()),
    path('reject_after_review/<int:order_id>',views.RejectAfterUnderReview.as_view()),
    path('finish_order/<int:order_id>', views.FinishOrder.as_view()),
    path('make_rating/<int:order_id>',views.MakeRateAndComment.as_view()),
    path('make_seller_comment/<int:rating_id>' , views.SellerComment.as_view()),
    path('ratings/service/<int:service_id>',views.ListRatingsByService.as_view()),
    path('ratings/username/<str:username>',views.ListRatingsByUsername.as_view()),
    path('earnings' , views.GetEarnings.as_view() , name='earnings')
]
