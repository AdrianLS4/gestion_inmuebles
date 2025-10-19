"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.views.generic import RedirectView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Condominio API",
        default_version='v1',
        description="API para gestión de condominio",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@condominio.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

def home_view(request):
    return HttpResponse('''
    <h1>🏢 Sistema de Gestión de Inmuebles</h1>
    <div style="font-family: Arial; margin: 20px;">
        <h2>Enlaces:</h2>
        <ul>
            <li><a href="/admin/" style="color: #007cba;">🔧 Panel de Administración</a></li>
            <li><a href="/api/" style="color: #007cba;">🔌 API REST</a></li>
            <li><a href="/swagger/" style="color: #007cba;">📚 Documentación API</a></li>
        </ul>
        <h3>Credenciales:</h3>
        <p><strong>Usuario:</strong> admin<br><strong>Contraseña:</strong> admin123</p>
    </div>
    ''')

urlpatterns = [
    path('', home_view, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('condominio.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
