from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str
    model_name: str = "claude-sonnet-4-6"
    max_tokens: int = 2048
    streaming_max_tokens: int = 4096

    arize_space_key: str = ""
    arize_api_key: str = ""

    redis_url: str = ""
    redis_index_prefix: str = "jugaad"
    redis_vector_dim: int = 384
    redis_semantic_cache_threshold: float = 0.12

    browserbase_api_key: str = ""
    browserbase_project_id: str = ""
    browserbase_region: str = "us-west-2"


settings = Settings()
