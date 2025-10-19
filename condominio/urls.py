from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropietarioViewSet, EdificioViewSet, InmuebleViewSet, RecibosViewSet, PagosViewSet,
    Tipos_GastoViewSet, Conceptos_GastoViewSet, Gastos_del_MesViewSet, Movimientos_GastosViewSet,
    Tasa_CambioViewSet, Configuracion_RecibosViewSet, ReportesViewSet, LoginView, user_info, test_connection
)

router = DefaultRouter()
router.register(r'propietarios', PropietarioViewSet)
router.register(r'edificios', EdificioViewSet)
router.register(r'inmuebles', InmuebleViewSet)
router.register(r'recibos', RecibosViewSet)
router.register(r'pagos', PagosViewSet)
router.register(r'tipos-gasto', Tipos_GastoViewSet)
router.register(r'conceptos-gasto', Conceptos_GastoViewSet)
router.register(r'gastos-mes', Gastos_del_MesViewSet)
router.register(r'movimientos-gastos', Movimientos_GastosViewSet)
router.register(r'tasas-cambio', Tasa_CambioViewSet)
router.register(r'configuracion-recibos', Configuracion_RecibosViewSet)
router.register(r'reportes', ReportesViewSet, basename='reportes')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/user/', user_info, name='user_info'),
    path('test/', test_connection, name='test'),
]