from .models import OrderService


def update_status_to_underway(order_id):
    try:
        order = OrderService.objects.get(pk=order_id)
        if order.status == "Under Review":
            order.status = "Underway"
            order.save()
    except OrderService.DoesNotExist:
        pass
