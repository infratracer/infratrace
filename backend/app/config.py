from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    DATABASE_URL_SYNC: str = ""

    # Auth
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Blockchain
    POLYGON_RPC_URL: str = "https://rpc-amoy.polygon.technology"
    POLYGON_PRIVATE_KEY: str = ""
    CONTRACT_ADDRESS: str = ""
    POLYGON_CHAIN_ID: int = 80002

    # AI
    HF_API_TOKEN: str = ""
    HF_MODEL_ID: str = ""
    OPENROUTER_API_KEY: str = ""

    # App
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    # Seed
    SEED_ADMIN_PASSWORD: str = "admin123"
    SEED_DEMO_PASSWORD: str = "demo123"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
