from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central typed config — reads from .env (or whatever ``ENV_FILE`` you point at).

    The ``extra="ignore"`` line means we tolerate unrelated keys (Fetch.ai seeds,
    Band, ASI:One) sitting in the same env file without exploding.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str
    model_name: str = "claude-sonnet-4-6"
    max_tokens: int = 2048
    streaming_max_tokens: int = 4096

    arize_space_key: str = ""
    arize_api_key: str = ""

    deepgram_api_key: str = ""
    deepgram_tts_model: str = "aura-2-thalia-en"
    resend_api_key: str = ""

    # ---- Redis core (vector store over the hack knowledge graph) ----
    redis_url: str = ""
    redis_index_prefix: str = "jugaad"
    redis_vector_dim: int = 384
    redis_semantic_cache_threshold: float = 0.12

    # ---- Redis LangCache (managed semantic cache) ----
    redis_langcache_url: str = ""
    redis_langcache_id: str = ""
    redis_langcache_api_key: str = ""

    # ---- Redis Agent Memory Server (managed dual-tier memory) ----
    redis_agent_mem_url: str = ""
    redis_agent_mem_api_key: str = ""
    redis_agent_mem_store_id: str = ""

    # ---- Browserbase (Fetch + Search + Sessions) ----
    browserbase_api_key: str = ""
    browserbase_project_id: str = ""
    browserbase_region: str = "us-west-2"


settings = Settings()
