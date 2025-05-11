from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from users import db, User
from chat import Chat

routes = Blueprint('routes', __name__)

@routes.route('/register', methods=['POST'])
def register():
    data = request.get_json()
   # username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    password = generate_password_hash(data.get('password'))

    if not email or not password: 
        return jsonify({'error': 'All fields are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists. Try logging in.'}), 409

    new_user = User(email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': f'Welcome {email}! You successfully registered!!'}), 201

@routes.route('/login', methods= ['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email = email).first()

    if not user:
        return jsonify({'error': 'No account found with that email. Please input a valid email or register first.'}), 404
    
    if not check_password_hash(user.password, password):
        return jsonify({'error': 'Incorrect password. Please try again.'}), 401
    
    username = user.email.split('@')[0]
    return jsonify({
        'message': f'Welcome back, {username}!',
        'user': {
            'id': user.id,
            #'username': user.username,
            'email': user.email
        }
    }), 200

@routes.route('/chat-history', methods=['POST'])
def save_chat():
    data = request.get_json()
    user_id = data.get('user_id')
    message = data.get('message')
    response = data.get('response')

    if not all([user_id, message, response]):
        return jsonify({'error': 'Missing data'}), 400

    try:
        new_chat = Chat(user_id=user_id, message=message, response=response)
        db.session.add(new_chat)
        db.session.commit()
        return jsonify({'message': 'Chat saved successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@routes.route('/chat-history/<int:user_id>', methods=['GET'])
def get_chat_history(user_id):
    try:
        chats = Chat.query.filter_by(user_id=user_id).order_by(Chat.timestamp).all()

        chat_list = [
            {
                'message': chat.message,
                'response': chat.response,
                'timestamp': chat.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            }
            for chat in chats
        ]

        return jsonify({'chat_history': chat_list}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
