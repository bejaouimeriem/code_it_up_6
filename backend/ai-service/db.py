import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "sandy_lab"),
    "user": os.getenv("DB_USER", "sandy"),
    "password": os.getenv("DB_PASSWORD", "sandy123"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5433"),
    "connect_timeout": 5,
}



def get_connection():
    return psycopg2.connect(**DB_CONFIG)