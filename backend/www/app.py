from flask import Flask
from flask_cors import CORS
from base import db
from views import views

app = Flask(__name__)

CORS(app) 

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:SuperSecretPassword123@db:3306/Biblioteca'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your_secret_key'

db.init_app(app)

app.register_blueprint(views, url_prefix='/')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)