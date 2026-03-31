# Portal de Acceso Full-Stack (React + Flask) #

Este es un proyecto Full-Stack que consiste en un portal de autenticación basado en roles. El frontend está construido con React y Vite, mientras que el backend funciona con Python (Flask) y una base de datos MySQL, todo contenido y orquestado mediante Docker.

------------------------------------------------------------------------------------------------------

# Tecnologías Utilizadas #

* Frontend: React, Vite, Tailwind CSS, Lucide React.
* Backend: Python, Flask, Flask-CORS, SQLAlchemy, PyJWT.
* Base de Datos: MySQL 8.0
* Infraestructura: Docker & Docker Compose.

------------------------------------------------------------------------------------------------------

# Requisitos Previos #

Antes de ejecutar este proyecto, asegúrate de tener instalado en tu computadora:

1. [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Debe estar abierto y ejecutándose en segundo plano)
3. [Git](https://git-scm.com/)

------------------------------------------------------------------------------------------------------

# Instalación y Ejecución #

Sigue estos pasos en orden para levantar el entorno de desarrollo completo.

# 1. Clonar el repositorio #
Abre tu terminal y clona este proyecto en tu máquina local:

git clone https://github.com/Saul97319/Hotel-Villa-Lince
cd Hotel-Villa-Lince


# 2. Levantar el Backend y la Base de Datos (Docker) #
El backend y la base de datos están dockerizados, por lo que no necesitas instalar MySQL ni Python localmente. 
Desde la raíz del proyecto, navega a la carpeta del backend y ejecuta Docker Compose:

cd backend
docker-compose up -d --build

*Nota: La primera vez que ejecutes este comando, Docker descargará las imágenes necesarias y creará la base de datos automáticamente. Esto puede tardar un par de minutos.*

# 3. Levantar el Frontend (React) #
Abre **una nueva pestaña en tu terminal** (dejando Docker corriendo), navega a la carpeta del frontend e instala las dependencias de Node:

cd frontend
npm install
npm run dev


------------------------------------------------------------------------------------------------------

# Accesos y Puertos del Sistema #

Una vez que ambos entornos estén corriendo, podrás acceder a los siguientes servicios:

* Frontend (Interfaz de Usuario): [http://localhost:5173](http://localhost:5173)
* Backend (API Flask): `http://localhost:5000`
* Gestor de Base de Datos (phpMyAdmin): [http://localhost:7000](http://localhost:7000)

------------------------------------------------------------------------------------------------------

# Credenciales por defecto #

* Para phpMyAdmin:
* Servidor: `db`
* Usuario: `root`
* Contraseña: `SuperSecretPassword123`

Usuarios de prueba para el Login:
Para probar la aplicación en React, puedes usar las siguientes credenciales. *(Asegúrate de insertarlas previamente en la tabla `Admin` desde phpMyAdmin si la base de datos está recién creada)*.

| Rol | Correo / Usuario | Contraseña |
| :---| :--------------- | :--------- |
| **Administrador** | admin@hotel.com | admin123 |
| **Gerente** | gerente@hotel.com | gerente123 |
| **Empleado** | empleado@hotel.com | empleado123 |

------------------------------------------------------------------------------------------------------

# Detener el proyecto #
Cuando termines de trabajar, puedes apagar los servicios del backend para liberar recursos de tu computadora. En la terminal donde ejecutaste Docker, usa el siguiente comando:

docker-compose down

Para el frontend, simplemente presiona `Ctrl + C` en la terminal donde corre Vite.