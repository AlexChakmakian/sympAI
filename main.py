from flask import Flask
from database import Config
from users import db
from userreg import routes
from flask_cors import CORS

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)
app.register_blueprint(routes)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return 'Welcome to SympAI!'

if __name__ == '__main__':
    app.run(debug=True)
