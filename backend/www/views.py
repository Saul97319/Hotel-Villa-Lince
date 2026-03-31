from flask import Blueprint, render_template, request, jsonify
from base import Admin
from werkzeug.security import check_password_hash
import jwt
import datetime

views = Blueprint('views', __name__)

@views.route('/')
def start():
    return render_template('start.html')

# ==========================================
# NUEVO ENDPOINT DE LOGIN PARA REACT
# ==========================================
@views.route('/api/login', methods=['POST'])
def api_login():
    # 1. Obtener los datos JSON que envía React
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Faltan credenciales"}), 400

    # 2. Buscar al usuario en la base de datos (Tabla Admin)
    admin = Admin.query.filter_by(usuario=email).first()

    # 3. Verificar si el usuario existe y la contraseña es correcta
    if admin and admin.contrasena == password:
        
        # 4. Crear un token JWT
        token = jwt.encode({
            'user': admin.usuario,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        }, 'your_secret_key', algorithm='HS256')

        # 5. Devolver respuesta de éxito simulando un rol
        rol_asignado = "admin"
        if "gerente" in email:
            rol_asignado = "gerente"
        elif "empleado" in email:
            rol_asignado = "empleado"

        return jsonify({
            "mensaje": "Login exitoso",
            "token": token,
            "rol": rol_asignado
        }), 200

    # Si la contraseña o el usuario fallan
    return jsonify({"error": "Credenciales inválidas"}), 401



