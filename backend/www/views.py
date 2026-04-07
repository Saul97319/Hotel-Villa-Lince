from flask import Blueprint, render_template, request, jsonify
from base import Admin, Cliente, Empleado
from sqlalchemy_db import db
from werkzeug.security import check_password_hash
import jwt, base64, hashlib, datetime, re, decimal
import datetime
from functools import wraps
from flask import request, redirect, url_for, flash
from datetime import datetime, timedelta
from flask import make_response

views = Blueprint('views', __name__)

#claves secretas para admin
CLAVE_ADMIN = 's4qu3nm3_d3_uvmXDa'
clave_secretaa = b'h0la_/3st4/cl4v3+tu-n0-l4/t13n3s'
ivv = b'P4p4r4p1p145t3*/'

SECRET_KEY = 'ogikvM3'
clave_secreta = b'mi_clave_secreta_32bytes_12asdaa'
iv = b'Paparapipiaste*-'

def verificar_clave_admin(clave_ingresada):
    return clave_ingresada == CLAVE_ADMIN

def ajustar_padding_base64(base64_string):
    padding_needed = len(base64_string) % 4
    if padding_needed != 0:
        base64_string += '=' * (4 - padding_needed)
    return base64_string

SALT = "twH3art_bR4K3-+Av3n^eced" #Para cifrado

def hash_contrasena(password):
    return hashlib.sha256((password + SALT).encode('utf-8')).hexdigest()


#Autenticación con JWT
#   Token de admin
def token_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token_base64 = request.cookies.get('admin_token')

        if not token_base64:
            flash('Acceso no autorizado. Inicia sesión.', 'danger')
            return redirect(url_for('views.admin'))

        try:
            # Decodificar Base64
            token = base64.b64decode(token_base64).decode()

            # Decodificar JWT
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])

            # 🔥 CAMBIO: buscar por email (o id_admin)
            current_user = Admin.query.filter_by(email=data['email']).first()

            # Validación de existencia
            if not current_user:
                flash('Sesión inválida. Inicia sesión de nuevo.', 'danger')
                return redirect(url_for('views.admin'))

            # (Opcional pero recomendado)
            if current_user.estado != 'activo':
                flash('Usuario inactivo.', 'danger')
                return redirect(url_for('views.admin'))

        except jwt.ExpiredSignatureError:
            flash('El token ha expirado.', 'danger')
            return redirect(url_for('views.admin'))

        except jwt.InvalidTokenError:
            flash('Token inválido.', 'danger')
            return redirect(url_for('views.admin'))

        except Exception as e:
            print(f"Error al validar token: {str(e)}")
            flash('Error de autenticación.', 'danger')
            return redirect(url_for('views.admin'))

        return f(current_user, *args, **kwargs)

    return decorated



#Autenticación con JWT usuarios(clientes)
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token_base64 = request.cookies.get('token')

        if not token_base64:
            flash('Acceso no autorizado. Inicia sesión.', 'danger')
            return redirect(url_for('views.home'))

        try:
            # Decodificar Base64
            token = base64.b64decode(token_base64).decode()

            # Decodificar JWT
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])

            current_user = Cliente.query.get(data['id_cliente'])

            if not current_user:
                flash('Usuario no encontrado. Inicia sesión nuevamente.', 'danger')
                return redirect(url_for('views.home'))

        except jwt.ExpiredSignatureError:
            flash('El token ha expirado.', 'danger')
            return redirect(url_for('views.home'))

        except jwt.InvalidTokenError:
            flash('Token inválido.', 'danger')
            return redirect(url_for('views.home'))

        except Exception as e:
            print(f"Error: {str(e)}")
            flash('Sesión inválida. Inicia sesión de nuevo.', 'danger')
            return redirect(url_for('views.home'))

        return f(current_user, *args, **kwargs)

    return decorated


#Autenticación con JWT usuarios(empleados)
from functools import wraps
from flask import request, redirect, url_for, flash
import jwt
import base64

def token_empleado(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token_base64 = request.cookies.get('empleado_token')

        if not token_base64:
            flash('Acceso no autorizado. Inicia sesión.', 'danger')
            return redirect(url_for('views.login_empleado'))

        try:
            # Decodificar Base64
            token = base64.b64decode(token_base64).decode()

            # Decodificar JWT
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])

            # Buscar empleado por ID
            current_user = Empleado.query.get(data['id_empleado'])

            if not current_user:
                flash('Empleado no encontrado.', 'danger')
                return redirect(url_for('views.login_empleado'))

            # Validar estado
            if current_user.estado != 'activo':
                flash('Empleado inactivo.', 'danger')
                return redirect(url_for('views.login_empleado'))

        except jwt.ExpiredSignatureError:
            flash('El token ha expirado.', 'danger')
            return redirect(url_for('views.login_empleado'))

        except jwt.InvalidTokenError:
            flash('Token inválido.', 'danger')
            return redirect(url_for('views.login_empleado'))

        except Exception as e:
            print(f"Error al validar token: {str(e)}")
            flash('Error de autenticación.', 'danger')
            return redirect(url_for('views.login_empleado'))

        return f(current_user, *args, **kwargs)

    return decorated


#vista de inicio, prueba

@views.route('/')
def start():
    return render_template('start.html')

#registro de administradores 
@views.route('/admin_registro', methods=['GET', 'POST'])
def admin_registro():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        email = request.form.get('email')
        contrasena = request.form.get('contrasena')
        confirmar_contrasena = request.form.get('confirmar_contrasena')
        clave_ingresada = request.form.get('clave_admin')

        # Verificar clave administrativa
        if not verificar_clave_admin(clave_ingresada):
            flash('Clave administrativa incorrecta.', 'danger')
            return redirect(url_for('views.admin_registro'))

        # Validar contraseñas
        if contrasena != confirmar_contrasena:
            flash('Las contraseñas no coinciden.', 'danger')
            return redirect(url_for('views.admin_registro'))

        # Verificar si el email ya existe
        if Admin.query.filter_by(email=email).first():
            flash('El correo ya está registrado.', 'danger')
            return redirect(url_for('views.admin_registro'))

        #Hashear contraseña
        hashed_password = hashlib.sha256(contrasena.encode()).hexdigest()

        # Crear nuevo admin 
        nuevo_admin = Admin(
            nombre=nombre,
            email=email,
            password_hash=hashed_password,
            estado='activo'  # importante para el token
        )

        try:
            db.session.add(nuevo_admin)
            db.session.commit()
            flash('Administrador registrado con éxito.', 'success')
            return redirect(url_for('views.admin'))

        except Exception as e:
            db.session.rollback()
            print(f'Error al registrar administrador: {str(e)}')
            flash('Error al registrar administrador.', 'danger')
            return redirect(url_for('views.admin_registro'))

    return render_template('admin_registro.html')

#lOGIN de administradores
@views.route("/admin", methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        email = request.form.get('email')
        contrasena = request.form.get('contrasena')

        # Buscar administrador por email
        admin = Admin.query.filter_by(email=email).first()

        if not admin:
            flash('Usuario no encontrado.', 'danger')
            return redirect(url_for('views.admin'))

        # Verificar contraseña (SHA256 - como ya manejas)
        hashed_password = hashlib.sha256(contrasena.encode()).hexdigest()

        if admin.password_hash != hashed_password:
            flash('Contraseña incorrecta.', 'danger')
            return redirect(url_for('views.admin'))

        # Validar estado (IMPORTANTE para token_admin)
        if admin.estado != 'activo':
            flash('Usuario inactivo.', 'danger')
            return redirect(url_for('views.admin'))

        # Generar token JWT (adaptado a tu middleware)
        token = jwt.encode(
            {
                'email': admin.email,  #debe coincidir con token_admin
                'exp': datetime.utcnow() + timedelta(hours=2)
            },
            SECRET_KEY,
            algorithm='HS256'
        )

        #Codificar en Base64
        token_base64 = base64.b64encode(token.encode()).decode()

        # Guardar cookie
        response = make_response(redirect(url_for('views.resultados')))#temporalmente a resultados, cambiar en cuanto se tenga la vista a la que realmente se quiera redirigir
        response.set_cookie('admin_token', token_base64, httponly=True)

        flash(f'Bienvenido, {admin.nombre}', 'success')
        return response

    return render_template("admin.html")

#provisional, cambiar a la vista que se quiera mostrar después del login de admin
@views.route('/resultados')
@token_admin #acceso solo para admins, decorador cambia de acuerdo al rol
def resultados(current_user):
    return render_template('resultados.html', admin_usuario=current_user)