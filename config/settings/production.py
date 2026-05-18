import dj_database_url
from decouple import Csv, config

from .base import *

DEBUG = False

SECRET_KEY = config('SECRET_KEY')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL'))
}

CORS_ALLOWED_ORIGINS = [config('FRONTEND_URL')]
