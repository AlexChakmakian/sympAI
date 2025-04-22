import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:pass1234@localhost/sympai'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.urandom(24)