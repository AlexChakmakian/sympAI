from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
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

@routes.route('/login', methods= ['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email = email).first()

    if not user:
        return jsonify({'error': 'No account found with that email. Please input a valid email or register first.'}), 404
    
    if not check_password_hash(user.password, password):
        return jsonify({'error': 'Incorrect password. Please try again.'})
    
    return jsonify({
        'message': f'Welcome back, {user.username}!',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }), 200