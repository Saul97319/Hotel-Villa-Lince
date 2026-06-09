from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, DateTime, Boolean, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

db = SQLAlchemy()

class Sucursal(db.Model):
    __tablename__ = 'sucursal'

    id_sucursal = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))
    direccion = Column(String(200))
    ciudad = Column(String(100))
    telefono = Column(String(20))

    empleados = relationship("Empleado", back_populates="sucursal")
    habitaciones = relationship("Habitacion", back_populates="sucursal")
    reservas = relationship("Reserva", back_populates="sucursal")

class Empleado(db.Model):
    __tablename__ = 'empleado'

    id_empleado = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))
    apellido = Column(String(100))
    email = Column(String(150), unique=True)
    password_hash = Column(String(255))
    rol = Column(String(50))
    estado = Column(String(50))
    sucursal_id = Column(Integer, ForeignKey('sucursal.id_sucursal'))
    fecha_creacion = Column(DateTime, default=func.now())

    sucursal = relationship("Sucursal", back_populates="empleados")
    reservas = relationship("Reserva", back_populates="empleado")

class Admin(db.Model):
    __tablename__ = 'admin'

    id_admin = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))
    email = Column(String(150), unique=True)
    password_hash = Column(String(255))
    estado = Column(String(50))
    fecha_creacion = Column(DateTime, default=func.now())


class Cliente(db.Model):
    __tablename__ = 'cliente'

    id_cliente = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))
    apellido = Column(String(100))
    telefono = Column(String(20))
    email = Column(String(150))
    tipo_cliente = Column(String(50))
    fecha_registro = Column(DateTime, default=func.now())

    reservas = relationship("Reserva", back_populates="cliente")

class Empresa(db.Model):
    __tablename__ = 'empresa'

    id_empresa = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150))
    rfc = Column(String(20), unique=True)
    telefono = Column(String(20))
    email = Column(String(150))
    estado = Column(String(50))

    convenios = relationship("Convenio", back_populates="empresa")
    huespedes = relationship("HuespedEmpresarial", back_populates="empresa")
    facturas = relationship("Factura", back_populates="empresa")

class Convenio(db.Model):
    __tablename__ = 'convenio'

    id_convenio = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey('empresa.id_empresa'))
    terminos = Column(Text)
    descuento = Column(DECIMAL(5,2))
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    activo = Column(Boolean)

    empresa = relationship("Empresa", back_populates="convenios")

class HuespedEmpresarial(db.Model):
    __tablename__ = 'huesped_empresarial'

    id_huesped = Column(Integer, primary_key=True, autoincrement=True)
    empresa_id = Column(Integer, ForeignKey('empresa.id_empresa'))
    nombre = Column(String(150))
    fecha_llegada = Column(Date)
    fecha_salida = Column(Date)
    tipo_habitacion = Column(String(50))

    empresa = relationship("Empresa", back_populates="huespedes")

class DetallesHuesped(db.Model):
    __tablename__ = 'detalles_huesped'

    id_detalle = Column(Integer, primary_key=True, autoincrement=True)
    reserva_id = Column(Integer, ForeignKey('reserva.id_reserva'), unique=True)
    fecha_nacimiento = Column(Date)
    personas = Column(Integer)
    telefono = Column(String(20))
    email = Column(String(150))
    cargo = Column(String(150))
    rfc = Column(String(20))

    reserva = relationship("Reserva", back_populates="detalles_huesped")

class Habitacion(db.Model):
    __tablename__ = 'habitacion'

    id_habitacion = Column(Integer, primary_key=True, autoincrement=True)
    numero = Column(Integer)
    tipo = Column(String(50))
    precio_noche = Column(DECIMAL(10,2))
    estado = Column(String(50))
    estado_limpieza = Column(String(50))
    sucursal_id = Column(Integer, ForeignKey('sucursal.id_sucursal'))

    sucursal = relationship("Sucursal", back_populates="habitaciones")
    reservas = relationship("Reserva", back_populates="habitacion")

class Reserva(db.Model):
    __tablename__ = 'reserva'

    id_reserva = Column(Integer, primary_key=True, autoincrement=True)
    cliente_id = Column(Integer, ForeignKey('cliente.id_cliente'))
    habitacion_id = Column(Integer, ForeignKey('habitacion.id_habitacion'))
    empleado_id = Column(Integer, ForeignKey('empleado.id_empleado'))
    sucursal_id = Column(Integer, ForeignKey('sucursal.id_sucursal'))
    fecha_reserva = Column(Date)
    checkin = Column(Date)
    checkout = Column(Date)
    estado = Column(String(50))
    metodo_reserva = Column(String(50))

    cliente = relationship("Cliente", back_populates="reservas")
    habitacion = relationship("Habitacion", back_populates="reservas")
    empleado = relationship("Empleado", back_populates="reservas")
    sucursal = relationship("Sucursal", back_populates="reservas")
    pago = relationship("Pago", uselist=False, back_populates="reserva")
    servicios = relationship("Servicio", back_populates="reserva")
    factura = relationship("Factura", uselist=False, back_populates="reserva")
    detalles_huesped = relationship("DetallesHuesped", uselist=False, back_populates="reserva")

class Pago(db.Model):
    __tablename__ = 'pago'

    id_pago = Column(Integer, primary_key=True, autoincrement=True)
    reserva_id = Column(Integer, ForeignKey('reserva.id_reserva'), unique=True)
    monto = Column(DECIMAL(10,2))
    metodo_pago = Column(String(50))
    estado_pago = Column(String(50))
    fecha_pago = Column(DateTime)

    reserva = relationship("Reserva", back_populates="pago")

class Servicio(db.Model):
    __tablename__ = 'servicio'

    id_servicio = Column(Integer, primary_key=True, autoincrement=True)
    reserva_id = Column(Integer, ForeignKey('reserva.id_reserva'))
    descripcion = Column(String(200))
    costo = Column(DECIMAL(10,2))
    facturado = Column(Boolean)

    reserva = relationship("Reserva", back_populates="servicios")

class Factura(db.Model):
    __tablename__ = 'factura'

    id_factura = Column(Integer, primary_key=True, autoincrement=True)
    reserva_id = Column(Integer, ForeignKey('reserva.id_reserva'), unique=True)
    empresa_id = Column(Integer, ForeignKey('empresa.id_empresa'))
    total = Column(DECIMAL(10,2))
    estado = Column(String(50))
    tipo_envio = Column(String(50))
    fecha_emision = Column(DateTime, default=func.now())
    generado_por_empleado = Column(Integer, ForeignKey('empleado.id_empleado'))

    reserva = relationship("Reserva", back_populates="factura")
    empresa = relationship("Empresa", back_populates="facturas")
    detalles = relationship("FacturaDetalle", back_populates="factura")

class FacturaDetalle(db.Model):
    __tablename__ = 'factura_detalle'

    id_detalle = Column(Integer, primary_key=True, autoincrement=True)
    factura_id = Column(Integer, ForeignKey('factura.id_factura'))
    servicio_id = Column(Integer, ForeignKey('servicio.id_servicio'))
    subtotal = Column(DECIMAL(10,2))

    factura = relationship("Factura", back_populates="detalles")

class Reporte(db.Model):
    __tablename__ = 'reporte'

    id_reporte = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(String(50))
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    estado_filtro = Column(String(50))
    generado_por_empleado = Column(Integer, ForeignKey('empleado.id_empleado'))




