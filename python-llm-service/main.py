import os
import time
import json, re
import uuid
from typing import List, Optional, Union, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import torch
from transformers import AutoModelForImageTextToText, AutoProcessor, TextIteratorStreamer
from threading import Thread

app = FastAPI(title="LM Studio compatible Transformers Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_MODEL_ID = "gg-hf-gg/gemma-4-E4B-it"

# Model configuration
MODEL_ID = os.environ.get("MODEL_ID", DEFAULT_MODEL_ID)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading model: {MODEL_ID} on {DEVICE}...")
processor = AutoProcessor.from_pretrained(MODEL_ID)
model = AutoModelForImageTextToText.from_pretrained(
    MODEL_ID,
    dtype="auto",
).to(DEVICE)
print("Model loaded.")

class Message(BaseModel):
    role: str
    content: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_responses: Optional[List[Dict[str, Any]]] = None

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[Message]
    stream: Optional[bool] = False
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048
    tools: Optional[List[Dict[str, Any]]] = None

def format_chat_prompt(request: ChatCompletionRequest) -> str:
    print(request.messages)
    try:
        messages = []
        is_tool_response = False
        for m in request.messages:
            msg_dict = {"role": m.role, "content": m.content}
            if m.tool_calls:
                msg_dict["tool_calls"] = m.tool_calls
            if m.tool_responses:
                is_tool_response = True
                msg_dict["tool_responses"] = m.tool_responses
            messages.append(msg_dict)
        
        print(messages)

        text = processor.apply_chat_template(
            messages,
            tools=request.tools if request.tools else None,
            tokenize=False,
            add_generation_prompt=False if is_tool_response else True
        )
        return text
    except Exception as e:
        print(f"Chat template failed: {e}")
        return ""

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    text = format_chat_prompt(request)
    print(text)
    inputs = processor(text=text, return_tensors="pt").to(DEVICE)
    
    if request.stream:
        return StreamingResponse(
            stream_generate(inputs, request.model, request.temperature, request.max_tokens),
            media_type="text/event-stream"
        )
    else:
        # For non-streaming, we still use the model.generate
        # Note: some multimodal models might require different generate args
        outputs = model.generate(
            **inputs,
            max_new_tokens=request.max_tokens,
            temperature=request.temperature,
            do_sample=True if request.temperature > 0 else False
        )
        response_text = processor.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=False)
        
        return {
            "id": f"chatcmpl-{uuid.uuid4()}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": request.model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": inputs['input_ids'].shape[1],
                "completion_tokens": outputs.shape[1] - inputs['input_ids'].shape[1],
                "total_tokens": outputs.shape[1]
            }
        }

def stream_generate(inputs, model_name, temperature, max_tokens):
    streamer = TextIteratorStreamer(processor, skip_prompt=True, skip_special_tokens=False)
    generation_kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=max_tokens,
        temperature=temperature,
        do_sample=True if temperature > 0 else False
    )
    
    thread = Thread(target=model.generate, kwargs=generation_kwargs)
    thread.start()
    
    completion_id = f"chatcmpl-{uuid.uuid4()}"
    created_time = int(time.time())

    buffer = ""
    has_tool_call = False
    
    for new_text in streamer:
        buffer += new_text

        if "<|tool_call>" in buffer and "<tool_call|>" in buffer:
            prefix, rest = buffer.split("<|tool_call>", 1)
            if prefix:
                content_chunk = {
                    "id": completion_id,
                    "object": "chat.completion.chunk",
                    "created": created_time,
                    "model": model_name,
                    "choices": [{
                        "index": 0,
                        "delta": {"content": prefix},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(content_chunk)}\n\n"

            pattern = r"call:([a-zA-Z0-9_-]+)(\{.*?\})<tool_call\|>"
            match = re.search(pattern, rest, re.DOTALL)

            if match:
                func_name = match.group(1)
                raw_args = match.group(2)

                # Convert custom tokens <|"|> to standard double quotes "
                json_args = raw_args.replace('<|"|>', '"')

                chunk = {
                    "id": completion_id,
                    "object": "chat.completion.chunk",
                    "created": created_time,
                    "model": model_name,
                    "choices": [{
                        "index": 0,
                        "delta": {
                            "tool_calls": [{
                                "index": 0,
                                "id": f"call_{completion_id}", # Tool calls typically require an ID
                                "type": "function",
                                "function": {
                                    "name": func_name,
                                    "arguments": json_args
                                }
                            }]
                        },
                        "finish_reason": "tool_calls" 
                    }]
                }
                yield f"data: {json.dumps(chunk)}\n\n"
                has_tool_call = True
                break
            
            buffer = rest.split("<tool_call|>")[-1]
            continue

        if "<|tool_call>" in buffer:
            continue

        is_partial_tag = any(
            "<|tool_call>".startswith(buffer[i:]) 
            for i in range(max(0, len(buffer) - 12), len(buffer))
        )
        if is_partial_tag:
            continue
        
        buffer = buffer.removesuffix("<turn|>")
        if buffer:
            chunk = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created_time,
                "model": model_name,
                "choices": [{
                    "index": 0,
                    "delta": {"content": buffer},
                    "finish_reason": None
                }]
            }
            yield f"data: {json.dumps(chunk)}\n\n"
            buffer = ""
        
    if not has_tool_call:
        final_chunk = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created_time,
            "model": model_name,
            "choices": [{
                "index": 0,
                "delta": {},
                "finish_reason": "stop"
            }]
        }
        yield f"data: {json.dumps(final_chunk)}\n\n"
    yield "data: [DONE]\n\n"

@app.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [{
            "id": MODEL_ID,
            "object": "model",
            "created": int(time.time()),
            "owned_by": "transformers"
        }]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=1234)
