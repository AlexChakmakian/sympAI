from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from users import db, User

routes = Blueprint('routes', __name__)

@routes.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    # password = generate_password_hash(data.get('password'))

    if not username or not email or not password: 
        return jsonify({'error': 'All fields are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists. Try logging in.'}), 409

    new_user = User(username=username, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': f'Welcome {username}! You successfully registered!!'}), 201