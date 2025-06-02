from django.db import models
from django.contrib.auth.models import AbstractUser

gender_choices = [
    ("Male", "Male"),
    ("Female", "Female"),
]
mode_choices = [
    ("client", "buyer"),
    ("seller", "seller_buyer"),
]


class User(AbstractUser):
    birth_date = models.DateField(blank=True, null=True)
    gender = models.CharField(choices=gender_choices, max_length=10)
    photo = models.ImageField(
        upload_to="profile", max_length=100, blank=True, null=True
    )
    mode = models.CharField(choices=mode_choices, max_length=50)
    area = models.ForeignKey(
        "services.Area", on_delete=models.SET_NULL, null=True, related_name="user_area"
    )

    confirmation_tries = models.IntegerField(default=3, blank=True)
    next_confirm_try = models.DateTimeField(blank=True, null=True)
    confirmation_code = models.CharField(null=True, blank=True, max_length=6)

    resend_tries = models.IntegerField(default=3, blank=True)
    next_confirmation_code_sent = models.DateTimeField(blank=True, null=True)

    forget_confirmation_tries = models.IntegerField(default=3, blank=True)
    forget_next_confirm_try = models.DateTimeField(blank=True, null=True)
    forget_password_code = models.CharField(blank=True, null=True, max_length=6)

    is_provider = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.photo:
            if self.gender == "Male":
                self.photo.name = "profile/Male.jpg"
                self.photo.storage.url(self.photo.name)
            else:
                self.photo.name = "profile/Female.jpg"
                self.photo.storage.url(self.photo.name)
        super().save(*args, **kwargs)


class NormalUser(models.Model):
    bio = models.CharField(max_length=1000, default="", blank=True)
    user = models.OneToOneField(
        "User", on_delete=models.CASCADE, related_name="normal_user"
    )
    average_fast_answer = models.DurationField(blank=True, null=True)

    def __str__(self):
        return self.user.username


class Balance(models.Model):
    user = models.OneToOneField(
        "NormalUser", on_delete=models.CASCADE, related_name="balance"
    )
    total_balance = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.user.user.username
