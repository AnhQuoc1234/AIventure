# Python Transformers LLM Service

This is a simple FastAPI-based LLM provider that uses the Hugging Face `transformers` library. It provides an OpenAI-compatible API, making it a drop-in replacement for LM Studio for many use cases.

## Features
- OpenAI-compatible `/v1/chat/completions` endpoint.
- Support for streaming responses.
- Easy integration with the AIventure project.

## Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the service:**
   ```bash
   python main.py
   ```
   The service will start on `http://localhost:1234`.

## Configuration

You can change the model by setting the `MODEL_ID` environment variable:
```bash
set MODEL_ID=google/gemma-2-2b-it
python main.py
```

## Integration with AIventure

In `src/app/app.config.ts`, ensure that `LmStudioService` is the active provider:

```typescript
{ provide: MODEL_BACKEND, useClass: LmStudioService }
```

The `LmStudioService` is configured to connect to `http://localhost:1234/v1/chat/completions` by default.
