from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class Admin(db.Model):
    __tablename__ = 'Admin'

    id_admin = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario = db.Column(db.String(100), nullable=False, unique=True)
    contrasena = db.Column(db.String(255), nullable=False)





