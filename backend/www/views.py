from flask import Blueprint, render_template, request, jsonify
from base import Admin, Cliente, Empleado, Habitacion, Reserva, Sucursal, Empresa, Convenio, Factura, HuespedEmpresarial, Pago, Servicio, FacturaDetalle, Reporte, DetallesHuesped
from base import db
from werkzeug.security import check_password_hash
import jwt, base64, hashlib, datetime, re, decimal
import datetime, re
import uuid
from functools import wraps
from flask import request, redirect, url_for, flash
from datetime import date, datetime, timedelta
from flask import make_response
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, and_
from sqlalchemy.sql import func
from decimal import Decimal
from datetime import datetime
from sqlalchemy import text
from datetime import timedelta
from base import db, Factura, Reserva, Pago, Servicio, Empresa, Convenio, Habitacion, DetallesHuesped, FacturaDetalle
from flask import jsonify, request
import uuid
import time
from decimal import Decimal

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

#validacion de email
def validar_email(email):
    if not email:
        return False
    
    regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(regex, email)

#validacion de contraseña
def validar_contrasena(password):
    if len(password) < 8:
        return "Debe tener al menos 8 caracteres"

    if not re.search(r'[A-Z]', password):
        return "Debe tener una mayúscula"

    if not re.search(r'[a-z]', password):
        return "Debe tener una minúscula"

    if not re.search(r'[0-9]', password):
        return "Debe tener un número"

    if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
        return "Debe tener un carácter especial"

    return None  # válida

#whitelist de caracteres para nombres
def validar_usuario(usuario):
    # solo letras, números y guion bajo
    return re.match(r'^[a-zA-Z0-9_]{4,20}$', usuario)


#Autenticación con JWT
#   Token de admin
def token_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        is_api_request = False

        # 1. Intentamos leer el token de las cabeceras (Método React / SPA)
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            is_api_request = True  # Si usa Bearer, sabemos que es React pidiendo JSON
        
        # 2. Si no hay cabecera, buscamos en las cookies (Método Jinja/HTML antiguo)
        if not token:
            token_base64 = request.cookies.get('admin_token')
            if token_base64:
                try:
                    token = base64.b64decode(token_base64).decode()
                except Exception:
                    pass

        # Si de ninguna forma hay token, bloqueamos el paso
        if not token:
            if is_api_request or request.headers.get('Content-Type') == 'application/json':
                return jsonify({'error': 'Acceso no autorizado. Token faltante.'}), 401
            flash('Acceso no autorizado. Inicia sesión.', 'danger')
            return redirect(url_for('views.admin'))

        try:
            # Decodificamos el JWT
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = Admin.query.filter_by(email=data['email']).first()

            # Validación de existencia y estado
            if not current_user or current_user.estado != 'activo':
                if is_api_request:
                    return jsonify({'error': 'Usuario inválido o inactivo.'}), 401
                flash('Sesión inválida o inactiva.', 'danger')
                return redirect(url_for('views.admin'))

        except jwt.ExpiredSignatureError:
            if is_api_request:
                return jsonify({'error': 'El token ha expirado.'}), 401
            flash('El token ha expirado.', 'danger')
            return redirect(url_for('views.admin'))

        except jwt.InvalidTokenError:
            if is_api_request:
                return jsonify({'error': 'Token inválido.'}), 401
            flash('Token inválido.', 'danger')
            return redirect(url_for('views.admin'))

        except Exception as e:
            print(f"Error al validar token: {str(e)}")
            if is_api_request:
                return jsonify({'error': 'Error de autenticación.'}), 500
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
            return redirect(url_for('views.login_cliente'))

        try:
            # Decodificar Base64
            token = base64.b64decode(token_base64).decode()

            # Decodificar JWT
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])

            current_user = Cliente.query.get(data['id_cliente'])

            if not current_user:
                flash('Usuario no encontrado. Inicia sesión nuevamente.', 'danger')
                return redirect(url_for('views.login_cliente'))

        except jwt.ExpiredSignatureError:
            flash('El token ha expirado.', 'danger')
            return redirect(url_for('views.login_cliente'))

        except jwt.InvalidTokenError:
            flash('Token inválido.', 'danger')
            return redirect(url_for('views.login_cliente'))

        except Exception as e:
            print(f"Error: {str(e)}")
            flash('Sesión inválida. Inicia sesión de nuevo.', 'danger')
            return redirect(url_for('views.login_cliente'))

        return f(current_user, *args, **kwargs)

    return decorated


#Autenticación con JWT usuarios(empleados)
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

#Funcion generar facturas 
def generar_factura(reserva_id, empleado_id, empresa_id=None):
    reserva = Reserva.query.get(reserva_id)

    if not reserva:
        return False, "Reserva no encontrada"

    if reserva.factura:
        return False, "La reserva ya tiene factura"

    # Calcular noches
    noches = (reserva.checkout - reserva.checkin).days

    #  Precio habitación
    precio_noche = Decimal(reserva.habitacion.precio_noche)
    total_habitacion = noches * precio_noche

    # Servicios no facturados
    servicios = Servicio.query.filter_by(
        reserva_id=reserva_id,
        facturado=False
    ).all()

    total_servicios = sum(Decimal(s.costo) for s in servicios)

    total = total_habitacion + total_servicios

    # Crear factura
    factura = Factura(
        reserva_id=reserva_id,
        empresa_id=empresa_id,
        total=total,
        estado="GENERADA",
        tipo_envio="DIGITAL",
        fecha_emision=datetime.now(),
        generado_por_empleado=empleado_id
    )

    db.session.add(factura)
    db.session.flush()  # para obtener id_factura

    # Crear detalles de servicios
    for servicio in servicios:
        detalle = FacturaDetalle(
            factura_id=factura.id_factura,
            servicio_id=servicio.id_servicio,
            subtotal=servicio.costo
        )
        servicio.facturado = True
        db.session.add(detalle)

    db.session.commit()

    return True, "Factura generada correctamente"
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

        # Validar nombre whitelist
        if not validar_usuario(nombre):
            flash('El nombre solo puede contener letras, números y guion bajo (4-20 caracteres).', 'danger')
            return redirect(url_for('views.admin_registro'))

        # Validar email
        if not validar_email(email):
            flash('Correo electrónico inválido.', 'danger')
            return redirect(url_for('views.admin_registro'))

        # Validar contraseña (seguridad)
        error_password = validar_contrasena(contrasena)
        if error_password:
            flash(error_password, 'danger')
            return redirect(url_for('views.admin_registro'))

        # Verificar clave administrativa
        if not verificar_clave_admin(clave_ingresada):
            flash('Clave administrativa incorrecta.', 'danger')
            return redirect(url_for('views.admin_registro'))

        # Validar contraseñas iguales
        if contrasena != confirmar_contrasena:
            flash('Las contraseñas no coinciden.', 'danger')
            return redirect(url_for('views.admin_registro'))

        # Verificar si el email ya existe
        if Admin.query.filter_by(email=email).first():
            flash('El correo ya está registrado.', 'danger')
            return redirect(url_for('views.admin_registro'))

        # Hashear contraseña (SIN CAMBIOS como pediste)
        hashed_password = hashlib.sha256(contrasena.encode()).hexdigest()

        # Crear nuevo admin 
        nuevo_admin = Admin(
            nombre=nombre,
            email=email,
            password_hash=hashed_password,
            estado='activo'
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

        # Validar campos vacíos
        if not email or not contrasena:
            flash('Todos los campos son obligatorios.', 'danger')
            return redirect(url_for('views.admin'))

        # Validar formato de email
        if not validar_email(email):
            flash('Correo electrónico inválido.', 'danger')
            return redirect(url_for('views.admin'))

        # Validar longitud básica (anti abuso)
        if len(contrasena) > 100:
            flash('Entrada inválida.', 'danger')
            return redirect(url_for('views.admin'))

        # Buscar administrador por email
        admin = Admin.query.filter_by(email=email).first()

        if not admin:
            flash('Usuario no encontrado.', 'danger')
            return redirect(url_for('views.admin'))

        # Verificar contraseña (SIN CAMBIOS)
        hashed_password = hashlib.sha256(contrasena.encode()).hexdigest()

        if admin.password_hash != hashed_password:
            flash('Contraseña incorrecta.', 'danger')
            return redirect(url_for('views.admin'))

        # Validar estado
        if admin.estado != 'activo':
            flash('Usuario inactivo.', 'danger')
            return redirect(url_for('views.admin'))

        # Generar token JWT
        token = jwt.encode(
            {
                'email': admin.email,
                'exp': datetime.utcnow() + timedelta(hours=2)
            },
            SECRET_KEY,
            algorithm='HS256'
        )

        # Codificar en Base64
        token_base64 = base64.b64encode(token.encode()).decode()

        # Guardar cookie
        response = make_response(redirect(url_for('views.resultados')))
        response.set_cookie('admin_token', token_base64, httponly=True)

        flash(f'Bienvenido, {admin.nombre}', 'success')
        return response

    return render_template("admin.html")




#provisional, cambiar a la vista que se quiera mostrar después del login de admin
@views.route('/resultados')
@token_admin #acceso solo para admins, decorador cambia de acuerdo al rol
def resultados(current_user):
    return render_template('resultados.html', admin_usuario=current_user)


#registro de empleados
@views.route('/empleado_registro', methods=['GET', 'POST'])
def empleado_registro():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        email = request.form.get('email')
        contrasena = request.form.get('contrasena')
        confirmar_contrasena = request.form.get('confirmar_contrasena')

        # Validar nombre
        if not validar_usuario(nombre):
            flash('El nombre solo puede contener letras, números y guion bajo (4-20 caracteres).', 'danger')
            return redirect(url_for('views.empleado_registro'))

        # Validar email
        if not validar_email(email):
            flash('Correo electrónico inválido.', 'danger')
            return redirect(url_for('views.empleado_registro'))

        # Validar contraseña
        error_password = validar_contrasena(contrasena)
        if error_password:
            flash(error_password, 'danger')
            return redirect(url_for('views.empleado_registro'))

        # Validar confirmación
        if contrasena != confirmar_contrasena:
            flash('Las contraseñas no coinciden.', 'danger')
            return redirect(url_for('views.empleado_registro'))

        # Verificar si ya existe
        if Empleado.query.filter_by(email=email).first():
            flash('El correo ya está registrado.', 'danger')
            return redirect(url_for('views.empleado_registro'))

        # Hash (igual que tu sistema)
        hashed_password = hashlib.sha256(contrasena.encode()).hexdigest()

        nuevo_empleado = Empleado(
            nombre=nombre,
            email=email,
            password_hash=hashed_password,
            estado='activo'
        )

        try:
            db.session.add(nuevo_empleado)
            db.session.commit()
            flash('Empleado registrado con éxito.', 'success')
            return redirect(url_for('views.login_empleado'))

        except Exception as e:
            db.session.rollback()
            print(f'Error al registrar empleado: {str(e)}')
            flash('Error al registrar empleado.', 'danger')
            return redirect(url_for('views.empleado_registro'))

    return render_template('empleado_registro.html')

@views.route("/login_empleado", methods=['GET', 'POST'])
def login_empleado():
    if request.method == 'POST':
        email = request.form.get('email')
        contrasena = request.form.get('contrasena')

        # Validar campos vacíos
        if not email or not contrasena:
            flash('Todos los campos son obligatorios.', 'danger')
            return redirect(url_for('views.login_empleado'))

        # Validar email
        if not validar_email(email):
            flash('Correo electrónico inválido.', 'danger')
            return redirect(url_for('views.login_empleado'))

        # Buscar empleado
        empleado = Empleado.query.filter_by(email=email).first()

        # ❗ Mensaje genérico (mejor práctica)
        if not empleado:
            flash('Credenciales inválidas.', 'danger')
            return redirect(url_for('views.login_empleado'))

        # Verificar contraseña
        hashed_password = hashlib.sha256(contrasena.encode()).hexdigest()

        if empleado.password_hash != hashed_password:
            flash('Credenciales inválidas.', 'danger')
            return redirect(url_for('views.login_empleado'))

        # Validar estado
        if empleado.estado != 'activo':
            flash('Empleado inactivo.', 'danger')
            return redirect(url_for('views.login_empleado'))

        # Generar JWT
        token = jwt.encode(
            {
                'id_empleado': empleado.id_empleado, 
                'exp': datetime.utcnow() + timedelta(hours=2)
            },
            SECRET_KEY,
            algorithm='HS256'
        )

        # Base64
        token_base64 = base64.b64encode(token.encode()).decode()

        # Cookie
        response = make_response(redirect(url_for('views.panel_empleado')))
        response.set_cookie('empleado_token', token_base64, httponly=True)

        flash(f'Bienvenido, {empleado.nombre}', 'success')
        return response

    return render_template("login_empleado.html")

#panel provisional para empleados
@views.route('/panel_empleado')
@token_empleado #acceso solo para empleados, decorador cambia de acuerdo al rol
def panel_empleado(current_user):
    return render_template('panel_empleado.html', empleado_usuario=current_user)


#registro de clientes, login
@views.route('/cliente_registro', methods=['GET', 'POST'])
def cliente_registro():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        email = request.form.get('email')
        contrasena = request.form.get('contrasena')
        confirmar_contrasena = request.form.get('confirmar_contrasena')

        # Validar nombre
        if not validar_usuario(nombre):
            flash('El nombre solo puede contener letras, números y guion bajo (4-20 caracteres).', 'danger')
            return redirect(url_for('views.cliente_registro'))

        # Validar email
        if not validar_email(email):
            flash('Correo electrónico inválido.', 'danger')
            return redirect(url_for('views.cliente_registro'))

        # Validar contraseña
        error_password = validar_contrasena(contrasena)
        if error_password:
            flash(error_password, 'danger')
            return redirect(url_for('views.cliente_registro'))

        # Confirmación
        if contrasena != confirmar_contrasena:
            flash('Las contraseñas no coinciden.', 'danger')
            return redirect(url_for('views.cliente_registro'))

        # Verificar existencia
        if Cliente.query.filter_by(email=email).first():
            flash('El correo ya está registrado.', 'danger')
            return redirect(url_for('views.cliente_registro'))

        # Hash (sin cambios)
        hashed_password = hashlib.sha256(contrasena.encode()).hexdigest()

        nuevo_cliente = Cliente(
            nombre=nombre,
            email=email,
            password_hash=hashed_password
        )

        try:
            db.session.add(nuevo_cliente)
            db.session.commit()
            flash('Registro exitoso.', 'success')
            return redirect(url_for('views.login_cliente'))

        except Exception as e:
            db.session.rollback()
            print(f'Error al registrar cliente: {str(e)}')
            flash('Error al registrar cliente.', 'danger')
            return redirect(url_for('views.cliente_registro'))

    return render_template('cliente_registro.html')

#login de clientes
@views.route('/login_cliente', methods=['GET', 'POST'])
def login_cliente():
    if request.method == 'POST':
        email = request.form.get('email')
        contrasena = request.form.get('contrasena')

        # Validar campos vacíos
        if not email or not contrasena:
            flash('Todos los campos son obligatorios.', 'danger')
            return redirect(url_for('views.login_cliente'))

        # Validar email
        if not validar_email(email):
            flash('Correo electrónico inválido.', 'danger')
            return redirect(url_for('views.login_cliente'))

        # Buscar cliente
        cliente = Cliente.query.filter_by(email=email).first()

        # Mensaje genérico
        if not cliente:
            flash('Credenciales inválidas.', 'danger')
            return redirect(url_for('views.login_cliente'))

        # Verificar contraseña
        hashed_password = hashlib.sha256(contrasena.encode()).hexdigest()

        if cliente.password_hash != hashed_password:
            flash('Credenciales inválidas.', 'danger')
            return redirect(url_for('views.login_cliente'))

        # Generar JWT
        token = jwt.encode(
            {
                'id_cliente': cliente.id_cliente,  
                'exp': datetime.utcnow() + timedelta(hours=2)
            },
            SECRET_KEY,
            algorithm='HS256'
        )

        # Base64
        token_base64 = base64.b64encode(token.encode()).decode()

        # Cookie
        response = make_response(redirect(url_for('views.panel_cliente')))
        response.set_cookie('token', token_base64, httponly=True)

        flash(f'Bienvenido, {cliente.nombre}', 'success')
        return response

    return render_template('login_cliente.html')

#botones para cerrar sesión (eliminar cookie)
#cliente
@views.route('/logout_cliente')
def logout_cliente():
    response = make_response(redirect(url_for('views.login_cliente')))
    
    response.set_cookie(
        'token',
        '',
        expires=0,
        httponly=True,
        secure=False,   # True si usas HTTPS
        samesite='Lax'
    )

    flash('Sesión cerrada.', 'success')
    return response

#Administrador
@views.route('/logout_admin')
def logout_admin():
    response = make_response(redirect(url_for('views.admin')))

    response.set_cookie(
        'admin_token',
        '',
        expires=0,
        httponly=True,
        secure=False,   # cámbialo a True si usas HTTPS
        samesite='Lax'
    )

    flash('Sesión de administrador cerrada.', 'success')
    return response

#empleados
@views.route('/logout_empleado')
def logout_empleado():
    response = make_response(redirect(url_for('views.login_empleado')))
    response.set_cookie(
        'empleado_token',
        '',
        expires=0,
        httponly=True,
        secure=False,   # cámbialo a True si usas HTTPS
        samesite='Lax'
    )

    flash('Sesión de empleado cerrada.', 'success')
    return response


@views.route('/panel_cliente')
@token_required #acceso solo para clientes, decorador cambia de acuerdo al rol
def panel_cliente(current_user):
    return render_template('panel_cliente.html', cliente_usuario=current_user)


#vista de empleados(mostrador) habitaciones, reservas, etc
@views.route('/ini_empleados')
@token_empleado
def ini_empleados(current_user):
    habitaciones = Habitacion.query.all()  # trae todas

    return render_template(
        'ini_empleados.html',
        empleado_usuario=current_user,
        habitaciones=habitaciones
    )

#seleccionar y editar estado de reservas
#editar estado de habitaciones, limpieza
@views.route('/habitacion/<int:id>', methods=['GET', 'POST'])
@token_empleado
def editar_habitacion(current_user, id):
    habitacion = Habitacion.query.get_or_404(id)

    if request.method == 'POST':
        nuevo_estado = request.form.get('estado')
        nueva_limpieza = request.form.get('estado_limpieza')

        habitacion.estado = nuevo_estado
        habitacion.estado_limpieza = nueva_limpieza

        db.session.commit()

        flash('Habitación actualizada correctamente', 'success')
        return redirect(url_for('views.ini_empleados'))

    return render_template('editar_habitacion.html', habitacion=habitacion)


@views.route('/reservas')
@token_empleado
def ver_reservas(current_user):
    reservas = Reserva.query.all()

    return render_template(
        'reservas.html',
        reservas=reservas,
        empleado_usuario=current_user
    )

@views.route('/reservar/<int:id>', methods=['GET', 'POST'])
@token_empleado
def reservar_habitacion(current_user, id):
    habitacion = db.session.get(Habitacion, id)

    if not habitacion:
        flash('Habitación no encontrada', 'danger')
        return redirect(url_for('views.ini_empleados'))

    if request.method == 'POST':
        cliente_id = request.form.get('cliente_id')
        checkin = request.form.get('checkin')
        checkout = request.form.get('checkout')

        # Validaciones básicas
        if not cliente_id or not checkin or not checkout:
            flash('Todos los campos son obligatorios', 'danger')
            return redirect(request.url)

        if checkin > checkout:
            flash('Fechas inválidas', 'danger')
            return redirect(request.url)

        # Validar disponibilidad (sin solapamientos)
        conflicto = Reserva.query.filter(
            Reserva.habitacion_id == id,
            Reserva.estado.in_(['Reservada', 'Activa']),
            Reserva.checkout > checkin,
            Reserva.checkin < checkout
        ).first()

        if conflicto:
            flash('La habitación no está disponible en esas fechas', 'danger')
            return redirect(request.url)

        nueva_reserva = Reserva(
            cliente_id=cliente_id,
            habitacion_id=id,
            empleado_id=current_user.id_empleado,
            sucursal_id=habitacion.sucursal_id,
            fecha_reserva=date.today(),
            checkin=checkin,
            checkout=checkout,
            estado='Reservada',
            metodo_reserva='Mostrador'
        )

        db.session.add(nueva_reserva)
        db.session.commit()

        flash('Reserva creada correctamente', 'success')
        return redirect(url_for('views.ini_empleados'))

    return render_template('reservar.html', habitacion=habitacion)

#check in, esto lo hace el empleado
@views.route('/checkin/<int:id_reserva>', methods=['GET', 'POST'])
@token_empleado
def checkin(current_user, id_reserva):
    reserva = db.session.get(Reserva, id_reserva)

    if not reserva:
        flash('Reserva no encontrada', 'danger')
        return redirect(url_for('views.ver_reservas'))

    if request.method == 'POST':
        reserva.estado = 'Activa'
        reserva.habitacion.estado = 'Ocupada'

        db.session.commit()

        flash('Check-in realizado correctamente', 'success')
        return redirect(url_for('views.ver_reservas'))

    return render_template('checkin.html', reserva=reserva)

#barra de busqueda de empleados mostrador

@views.route('/buscar_datos', methods=['POST'])
@token_empleado 
def buscar_datos(current_user):
    query = request.form.get('query', '').strip()

    if not query:
        return redirect(url_for('views.ini_empleados'))

    habitaciones = Habitacion.query.filter(
        or_(
            Habitacion.tipo.ilike(f"%{query}%"),
            Habitacion.estado.ilike(f"%{query}%"),
            Habitacion.estado_limpieza.ilike(f"%{query}%"),
            Habitacion.numero.ilike(f"%{query}%")
        )
    ).all()

    return render_template(
        'ini_empleados.html',
        empleado_usuario=current_user,
        habitaciones=habitaciones,
        busqueda=query
    )

# Solo ver convenios (Empleados)
@views.route('/empleado_convenios')
@token_empleado
def ver_convenios_empleado(current_user):  # <-- Asegura este nombre
    convenios = Convenio.query.join(Empresa).all()
    return render_template('convenios.html', convenios=convenios, empleado_usuario=current_user)

# Visualizar convenios (Clientes)
@views.route('/cliente_convenios')
@token_required
def ver_convenios_cliente(current_user):   # <-- Asegura este nombre
    convenios = Convenio.query.join(Empresa).filter(
        Convenio.activo == True,
        Convenio.fecha_fin >= date.today()
    ).all()
    return render_template('convenios.html', convenios=convenios, cliente_usuario=current_user)
#facturacion 
@views.route('/facturas')
@token_empleado
def ver_facturas_empleado(current_user):

    facturas = Factura.query.all()

    return render_template(
        'facturas_empleado.html',
        facturas=facturas,
        empleado_usuario=current_user
    )


@views.route('/habitaciones')
@token_required
def ver_habitaciones_cliente(current_user):
    habitaciones = Habitacion.query.filter_by(estado='Disponible').all()

    return render_template(
        'habitaciones_cliente.html',
        habitaciones=habitaciones,
        cliente_usuario=current_user
    )

#Reservas de cliente al dar cliek en la habitacion


@views.route('/reservar_cliente/<int:id>', methods=['GET', 'POST'])
@token_required
def reservar_cliente(current_user, id):
    habitacion = db.session.get(Habitacion, id)

    if not habitacion or habitacion.estado != 'Disponible':
        flash('Habitación no disponible', 'danger')
        return redirect(url_for('views.ver_habitaciones_cliente'))

    if request.method == 'POST':
        checkin = request.form.get('checkin')
        checkout = request.form.get('checkout')

        if not checkin or not checkout:
            flash('Selecciona fechas', 'danger')
            return redirect(request.url)

        if checkin > checkout:
            flash('Fechas inválidas', 'danger')
            return redirect(request.url)

        nueva_reserva = Reserva(
            cliente_id=current_user.id_cliente,
            habitacion_id=id,
            empleado_id=None,  # cliente online
            sucursal_id=habitacion.sucursal_id,
            fecha_reserva=date.today(),
            checkin=checkin,
            checkout=checkout,
            estado='Reservada',
            metodo_reserva='Online'
        )

        db.session.add(nueva_reserva)
        db.session.commit()

        flash('Reserva realizada correctamente', 'success')
        return redirect(url_for('views.ver_habitaciones_cliente'))

    return render_template('reservar_cliente.html', habitacion=habitacion)

#barra busqueda habitaciones clientes}

@views.route('/buscar_habitaciones', methods=['GET'])
@token_required
def buscar_habitaciones(current_user):
    query = request.args.get('query', '').strip()
    tipo = request.args.get('tipo', '')
    precio_max = request.args.get('precio_max')

    habitaciones = Habitacion.query.filter_by(estado='Disponible')

    # búsqueda general
    if query:
        habitaciones = habitaciones.filter(
            or_(
                Habitacion.tipo.ilike(f"%{query}%"),
                Habitacion.numero.like(f"%{query}%")
            )
        )

    # iltro por tipo
    if tipo:
        habitaciones = habitaciones.filter(Habitacion.tipo == tipo)

    # filtro por precio máximo
    if precio_max:
        habitaciones = habitaciones.filter(Habitacion.precio_noche <= precio_max)

    habitaciones = habitaciones.all()

    return render_template(
        'habitaciones_cliente.html',
        habitaciones=habitaciones,
        cliente_usuario=current_user,
        busqueda=query
    )
#Generar factura (empleados)
@views.route('/generar_factura/<int:reserva_id>', methods=['POST'])
@token_empleado
def generar_factura_route(current_user, reserva_id):

    success, message = generar_factura(
        reserva_id=reserva_id,
        empleado_id=current_user.id_empleado
    )

    if success:
        return {"msg": message}, 201
    else:
        return {"error": message}, 400

#facturas clientes
@views.route('/mis_facturas')
@token_required
def ver_facturas_cliente(current_user):

    facturas = Factura.query.join(Reserva).filter(
        Reserva.cliente_id == current_user.id_cliente
    ).all()

    return render_template(
        'facturas_cliente.html',
        facturas=facturas,
        cliente_usuario=current_user
    )
#CAuadros de estado vista admin, rentados, disponibles, llegadas hoy, cancelaciones hoy.
@views.route('/dashboard_admin')
@token_empleado
def dashboard_admin(current_user):

    hoy = date.today()

    # Habitaciones
    total_habitaciones = Habitacion.query.count()

    habitaciones_ocupadas = db.session.query(Habitacion).join(Reserva).filter(
        Reserva.checkin <= hoy,
        Reserva.checkout > hoy,
        Reserva.estado == "ACTIVA"
    ).count()

    habitaciones_disponibles = total_habitaciones - habitaciones_ocupadas

    # Llegadas hoy (check-in hoy)
    llegadas_hoy = Reserva.query.filter(
        Reserva.checkin == hoy,
        Reserva.estado == "ACTIVA"
    ).count()

    # Cancelaciones hoy
    cancelaciones_hoy = Reserva.query.filter(
        Reserva.estado == "CANCELADA",
        Reserva.fecha_reserva == hoy
    ).count()

    # No show (reservas que debían llegar hoy pero no llegaron)
    no_show = Reserva.query.filter(
        Reserva.checkin == hoy,
        Reserva.estado == "NO_SHOW"
    ).count()

    return render_template(
        'dashboard_admin.html',
        empleado_usuario=current_user,

        habitaciones_disponibles=habitaciones_disponibles,
        habitaciones_ocupadas=habitaciones_ocupadas,

        llegadas_hoy=llegadas_hoy,
        cancelaciones_hoy=cancelaciones_hoy,
        no_show=no_show
    )


# ENDPOINTS DE ESTADÍSTICAS 

@views.route('/overview_admin', methods=['GET'])
@token_admin
def stats_overview(current_user):
    """Resumen general de estadísticas"""
    try:
        today = date.today()
        start_of_month = today.replace(day=1)
        
        # Total de habitaciones
        total_habitaciones = Habitacion.query.count()
        
        # Habitaciones ocupadas hoy
        ocupadas_hoy = db.session.query(Habitacion).join(Reserva).filter(
            Reserva.checkin <= today,
            Reserva.checkout > today,
            Reserva.estado == "Activa"
        ).count()
        
        # Total de reservas este mes
        reservas_mes = Reserva.query.filter(
            Reserva.fecha_reserva >= start_of_month
        ).count()
        
        # Ingresos este mes
        ingresos_mes = db.session.query(func.sum(Pago.monto)).filter(
            Pago.fecha_pago >= start_of_month,
            Pago.estado_pago == "Completado"
        ).scalar() or 0
        
        # Ocupación promedio (%)
        ocupacion_promedio = round((ocupadas_hoy / total_habitaciones * 100), 2) if total_habitaciones > 0 else 0
        
        return jsonify({
            'total_habitaciones': total_habitaciones,
            'ocupadas_hoy': ocupadas_hoy,
            'disponibles_hoy': total_habitaciones - ocupadas_hoy,
            'reservas_mes': reservas_mes,
            'ingresos_mes': float(ingresos_mes),
            'ocupacion_promedio': ocupacion_promedio
        }), 200
        
    except Exception as e:
        print(f"Error en stats_overview: {str(e)}")
        return jsonify({'error': 'Error al obtener estadísticas'}), 500

@views.route('/reservaciones_por_mes', methods=['GET'])
@token_admin
def stats_reservations_by_month(current_user):
    """Gráfica de reservas por mes (últimos 12 meses)"""
    try:
        today = date.today()
        months_data = []
        
        for i in range(11, -1, -1):
            # Calcular primer y último día del mes
            first_day = today.replace(day=1) - timedelta(days=i*30)
            first_day = first_day.replace(day=1)
            
            if first_day.month == 12:
                last_day = first_day.replace(year=first_day.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last_day = first_day.replace(month=first_day.month + 1, day=1) - timedelta(days=1)
            
            count = Reserva.query.filter(
                Reserva.fecha_reserva >= first_day,
                Reserva.fecha_reserva <= last_day
            ).count()
            
            months_data.append({
                'month': first_day.strftime('%b %Y'),
                'count': count
            })
        
        return jsonify({'data': months_data}), 200
        
    except Exception as e:
        print(f"Error en stats_reservations_by_month: {str(e)}")
        return jsonify({'error': 'Error al obtener reservas por mes'}), 500

@views.route('/ingresos_por_mes', methods=['GET'])
@token_admin
def stats_revenue_by_month(current_user):
    """Gráfica de ingresos por mes (últimos 12 meses)"""
    try:
        today = date.today()
        months_data = []
        
        for i in range(11, -1, -1):
            # Calcular primer y último día del mes
            first_day = today.replace(day=1) - timedelta(days=i*30)
            first_day = first_day.replace(day=1)
            
            if first_day.month == 12:
                last_day = first_day.replace(year=first_day.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last_day = first_day.replace(month=first_day.month + 1, day=1) - timedelta(days=1)
            
            revenue = db.session.query(func.sum(Pago.monto)).filter(
                Pago.fecha_pago >= first_day,
                Pago.fecha_pago <= last_day,
                Pago.estado_pago == "Completado"
            ).scalar() or 0
            
            months_data.append({
                'month': first_day.strftime('%b %Y'),
                'revenue': float(revenue)
            })
        
        return jsonify({'data': months_data}), 200
        
    except Exception as e:
        print(f"Error en stats_revenue_by_month: {str(e)}")
        return jsonify({'error': 'Error al obtener ingresos por mes'}), 500

@views.route('/ocupacion_habitaciones', methods=['GET'])
@token_admin
def stats_room_occupancy(current_user):
    """Ocupación de habitaciones por tipo"""
    try:
        today = date.today()
        
        # Obtener todos los tipos de habitación
        types = db.session.query(Habitacion.tipo, func.count(Habitacion.id_habitacion)).group_by(
            Habitacion.tipo
        ).all()
        
        occupancy_data = []
        
        for tipo, total in types:
            # Contar ocupadas por tipo
            ocupadas = db.session.query(func.count(Habitacion.id_habitacion)).join(Reserva).filter(
                Habitacion.tipo == tipo,
                Reserva.checkin <= today,
                Reserva.checkout > today,
                Reserva.estado == "Activa"
            ).scalar() or 0
            
            porcentaje = round((ocupadas / total * 100), 2) if total > 0 else 0
            
            occupancy_data.append({
                'tipo': tipo,
                'total': total,
                'ocupadas': ocupadas,
                'disponibles': total - ocupadas,
                'porcentaje': porcentaje
            })
        
        return jsonify({'data': occupancy_data}), 200
        
    except Exception as e:
        print(f"Error en stats_room_occupancy: {str(e)}")
        return jsonify({'error': 'Error al obtener ocupación de habitaciones'}), 500

@views.route('/ingresos_por_periodo', methods=['GET'])
@token_admin
def stats_revenue_by_period(current_user):
    """Ingresos por período (por tipo de habitación)"""
    try:
        today = date.today()
        start_of_month = today.replace(day=1)
        
        # Ingresos por tipo de habitación
        revenue_by_type = db.session.query(
            Habitacion.tipo,
            func.sum(Pago.monto)
        ).join(Reserva, Pago.reserva_id == Reserva.id_reserva).join(
            Habitacion, Reserva.habitacion_id == Habitacion.id_habitacion
        ).filter(
            Pago.fecha_pago >= start_of_month,
            Pago.estado_pago == "Completado"
        ).group_by(Habitacion.tipo).all()
        
        data = []
        for tipo, revenue in revenue_by_type:
            data.append({
                'tipo': tipo if tipo else 'Sin especificar',
                'revenue': float(revenue) if revenue else 0
            })
        
        return jsonify({'data': data}), 200
        
    except Exception as e:
        print(f"Error en stats_revenue_by_period: {str(e)}")
        return jsonify({'error': 'Error al obtener ingresos por período'}), 500

@views.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Todos los campos son obligatorios.'}), 400

    # Generar el hash de la contraseña para comparar (según tu lógica actual de SHA256)
    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    # 1. Buscar en Administradores
    admin = Admin.query.filter_by(email=email).first()
    if admin:
        if admin.password_hash == hashed_password:
            if admin.estado != 'activo':
                return jsonify({'error': 'Usuario inactivo.'}), 403
            token = jwt.encode({'email': admin.email, 'exp': datetime.utcnow() + timedelta(hours=2)}, SECRET_KEY, algorithm='HS256')
            return jsonify({'token': token, 'rol': 'admin'}), 200
        else:
            return jsonify({'error': 'Contraseña incorrecta.'}), 401

    # 2. Buscar en Empleados (incluye Gerente y Empleado de mostrador)
    empleado = Empleado.query.filter_by(email=email).first()
    if empleado:
        if empleado.password_hash == hashed_password:
            if empleado.estado != 'activo':
                return jsonify({'error': 'Empleado inactivo.'}), 403
            token = jwt.encode({'id_empleado': empleado.id_empleado, 'exp': datetime.utcnow() + timedelta(hours=2)}, SECRET_KEY, algorithm='HS256')
            # Retornamos el rol almacenado en la base de datos (convertido a minúsculas para hacer match con React)
            return jsonify({'token': token, 'rol': empleado.rol.lower()}), 200
        else:
            return jsonify({'error': 'Contraseña incorrecta.'}), 401

    # 3. Buscar en Clientes
    cliente = Cliente.query.filter_by(email=email).first()
    if cliente:
        # Nota: Asegúrate de tener la columna password_hash en la tabla Cliente en base.py si vas a usarlo aquí
        if hasattr(cliente, 'password_hash') and cliente.password_hash == hashed_password:
            token = jwt.encode({'id_cliente': cliente.id_cliente, 'exp': datetime.utcnow() + timedelta(hours=2)}, SECRET_KEY, algorithm='HS256')
            return jsonify({'token': token, 'rol': 'cliente'}), 200
        else:
            return jsonify({'error': 'Contraseña incorrecta.'}), 401

    return jsonify({'error': 'Credenciales inválidas corporativas.'}), 401

@views.route('/api/habitaciones', methods=['GET'])
def api_get_habitaciones():
    try:
        # Consultamos todas las habitaciones de la BD
        habitaciones_db = Habitacion.query.all()
        resultado = []

        for hab in habitaciones_db:
            # Formateamos el estado para que coincida con el frontend (minúsculas)
            # Aseguramos que si está vacío diga 'disponible'
            estado_actual = hab.estado.lower() if hab.estado else "disponible"
            
            # Construimos el diccionario base que espera React
            hab_data = {
                "id_db": hab.id_habitacion, # El ID real en la tabla
                "id": str(hab.numero),      # El número visual (ej. 101)
                "type": hab.tipo,           # Ej. 'Suite', 'Doble'
                "status": estado_actual,
                "precio": float(hab.precio_noche) if hab.precio_noche else 0.0,
                "guest": None,
                "folio": None,
                "guestDetails": None
            }

            if estado_actual in ["ocupada", "reservada"]:
                # Buscamos la reserva activa o programada para esta habitación
                reserva_activa = Reserva.query.filter(
                    Reserva.habitacion_id == hab.id_habitacion,
                    Reserva.estado.in_(["Activa", "Reservada"])
                ).first()

                if reserva_activa and reserva_activa.cliente:
                    cliente = reserva_activa.cliente
                    detalles = reserva_activa.detalles_huesped 
                    
                    # --- NUEVO SISTEMA DE FOLIO DINÁMICO ---
                    fecha_reserva = reserva_activa.fecha_reserva
                    codigo_fecha = fecha_reserva.strftime('%y%m') if fecha_reserva else "0000"
                    codigo_hex = f"{reserva_activa.id_reserva:04X}"
                    folio_profesional = f"VL-{codigo_fecha}-{codigo_hex}"
                    
                    hab_data["guest"] = f"{cliente.nombre} {cliente.apellido}".strip()
                    hab_data["folio"] = folio_profesional
                    
                    hab_data["guestDetails"] = {
                        "telefono": detalles.telefono if (detalles and detalles.telefono) else "No registrado",
                        "email": detalles.email if (detalles and detalles.email) else "No registrado",
                        "empresa": detalles.cargo.split(" :: ")[0] if (detalles and detalles.cargo and " :: " in detalles.cargo) else (detalles.cargo if detalles else "Particular"),
                        "fechaEntrada": reserva_activa.checkin.strftime("%Y-%m-%d") if reserva_activa.checkin else "N/A",
                        "fechaSalida": reserva_activa.checkout.strftime("%Y-%m-%d") if reserva_activa.checkout else "N/A",
                        "fechaNacimiento": detalles.fecha_nacimiento.strftime("%Y-%m-%d") if (detalles and detalles.fecha_nacimiento) else "No registrado",
                        "personas": detalles.personas if detalles else 1,
                        "notas": f"RFC: {detalles.rfc}" if (detalles and detalles.rfc) else "Ninguna nota adicional."
                    }

            resultado.append(hab_data)

        return jsonify(resultado), 200

    except Exception as e:
        print(f"Error al obtener habitaciones: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al cargar habitaciones'}), 500

@views.route('/api/seed_habitaciones', methods=['GET'])
def seed_habitaciones():
    try:

        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        db.session.execute(text("DELETE FROM factura")) # Borra hijos
        db.session.execute(text("DELETE FROM reserva")) # Borra dependientes
        db.session.execute(text("DELETE FROM habitacion")) # Borra padres

        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.session.commit()

        plan_habitaciones = [
            {"tipo": "Individual", "cantidad": 10, "precio": 900.00},
            {"tipo": "Doble", "cantidad": 15, "precio": 1200.00},
            {"tipo": "Matrimonial", "cantidad": 10, "precio": 1400.00},
            {"tipo": "Ejecutiva", "cantidad": 5, "precio": 1800.00},
            {"tipo": "Suite", "cantidad": 5, "precio": 2800.00},
            {"tipo": "Familiar", "cantidad": 5, "precio": 3500.00}
        ]

        numero_actual = 101 # Empezamos en la habitación 101

        for plan in plan_habitaciones:
            for _ in range(plan["cantidad"]):
                nueva_hab = Habitacion(
                    numero=numero_actual,
                    tipo=plan["tipo"],
                    precio_noche=plan["precio"],
                    estado="Disponible", # Todas nacerán como Disponibles
                    estado_limpieza="Limpia",
                    sucursal_id=1
                )
                db.session.add(nueva_hab)
                numero_actual += 1

                if str(numero_actual).endswith('11') and plan["tipo"] == "Individual":
                    numero_actual = 201
                elif str(numero_actual).endswith('16') and plan["tipo"] == "Doble":
                    numero_actual = 301
                elif str(numero_actual).endswith('11') and plan["tipo"] == "Matrimonial":
                    numero_actual = 401

        db.session.commit()
        return jsonify({"mensaje": "¡Éxito! Base de datos limpiada y 50 Habitaciones nuevas creadas correctamente."}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Hubo un problema al crear las habitaciones: {str(e)}"}), 500

@views.route('/api/checkin', methods=['POST'])
def api_checkin_rapido():
    data = request.get_json()
    
    # Extraer campos del Súper Formulario
    nombre_huesped = data.get('nombre')
    habitacion_numero = data.get('habitacion_id')
    personas = data.get('personas', 1)
    fecha_nacimiento_str = data.get('fechaNacimiento')
    fecha_entrada_str = data.get('fechaEntrada')
    fecha_salida_str = data.get('fechaSalida')
    telefono = data.get('telefono', '')
    email = data.get('email', '')
    rfc = data.get('rfc', '')
    empresa_input = data.get('empresa', '')
    cargo_input = data.get('cargo', '')

    # Empaquetamos la empresa y el cargo de forma segura usando el separador estricto
    cargo_final = f"{empresa_input} :: {cargo_input}" if empresa_input else cargo_input

    if not nombre_huesped or not habitacion_numero or not fecha_entrada_str or not fecha_salida_str:
        return jsonify({'error': 'Faltan campos obligatorios para el Check-in'}), 400

    try:
        # Convertimos los strings a objetos tipo date de Python
        fecha_entrada = datetime.strptime(fecha_entrada_str, '%Y-%m-%d').date()
        fecha_salida = datetime.strptime(fecha_salida_str, '%Y-%m-%d').date()
        fecha_nacimiento = datetime.strptime(fecha_nacimiento_str, '%Y-%m-%d').date() if fecha_nacimiento_str else None

        # Buscamos la habitación por su número visual (ej. 101)
        habitacion = Habitacion.query.filter_by(numero=habitacion_numero).first()
        
        if not habitacion or habitacion.estado.lower() != "disponible":
            return jsonify({'error': 'Habitación no válida o no disponible'}), 400

        # Si el huésped trae datos de empresa, se cataloga automáticamente como Ejecutivo
        tipo_cliente_final = "Ejecutivo" if empresa_input else "Particular"

        # 1. Crear Cliente con su tipo correspondiente
        nuevo_cliente = Cliente(
            nombre=nombre_huesped,
            apellido="", 
            telefono=telefono,
            email=email,
            tipo_cliente=tipo_cliente_final,
            fecha_registro=datetime.now()
        )
        db.session.add(nuevo_cliente)
        db.session.flush() # Asigna un ID temporal al cliente para usarlo en la reserva

        # 2. Actualizar el estado de la Habitación
        habitacion.estado = "Ocupada"

        # 3. Crear la Reserva Activa
        nueva_reserva = Reserva(
            cliente_id=nuevo_cliente.id_cliente,
            habitacion_id=habitacion.id_habitacion,
            sucursal_id=habitacion.sucursal_id,
            fecha_reserva=date.today(),
            checkin=fecha_entrada,
            checkout=fecha_salida,
            estado="Activa",
            metodo_reserva="Mostrador"
        )
        db.session.add(nueva_reserva)
        db.session.flush()

        # 4. Crear los Detalles del Huésped guardando el cargo unificado
        nuevos_detalles = DetallesHuesped(
            reserva_id=nueva_reserva.id_reserva,
            fecha_nacimiento=fecha_nacimiento,
            personas=personas,
            telefono=telefono,
            email=email,
            cargo=cargo_final,
            rfc=rfc
        )
        db.session.add(nuevos_detalles)
        
        # Guardamos de forma definitiva en MySQL
        db.session.commit()
        return jsonify({'mensaje': 'Check-in realizado con éxito'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error crítico en check-in: {str(e)}")
        return jsonify({'error': 'Ocurrió un error al procesar el Check-in en el servidor.'}), 500
    
@views.route('/api/checkout', methods=['POST'])
def api_checkout():
    data = request.get_json()
    habitacion_numero = data.get('habitacion_id')
    
    if not habitacion_numero:
        return jsonify({'error': 'Falta seleccionar la habitación a liberar'}), 400
        
    try:
        habitacion = Habitacion.query.filter_by(numero=habitacion_numero).first()
        if not habitacion:
            return jsonify({'error': 'Habitación no encontrada en el sistema'}), 404
            
        reserva = Reserva.query.filter_by(habitacion_id=habitacion.id_habitacion, estado='Activa').first()
        if not reserva:
            return jsonify({'error': 'No hay una reserva activa en esta habitación'}), 404
            
        cliente = reserva.cliente
        detalles_huesped = reserva.detalles_huesped

        # 1. Calcular noches de estadía reales
        fecha_in = reserva.checkin
        fecha_out = reserva.checkout
        noches = (fecha_out - fecha_in).days
        if noches <= 0: 
            noches = 1 

        precio_noche = float(habitacion.precio_noche or 0.0)
        subtotal_hospedaje = precio_noche * noches

        # 2. SISTEMA DE EXTRACCIÓN PARSEO CORPORATIVO DE CONVENIO
        porcentaje_descuento = 0.0
        id_empresa_factura = None

        if cliente and detalles_huesped and detalles_huesped.cargo:
            # Descomponemos el string (Ej: "Bimbo S.A :: Supervisor") para extraer la empresa pura
            nombre_empresa_pura = detalles_huesped.cargo.split(" :: ")[0] if " :: " in detalles_huesped.cargo else detalles_huesped.cargo
            
            # Buscamos la empresa en la BD por su nombre real o por el RFC ingresado
            empresa = Empresa.query.filter(
                (Empresa.nombre == nombre_empresa_pura) | (Empresa.rfc == detalles_huesped.rfc)
            ).first()
            
            if empresa:
                id_empresa_factura = empresa.id_empresa
                # Buscamos su convenio comercial activo
                convenio = Convenio.query.filter_by(empresa_id=empresa.id_empresa, activo=True).first()
                if convenio:
                    porcentaje_descuento = float(convenio.descuento or 0.0)

        # 3. Aplicar descuento financiero estricto
        descuento_aplicado = subtotal_hospedaje * (porcentaje_descuento / 100.0)
        total_hospedaje_neto = subtotal_hospedaje - descuento_aplicado

        # 4. Servicios Extra contratados
        servicios_extra = Servicio.query.filter_by(reserva_id=reserva.id_reserva, facturado=False).all()
        total_servicios = sum(float(s.costo or 0.0) for s in servicios_extra)

        # 5. Estructura de Totales e Impuestos Fiscales
        subtotal_final = total_hospedaje_neto + total_servicios
        iva_trasladado = subtotal_final * 0.16
        ish_local = total_hospedaje_neto * 0.03 
        total_general_neto = subtotal_final + iva_trasladado + ish_local

        # 6. Penalización Late Check-out
        hora_limite = datetime.combine(reserva.checkout, datetime.min.time()).replace(hour=12, minute=0)
        hora_actual = datetime.now()
        sancion_msg = ""
        tipo_alerta = "success"

        if hora_actual > hora_limite:
            horas_retraso = (hora_actual - hora_limite).total_seconds() / 3600
            monto_sancion = round(horas_retraso * 200.0, 2)
            total_general_neto += monto_sancion
            sancion_msg = f" ¡Salida tardía! Penalización de ${monto_sancion} MXN añadida."
            tipo_alerta = "warning"

        # 7. REGISTRO DE PAGO IDEMPOTENTE: Evita el colapso por restricción Unique
        pago_existente = Pago.query.filter_by(reserva_id=reserva.id_reserva).first()
        monto_final_decimal = Decimal(str(round(total_general_neto, 2)))

        if pago_existente:
            # Si ya se abonó en el check-in, actualizamos el monto final con penalizaciones si las hay
            pago_existente.monto = monto_final_decimal
            pago_existente.fecha_pago = datetime.now()
            pago_existente.estado_pago = "Completado" if not id_empresa_factura else "Pendiente"
        else:
            nuevo_pago = Pago(
                reserva_id=reserva.id_reserva,
                monto=monto_final_decimal,
                metodo_pago="Por definir" if id_empresa_factura else "Tarjeta/Efectivo",
                estado_pago="Completado" if not id_empresa_factura else "Pendiente",
                fecha_pago=datetime.now()
            )
            db.session.add(nuevo_pago)

        # 8. GENERACIÓN DE FACTURA IDEMPOTENTE: Evita el colapso por restricción Unique
        factura_existente = Factura.query.filter_by(reserva_id=reserva.id_reserva).first()
        if factura_existente:
            factura_existente.total = monto_final_decimal
            factura_existente.empresa_id = id_empresa_factura
            factura_existente.estado = "Pendiente" if id_empresa_factura else "Pagada"
            factura_existente.fecha_emision = datetime.now()
            nueva_factura = factura_existente
        else:
            nueva_factura = Factura(
                reserva_id=reserva.id_reserva,
                empresa_id=id_empresa_factura, 
                total=monto_final_decimal,
                estado="Pendiente" if id_empresa_factura else "Pagada",
                tipo_envio="DIGITAL",
                fecha_emision=datetime.now(),
                generado_por_empleado=reserva.empleado_id
            )
            db.session.add(nueva_factura)
            db.session.flush()

        # 9. Detalles correlativos de servicios
        for s in servicios_extra:
            nuevo_detalle = FacturaDetalle(
                factura_id=nueva_factura.id_factura,
                servicio_id=s.id_servicio,
                subtotal=s.costo
            )
            s.facturado = True 
            db.session.add(nuevo_detalle)

        # 10. Liberar estado de la habitación física
        reserva.estado = 'Finalizada'
        habitacion.estado = 'Sucia' 

        db.session.commit()
        
        msg_convenio = f" con {porcentaje_descuento}% desc. corporativo aplicado." if porcentaje_descuento > 0 else ""
        return jsonify({
            'mensaje': f'Check-out completado con éxito{msg_convenio}.{sancion_msg} Factura enviada a la bandeja gerencial.',
            'tipo_alerta': tipo_alerta
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error crítico en el proceso de check-out: {str(e)}")
        return jsonify({'error': 'Ocurrió un error en el servidor al automatizar los totales de la salida.'}), 500

@views.route('/api/limpiar', methods=['POST'])
def api_limpiar_habitacion():
    data = request.get_json()
    habitacion_numero = data.get('habitacion_id')

    if not habitacion_numero:
        return jsonify({'error': 'Falta el número de habitación'}), 400

    try:
        # Buscamos la habitación por su número visual (ej. 101)
        habitacion = Habitacion.query.filter_by(numero=habitacion_numero).first()
        
        if not habitacion:
            return jsonify({'error': 'Habitación no encontrada'}), 404

        if habitacion.estado.lower() != 'sucia':
            return jsonify({'error': 'La habitación no tiene estado "Sucia"'}), 400

        # Actualizamos el estado para regresarla al mercado
        habitacion.estado = "Disponible"
        habitacion.estado_limpieza = "Limpia"
        
        db.session.commit()

        return jsonify({'mensaje': f'¡Habitación {habitacion_numero} limpia y lista para nuevos huéspedes!'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error en limpieza: {str(e)}")
        return jsonify({'error': 'Ocurrió un error al actualizar el estado de la habitación.'}), 500

@views.route('/api/reserva_rapida', methods=['POST'])
def api_reserva_rapida():
    data = request.get_json()
    
    nombre_huesped = data.get('nombre')
    habitacion_numero = data.get('habitacion_id')
    personas = data.get('personas', 1)
    fecha_nacimiento_str = data.get('fechaNacimiento')
    fecha_entrada_str = data.get('fechaEntrada')
    fecha_salida_str = data.get('fechaSalida')
    telefono = data.get('telefono', '')
    email = data.get('email', '')
    cargo = data.get('cargo', '')
    rfc = data.get('rfc', '')
    empresa_input = data.get('empresa', '')
    cargo_input = data.get('cargo', '')
    
    cargo_final = f"{empresa_input} :: {cargo_input}" if empresa_input else cargo_input

    if not nombre_huesped or not habitacion_numero or not fecha_entrada_str or not fecha_salida_str:
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    try:
        fecha_entrada = datetime.strptime(fecha_entrada_str, '%Y-%m-%d').date()
        fecha_salida = datetime.strptime(fecha_salida_str, '%Y-%m-%d').date()
        fecha_nacimiento = datetime.strptime(fecha_nacimiento_str, '%Y-%m-%d').date() if fecha_nacimiento_str else None

        habitacion = Habitacion.query.filter_by(numero=habitacion_numero).first()
        if not habitacion:
            return jsonify({'error': 'Habitación no válida'}), 400

        # --- PROTECCIÓN DE FECHAS (ALGORITMO ANTI-CHOQUES) ---
        # Verificamos si existe alguna reserva que se solape con las fechas solicitadas
        conflicto = Reserva.query.filter(
            Reserva.habitacion_id == habitacion.id_habitacion,
            Reserva.estado.in_(['Activa', 'Reservada']),
            Reserva.checkin < fecha_salida,   # La reserva existente entra antes de que el nuevo salga
            Reserva.checkout > fecha_entrada  # La reserva existente sale después de que el nuevo entra
        ).first()

        if conflicto:
            return jsonify({'error': 'La habitación ya está ocupada o reservada durante esas fechas.'}), 400

        # 1. Crear Cliente
        nuevo_cliente = Cliente(
            nombre=nombre_huesped,
            apellido="", 
            telefono=telefono,
            email=email,
            tipo_cliente="Particular" if not cargo else "Ejecutivo",
            fecha_registro=datetime.now()
        )
        db.session.add(nuevo_cliente)
        db.session.flush()

        # 2. Actualizar Habitación al nuevo estado
        habitacion.estado = "Reservada"

        # 3. Crear Reserva
        nueva_reserva = Reserva(
            cliente_id=nuevo_cliente.id_cliente,
            habitacion_id=habitacion.id_habitacion,
            sucursal_id=habitacion.sucursal_id,
            fecha_reserva=date.today(),
            checkin=fecha_entrada,
            checkout=fecha_salida,
            estado="Reservada", # Estado específico
            metodo_reserva="Mostrador"
        )
        db.session.add(nueva_reserva)
        db.session.flush()

        # 4. Crear Detalles del Huésped
        nuevos_detalles = DetallesHuesped(
            reserva_id=nueva_reserva.id_reserva,
            fecha_nacimiento=fecha_nacimiento,
            personas=personas,
            telefono=telefono,
            email=email,
            cargo=cargo,
            rfc=rfc
        )
        db.session.add(nuevos_detalles)
        
        db.session.commit()
        return jsonify({'mensaje': '¡Reserva rápida generada exitosamente!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ocurrió un error al procesar la reserva.'}), 500

@views.route('/api/cancelar_reserva', methods=['POST'])
def api_cancelar_reserva():
    data = request.get_json()
    habitacion_numero = data.get('habitacion_id')

    if not habitacion_numero:
        return jsonify({'error': 'Falta seleccionar la habitación'}), 400

    try:
        habitacion = Habitacion.query.filter_by(numero=habitacion_numero).first()
        if not habitacion:
            return jsonify({'error': 'Habitación no encontrada'}), 404

        # Buscamos la reserva que esté activa o reservada en esa habitación
        reserva = Reserva.query.filter(
            Reserva.habitacion_id == habitacion.id_habitacion,
            Reserva.estado.in_(['Activa', 'Reservada'])
        ).first()

        if not reserva:
            return jsonify({'error': 'No se encontró una reserva activa para cancelar.'}), 404

        # Cambiamos los estados
        reserva.estado = 'Cancelada'
        habitacion.estado = 'Disponible'
        habitacion.estado_limpieza = 'Limpia' # Asumimos que no se ensució si se canceló

        db.session.commit()
        return jsonify({'mensaje': f'Reserva de {reserva.cliente.nombre} cancelada exitosamente.'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ocurrió un error al cancelar la reserva.'}), 500


@views.route('/api/mantenimiento', methods=['POST'])
def api_mantenimiento():
    data = request.get_json()
    habitacion_numero = data.get('habitacion_id')

    if not habitacion_numero:
        return jsonify({'error': 'Falta el número de habitación'}), 400

    try:
        habitacion = Habitacion.query.filter_by(numero=habitacion_numero).first()
        if not habitacion:
            return jsonify({'error': 'Habitación no encontrada'}), 404

        # Si está en mantenimiento, la liberamos. Si no, la enviamos a mantenimiento.
        if habitacion.estado.lower() == 'mantenimiento':
            habitacion.estado = 'Disponible'
            mensaje = f'Habitación {habitacion_numero} reparada y Disponible.'
        else:
            habitacion.estado = 'Mantenimiento'
            mensaje = f'Habitación {habitacion_numero} enviada a Mantenimiento.'

        db.session.commit()
        return jsonify({'mensaje': mensaje}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ocurrió un error al actualizar el mantenimiento.'}), 500

# ==========================================
# ENDPOINTS PARA GESTIÓN GERENCIAL
# ==========================================

# --- OBTENER TODOS LOS CONVENIOS ---
@views.route('/api/convenios', methods=['GET'])
def api_get_convenios():
    try:
        # Hacemos un JOIN con Empresa para poder leer el nombre de la empresa
        convenios_db = Convenio.query.join(Empresa).all()
        resultado = []
        
        for conv in convenios_db:
            # Damos formato a los datos para que encajen con lo que espera React
            estado_str = "Activo" if conv.activo else "Inactivo"
            descuento_fmt = f"{int(conv.descuento)}%" if conv.descuento else "0%"
            
            resultado.append({
                "id": conv.id_convenio,
                "empresa": conv.empresa.nombre,
                "descuento": descuento_fmt,
                "terminos": conv.terminos,
                "estado": estado_str
            })
            
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"Error al obtener convenios: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al cargar convenios'}), 500


# --- CREAR UN NUEVO CONVENIO ---
@views.route('/api/convenios', methods=['POST'])
def api_crear_convenio():
    data = request.get_json()
    
    nombre_empresa = data.get('empresa')
    descuento_str = data.get('descuento') # Viene de React como un string
    terminos = data.get('terminos')

    if not nombre_empresa or not descuento_str or not terminos:
        return jsonify({'error': 'Todos los campos son obligatorios'}), 400

    try:
        # Limpiamos el símbolo de porcentaje si viene incluido para guardarlo como DECIMAL
        descuento_val = float(str(descuento_str).replace('%', '').strip())

        # 1. Buscamos si la empresa ya existe en la BD
        empresa = Empresa.query.filter_by(nombre=nombre_empresa).first()
        
        # Si no existe, la creamos al vuelo generando un RFC único temporal
        if not empresa:
            # Generamos un identificador único corto (Ej: INV-A1B2C3D4) para no romper el 'unique=True'
            short_id = str(uuid.uuid4())[:8].upper()
            empresa = Empresa(
                nombre=nombre_empresa,
                rfc=f"INV-{short_id}",
                telefono="No registrado",
                email="No registrado",
                estado="Activo"
            )
            db.session.add(empresa)
            db.session.flush() # Asigna el id_empresa temporalmente

        # 2. Creamos el nuevo Convenio
        nuevo_convenio = Convenio(
            empresa_id=empresa.id_empresa,
            terminos=terminos,
            descuento=descuento_val,
            fecha_inicio=date.today(),
            fecha_fin=date.today().replace(year=date.today().year + 1), # Vigencia de 1 año por defecto
            activo=True
        )
        
        db.session.add(nuevo_convenio)
        db.session.commit()

        return jsonify({'mensaje': f'Convenio con {nombre_empresa} creado exitosamente.'}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error al crear convenio: {str(e)}")
        return jsonify({'error': 'Ocurrió un error al guardar el convenio en el servidor.'}), 500
    
# --- ACTUALIZAR UN CONVENIO (EDITAR O CAMBIAR ESTADO) ---
@views.route('/api/convenios/<int:id_convenio>', methods=['PUT'])
def api_actualizar_convenio(id_convenio):
    data = request.get_json()
    
    try:
        convenio = Convenio.query.get(id_convenio)
        if not convenio:
            return jsonify({'error': 'Convenio no encontrado'}), 404
        
        if 'empresa' in data and convenio.empresa:
            convenio.empresa.nombre = data['empresa']
            
        # Si se envía un nuevo descuento, lo actualizamos
        if 'descuento' in data:
            convenio.descuento = float(str(data['descuento']).replace('%', '').strip())
            
        # Si se envían nuevos términos, los actualizamos
        if 'terminos' in data:
            convenio.terminos = data['terminos']
            
        # Si se envía un cambio de estado, lo actualizamos
        if 'estado' in data:
            convenio.activo = True if data['estado'] == 'Activo' else False
            
        db.session.commit()
        return jsonify({'mensaje': 'Convenio actualizado correctamente.'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al actualizar el convenio.'}), 500


# --- ELIMINAR UN CONVENIO ---
@views.route('/api/convenios/<int:id_convenio>', methods=['DELETE'])
def api_eliminar_convenio(id_convenio):
    try:
        convenio = Convenio.query.get(id_convenio)
        if not convenio:
            return jsonify({'error': 'Convenio no encontrado'}), 404
            
        db.session.delete(convenio)
        db.session.commit()
        
        return jsonify({'mensaje': 'Convenio eliminado de forma permanente.'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'No se pudo eliminar el convenio por dependencias en el sistema.'}), 500

# --- OBTENER REPRESENTANTES CORPORATIVOS ---
@views.route('/api/representantes', methods=['GET'])
def api_get_representantes():
    try:
        # Buscamos las reservas activas o finalizadas de clientes catalogados como Ejecutivos
        reservas = Reserva.query.join(Cliente).filter(Cliente.tipo_cliente == 'Ejecutivo').all()
        resultado = []
        
        for res in reservas:
            detalles = res.detalles_huesped
            
            # Formateamos los datos para la tabla en React
            resultado.append({
                "id": res.id_reserva,
                "nombre": f"{res.cliente.nombre} {res.cliente.apellido}".strip(),
                "empresa": detalles.cargo.split(" :: ")[0] if (detalles and detalles.cargo and " :: " in detalles.cargo) else (detalles.cargo if detalles else "Particular"),
                "habitacion": f"Hab. {res.habitacion.numero} ({res.habitacion.tipo})" if res.habitacion else "N/A",
                "estadia": f"{res.checkin.strftime('%d %b')} - {res.checkout.strftime('%d %b')}" if res.checkin and res.checkout else "N/A"
            })
            
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"Error al obtener representantes: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al cargar representantes'}), 500

# --- ENVIAR Y MARCAR FACTURA COMO PAGADA ---
@views.route('/api/enviar_factura', methods=['POST'])
def api_enviar_factura():
    data = request.get_json()
    factura_id = data.get('id_real')
    
    if not factura_id:
        return jsonify({'error': 'Falta el identificador de la factura'}), 400
        
    try:
        factura = Factura.query.get(factura_id)
        if not factura:
            return jsonify({'error': 'Factura no encontrada en el sistema'}), 404
            
        # Actualizamos el estado para indicar que fue procesada/pagada
        factura.estado = 'Pagada' 
        db.session.commit()
        
        empresa_destino = factura.empresa.nombre if factura.empresa else "el cliente"
        return jsonify({'mensaje': f'Factura enviada exitosamente a {empresa_destino}.'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error al enviar factura: {str(e)}")
        return jsonify({'error': 'Ocurrió un error al procesar el envío de la factura.'}), 500

# =======================================================
# ENDPOINT GERENCIAL: HISTORIAL DE FACTURACIÓN CORREGIDO
# =======================================================
@views.route('/api/facturas_gerencia', methods=['GET'])
def obtener_facturas_gerencia():
    try:
        facturas = Factura.query.all()
        lista_facturas = []

        for f in facturas:
            reserva = f.reserva 
            if not reserva:
                continue
                
            cliente = reserva.cliente
            detalles_huesped = reserva.detalles_huesped
            
            # Buscar si el cliente tiene un convenio corporativo asignado a través de su empresa
            descuento_corp = 0.0
            nombre_convenio = "Ninguno"
            if f.empresa and f.empresa.convenios:
                convenio_activo = next((c for c in f.empresa.convenios if c.activo), None)
                if convenio_activo:
                    descuento_corp = float(convenio_activo.descuento or 0.0)
                    nombre_convenio = f"Convenio {f.empresa.nombre}"

            # 1. Calcular conceptos de Hospedaje (Noches de estadía)
            fecha_in = reserva.checkin or date.today()
            fecha_out = reserva.checkout or date.today()
            noches = (fecha_out - fecha_in).days
            if noches <= 0:
                noches = 1
                
            precio_noche = float(reserva.habitacion.precio_noche if reserva.habitacion else 0.0)
            subtotal_hospedaje = precio_noche * noches
            descuento_habitacion = subtotal_hospedaje * (descuento_corp / 100.0)
            importe_hospedaje = subtotal_hospedaje - descuento_habitacion

            # Nomenclatura de folios unificados
            codigo_fecha = fecha_in.strftime('%y%m') if fecha_in else "0000"
            codigo_hex = f"{reserva.id_reserva:04X}"
            folio_interno_profesional = f"VL-{codigo_fecha}-{codigo_hex}"

            conceptos_desglosados = [
                {
                    "descripcion": f"Hospedaje - Habitación {reserva.habitacion.numero if reserva.habitacion else ''} ({noches} Noches)",
                    "cantidad": 1,
                    "precio_unitario": round(subtotal_hospedaje, 2),
                    "descuento": round(descuento_habitacion, 2),
                    "importe": round(importe_hospedaje, 2)
                }
            ]

            # 2. Calcular Servicios Extra
            servicios_extra = reserva.servicios or []
            subtotal_servicios = 0.0
            
            for s in servicios_extra:
                monto_s = float(s.costo or 0.0)
                subtotal_servicios += monto_s
                conceptos_desglosados.append({
                    "descripcion": f"Servicio Extra - {s.descripcion or 'Consumo General'}",
                    "cantidad": 1,
                    "precio_unitario": round(monto_s, 2),
                    "descuento": 0.0,
                    "importe": round(monto_s, 2)
                })

            # 3. Impuestos y Totales
            subtotal_general = subtotal_hospedaje + subtotal_servicios
            total_descuento_aplicado = descuento_habitacion
            
            base_iva = importe_hospedaje + subtotal_servicios
            iva = base_iva * 0.16
            ish = importe_hospedaje * 0.03
            
            total_neto = base_iva + iva + ish

            lista_facturas.append({
                "factura_id": f.id_factura,
                "folio_interno": folio_interno_profesional,
                "uuid": f"f47ac10b-58cc-4372-a567-0e02b2c3d4{f.id_factura:02d}",
                "fecha_emision": f.fecha_emision.strftime("%Y-%m-%dT%H:%M:%S") if f.fecha_emision else datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "emisor": {
                    "razon_social": "Hotel Villa Lince S.A. de C.V.",
                    "rfc": "HVL260311LN8",
                    "regimen_fiscal": "601 - General de Ley Personas Morales"
                },
                "receptor": {
                    "nombre_razon_social": f.empresa.nombre if f.empresa else (f"{cliente.nombre} {cliente.apellido}".strip() if cliente else "Huésped General"),
                    "rfc": f.empresa.rfc if f.empresa else (detalles_huesped.rfc if detalles_huesped else 'XAXX010101000'),
                    "convenio_aplicado": nombre_convenio, # <-- CORREGIDO: Asignación limpia sin operador de asignación inválido
                    "descuento_porcentaje": descuento_corp
                },
                "conceptos": conceptos_desglosados,
                "impuestos": {
                    "iva_porcentaje": 16.0,
                    "iva_total": round(iva, 2),
                    "ish_porcentaje": 3.0,
                    "ish_total": round(ish, 2)
                },
                "totales": {
                    "subtotal": round(subtotal_general, 2),
                    "total_descuento": round(total_descuento_aplicado, 2),
                    "total_neto": round(total_neto, 2)
                },
                "estado_pago": f.estado or "Pendiente"
            })

        return jsonify(lista_facturas), 200

    except Exception as e:
        print(f"Error en facturas_gerencia: {str(e)}")
        return jsonify({"error": "Error interno al procesar facturas", "detalles": str(e)}), 500

TERMINAL_CACHE = {}

@views.route('/api/pagos/procesar_inmediato', methods=['POST'])
def procesar_pago_inmediato():
    """ Procesa Efectivo y Tarjeta Local de forma atómica y persistente """
    data = request.get_json()
    metodo_pago = data.get('metodo_pago')
    monto_total = data.get('monto_total')
    datos_reserva = data.get('datos_reserva') 

    if not datos_reserva or not datos_reserva.get('nombre') or not datos_reserva.get('habitacion_id'):
        return jsonify({'error': 'Faltan datos mandatorios de la reserva'}), 400

    try:
        # 1. ACTUALIZAR HABITACIÓN: Localizar por el número visual (Ej: 107)
        habitacion_numero = datos_reserva['habitacion_id']
        habitacion = Habitacion.query.filter_by(numero=habitacion_numero).first()
        
        if not habitacion:
            return jsonify({'error': f'La habitación {habitacion_numero} no existe.'}), 404
            
        if habitacion.estado.lower() != 'disponible':
            return jsonify({'error': f'La habitación {habitacion_numero} ya no está disponible.'}), 400
            
        # Modificamos el estado en memoria antes del Commit unificado
        habitacion.estado = 'Ocupada'

        # 2. CREAR CLIENTE: Identificar si es corporativo para asignar el rol de negocio
        empresa_input = datos_reserva.get('empresa', '')
        tipo_cliente_final = "Ejecutivo" if empresa_input else "Particular"
        
        nuevo_cliente = Cliente(
            nombre=datos_reserva['nombre'],
            apellido="", 
            telefono=datos_reserva.get('telefono', ''),
            email=datos_reserva.get('email', ''),
            tipo_cliente=tipo_cliente_final,
            fecha_registro=datetime.now()
        )
        db.session.add(nuevo_cliente)
        db.session.flush()  # Genera el id_cliente para la llave foránea de la reserva

        # 3. CREAR RESERVA: Parseo estricto de las fechas provenientes del Wizard
        fecha_entrada = datetime.strptime(datos_reserva['fechaEntrada'], '%Y-%m-%d').date()
        fecha_salida = datetime.strptime(datos_reserva['fechaSalida'], '%Y-%m-%d').date()
        
        nueva_reserva = Reserva(
            cliente_id=nuevo_cliente.id_cliente,
            habitacion_id=habitacion.id_habitacion,
            sucursal_id=habitacion.sucursal_id,
            fecha_reserva=date.today(),
            checkin=fecha_entrada,
            checkout=fecha_salida,
            estado="Activa",
            metodo_reserva="Mostrador"
        )
        db.session.add(nueva_reserva)
        db.session.flush()  # Genera el id_reserva para el registro del Pago

        # 4. CREAR PAGO DEFINITIVO
        nuevo_pago = Pago(
            reserva_id=nueva_reserva.id_reserva,
            monto=Decimal(str(monto_total)),
            metodo_pago=metodo_pago,
            estado_pago="Completado",
            fecha_pago=datetime.now()
        )
        db.session.add(nuevo_pago)

        # 5. CREAR DETALLES VINCULADOS DEL HUÉSPED
        fecha_nac_str = datos_reserva.get('fechaNacimiento')
        fecha_nacimiento = datetime.strptime(fecha_nac_str, '%Y-%m-%d').date() if fecha_nac_str else None
        
        cargo_input = datos_reserva.get('cargo', '')
        cargo_final = f"{empresa_input} :: {cargo_input}" if empresa_input else cargo_input

        nuevos_detalles = DetallesHuesped(
            reserva_id=nueva_reserva.id_reserva,
            fecha_nacimiento=fecha_nacimiento,
            personas=int(datos_reserva.get('personas', 1)),
            telefono=datos_reserva.get('telefono', ''),
            email=datos_reserva.get('email', ''),
            cargo=cargo_final,
            rfc=datos_reserva.get('rfc', '')
        )
        db.session.add(nuevos_detalles)

        # COMMIT GLOBAL: Guarda de manera definitiva y atómica en MySQL
        db.session.commit()
        return jsonify({'mensaje': 'Check-In y Pago grabados permanentemente en la base de datos.'}), 200

    except Exception as e:
        db.session.rollback()  # Garantiza la integridad ACID si algo falla
        print(f" Error crítico en procesar_pago_inmediato: {str(e)}")
        return jsonify({'error': f'Error interno de persistencia: {str(e)}'}), 500


@views.route('/api/terminal/solicitar', methods=['POST'])
def terminal_solicitar():
    """ Inicia una solicitud de cobro en la Terminal Física """
    data = request.get_json()
    
    tx_id = str(uuid.uuid4())
    TERMINAL_CACHE[tx_id] = {
        'monto': data.get('monto_total'),
        'estado': 'PENDIENTE',
        'datos_reserva': data.get('datos_reserva'),
        'timestamp': time.time()
    }
    
    return jsonify({'tx_id': tx_id, 'mensaje': 'Esperando a la terminal...'}), 200

@views.route('/api/terminal/estado/<tx_id>', methods=['GET'])
def terminal_estado(tx_id):
    """ Polling para el frontend web: Consulta el estado del cobro """
    tx = TERMINAL_CACHE.get(tx_id)
    if not tx:
        return jsonify({'error': 'Transacción expirada o inexistente'}), 404
    
    return jsonify({'estado': tx['estado']}), 200

def no_cumple_requisitos(datos):
    return not datos or not datos.get('nombre') or not datos.get('habitacion_id')

@views.route('/api/terminal/pendiente', methods=['GET'])
def obtener_terminal_pendiente():
    """ Endpoint para la App Móvil: Descubre si hay algún cobro en fila """
    for tx_id, transaccion in TERMINAL_CACHE.items():
        if transaccion['estado'] == 'PENDIENTE':
            return jsonify({
                'tx_id': tx_id,
                'monto': float(transaccion['monto'])
              }), 200
    return jsonify({'mensaje': 'No hay cobros pendientes por el momento'}), 204


@views.route('/api/terminal/callback', methods=['POST'])
def terminal_callback():
    """ Callback seguro: Recibe la aprobación del smartphone y guarda en la BD """
    data = request.get_json()
    tx_id = data.get('tx_id')
    nuevo_estado = data.get('estado') # 'APROBADO' o 'RECHAZADO'

    if tx_id not in TERMINAL_CACHE:
        return jsonify({'error': 'La transacción no existe o expiró del caché'}), 404

    transaccion = TERMINAL_CACHE[tx_id]

    if nuevo_estado == 'RECHAZADO':
        transaccion['estado'] = 'RECHAZADO'
        return jsonify({'mensaje': 'Estado de rechazo actualizado'}), 200

    if nuevo_estado == 'APROBADO':
        datos_reserva = transaccion['datos_reserva']
        monto_total = transaccion['monto']

        try:
            # PROCESAMIENTO DE PERSISTENCIA ATÓMICA EN MYSQL
            habitacion_numero = datos_reserva['habitacion_id']
            habitacion = Habitacion.query.filter_by(numero=habitacion_numero).first()
            
            if not habitacion or habitacion.estado.lower() != 'disponible':
                transaccion['estado'] = 'RECHAZADO'
                return jsonify({'error': 'La habitación ya no está disponible'}), 400

            habitacion.estado = 'Ocupada'

            # Crear Cliente
            nuevo_cliente = Cliente(
                nombre=datos_reserva['nombre'], apellido="",
                telefono=datos_reserva.get('telefono', ''), email=datos_reserva.get('email', ''),
                tipo_cliente="Ejecutivo" if datos_reserva.get('convenio_id') else "Particular",
                fecha_registro=datetime.now()
            )
            db.session.add(nuevo_cliente)
            db.session.flush()

            # Crear Reserva
            nueva_reserva = Reserva(
                cliente_id=nuevo_cliente.id_cliente,
                habitacion_id=habitacion.id_habitacion,
                sucursal_id=habitacion.sucursal_id,
                fecha_reserva=date.today(),
                checkin=datetime.strptime(datos_reserva['fechaEntrada'], '%Y-%m-%d').date(),
                checkout=datetime.strptime(datos_reserva['fechaSalida'], '%Y-%m-%d').date(),
                estado="Activa", metodo_reserva="Mostrador"
            )
            db.session.add(nueva_reserva)
            db.session.flush()

            # Crear renglón del Pago Autorizado por la Terminal
            porcentaje_comision = datos_reserva.get('comisionPercent', '0')
            metodo_etiqueta = f"Terminal POS (Bancaria (+{porcentaje_comision}% vPOS))"
            
            nuevo_pago = Pago(
                reserva_id=nueva_reserva.id_reserva,
                monto=Decimal(str(monto_total)),
                metodo_pago=metodo_etiqueta,
                estado_pago="Completado",
                fecha_pago=datetime.now()
            )
            db.session.add(nuevo_pago)

            # Crear Detalles del Huésped
            nuevos_detalles = DetallesHuesped(
                reserva_id=nueva_reserva.id_reserva,
                personas=int(datos_reserva.get('personas', 1)),
                telefono=datos_reserva.get('telefono', ''),
                email=datos_reserva.get('email', ''),
                cargo=datos_reserva.get('cargo', ''),
                rfc=datos_reserva.get('rfc', '')
            )
            db.session.add(nuevos_detalles)

            # CONFIRMACIÓN UNIFICADA EN MYSQL
            db.session.commit()
            
            # Cambiamos el estado en el Caché para liberar el bucle useEffect del Frontend
            transaccion['estado'] = 'APROBADO'
            return jsonify({'status': 'SUCCESS', 'mensaje': 'Check-In integrado guardado'}), 200

        except Exception as e:
            db.session.rollback()
            transaccion['estado'] = 'RECHAZADO'
            return jsonify({'error': f'Colapso transaccional: {str(e)}'}), 500

@views.route('/api/terminal/cancelar/<tx_id>', methods=['POST'])
def terminal_cancelar(tx_id):
    """ Cancela la orden de cobro activa desde el mostrador web """
    if tx_id in TERMINAL_CACHE:
        TERMINAL_CACHE[tx_id]['estado'] = 'RECHAZADO'
        return jsonify({'mensaje': 'Transacción abortada por el cajero'}), 200
    return jsonify({'error': 'No se encontró la transacción de origen'}), 404