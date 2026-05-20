from flask import Blueprint, render_template, request, jsonify
from base import Admin, Cliente, Empleado, Habitacion, Reserva, Sucursal, Empresa,Convenio, Factura, HuespedEmpresarial, Convenio, Pago, Servicio, FacturaDetalle, Reporte
from base import db
from werkzeug.security import check_password_hash
import jwt, base64, hashlib, datetime, re, decimal
import datetime, re
from functools import wraps
from flask import request, redirect, url_for, flash
from datetime import date, datetime, timedelta
from flask import make_response
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, and_
from sqlalchemy.sql import func
from decimal import Decimal
from datetime import datetime

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
        token_base64 = request.cookies.get('admin_token')

        if not token_base64:
            flash('Acceso no autorizado. Inicia sesión.', 'danger')
            return redirect(url_for('views.admin'))

        try:
            # Decodificar Base64
            token = base64.b64decode(token_base64).decode()

            # Decodificar JWT
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])

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

#solo ver convenios (empleados)
@views.route('/convenios')
@token_empleado
def ver_convenios(current_user):
    convenios = Convenio.query.join(Empresa).all()

    return render_template(
        'convenios.html',
        convenios=convenios,
        empleado_usuario=current_user
    )

#visualizar convenios (clientes)
@views.route('/convenios')
@token_required
def ver_convenios(current_user):
    convenios = Convenio.query.join(Empresa).filter(
        Convenio.activo == True,
        Convenio.fecha_fin >= date.today()
    ).all()

    return render_template(
        'convenios.html',
        convenios=convenios,
        cliente_usuario=current_user
    )
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

