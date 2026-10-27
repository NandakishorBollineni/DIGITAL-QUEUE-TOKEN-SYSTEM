from app import create_app
from app.config import Config

app = create_app(Config)

if __name__ == "__main__":
    print(f"Starting Digital Queue Token System API on port {Config.PORT}...")
    print(f"MongoDB URI: {Config.MONGODB_URI}")
    print(f"MongoDB Compass Connection Link: {Config.MONGODB_URI}{Config.DATABASE_NAME}")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
