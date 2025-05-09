from users import db
from datetime import datetime

class Chat(db.Model):
    __tablename__ = 'chathistory'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    

    user = db.relationship('User', backref=db.backref('chats', lazy=True))
