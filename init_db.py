
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to MySQL Server (no DB selected yet)
conn = pymysql.connect(
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", 3306)),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASS", ""),
    autocommit=True
)

cursor = conn.cursor()

# Read schema.sql
with open("schema.sql", "r") as f:
    schema = f.read()

# Execute statements
statements = schema.split(";")
for statement in statements:
    if statement.strip():
        try:
            cursor.execute(statement)
            print(f"Executed: {statement[:50]}...")
        except Exception as e:
            print(f"Error executing statement: {e}")

print("Database initialized successfully.")
cursor.close()
conn.close()
