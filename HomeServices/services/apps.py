from django.apps import AppConfig
from django.db.models.signals import post_migrate

class ServicesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "services"
    verbose_name = "الخدمات"

    def ready(self):
        # Connect signal after migrations
        post_migrate.connect(self.init_syrian_governorates, sender=self)
        post_migrate.connect(self.init_service_categories, sender=self)
    
    def init_syrian_governorates(self, **kwargs):
        """Create Syrian governorates if they don't exist"""
        # Import inside the method to avoid AppRegistryNotReady error
        from .models import Area
        
        syrian_governorates = [
            "دمشق",
            "ريف دمشق",
            "حلب",
            "حمص",
            "حماة",
            "اللاذقية",
            "إدلب",
            "طرطوس",
            "الرقة",
            "دير الزور",
            "الحسكة",
            "السويداء",
            "درعا",
            "القنيطرة"
        ]
        
        # Only create if the table exists
        try:
            for gov in syrian_governorates:
                Area.objects.get_or_create(name=gov)
        except:
            # Silently fail if table doesn't exist yet
            pass
    
    def init_service_categories(self, **kwargs):
        """Create default service categories if they don't exist"""
        from .models import Category

        default_categories = [
            "تسليك",
            "تمديدات كهرباء",
            "نقل أثاث",
            "دهان",
            "سباكة",
            "نجارة",
            "تنظيف",
            "صيانة أجهزة كهربائية",
            "تركيب سيراميك",
            "حدادة"
        ]

        try:
            for cat in default_categories:
                Category.objects.get_or_create(name=cat)
        except:
            # Silently fail if table doesn't exist yet
            pass