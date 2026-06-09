@echo off
echo ========================================================
echo   Actualizando Entorno y Base de Datos - Villa Lince    
echo ========================================================
echo.
echo [1/3] Deteniendo contenedores y limpiando volumenes antiguos...
docker-compose down -v
echo.
echo [2/3] Reconstruyendo imagenes y levantando servicios...
docker-compose up -d --build
echo.
echo [3/3] Esperando a que MySQL procese el archivo init.sql...
echo Todo listo. Ya puedes abrir el proyecto en tu navegador.
echo ========================================================
pause