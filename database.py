import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://"user":"password"@localhost/sympai'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.urandom(24)