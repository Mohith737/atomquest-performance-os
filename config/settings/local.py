import dj_database_url
from decouple import config

from .base import *

DEBUG = True

DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL'))
}

CORS_ALLOW_ALL_ORIGINS = True
