import { Injectable, OnDestroy } from '@angular/core';
import { ModelBackend } from './model-backend.interface';
import { pipeline, TextStreamer } from '@huggingface/transformers';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransformersService implements ModelBackend, OnDestroy {
  private generator: any;
  private tokenizer: any;
  private history: any[] = [];
  private modelName = 'onnx-community/gemma-3-270m-it-ONNX';
  //private modelName = 'onnx-community/gemma-3-1b-it-ONNX-GQA';
  private initializationPromise: Promise<void> | null = null;

  public loadingProgress$ = new BehaviorSubject<number>(0);
  public loadingStatus$ = new BehaviorSubject<string>('Initializing...');
  public isReady$ = new BehaviorSubject<boolean>(false);

  constructor() {
  }

  ngOnDestroy() {
    this.history = [];
  }

  public reset() {
    this.history = [];
  }

  public async init() {
    await this.ensureInitialized();
  }

  private handleProgress(args: any) {
    if (args.status === 'progress') {
      this.loadingProgress$.next(args.progress);
      this.loadingStatus$.next(`Downloading ${args.file}...`);
    } else if (args.status === 'done') {
      this.loadingStatus$.next(`Finished ${args.file}`);
    } else if (args.status === 'ready') {
      this.loadingStatus$.next('Model ready');
      this.isReady$.next(true);
    }
  }

  private ensureInitialized() {
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      console.log('Initializing transformers.js pipeline...');
      try {
        // Use a chat-tuned model
        this.generator = await pipeline('text-generation', this.modelName, {
          device: 'webgpu',
          dtype: 'q4',
          progress_callback: (x: any) => this.handleProgress(x)
        });
        this.tokenizer = this.generator.tokenizer;
        console.log('transformers.js pipeline initialized.');
        this.isReady$.next(true);
      } catch (error) {
        console.error('Failed to initialize transformers.js:', error);
        this.loadingStatus$.next('Failed to load model');
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async *generateTextStream(tool_list: string, context: string, prompt: string): AsyncGenerator<string> {
    await this.ensureInitialized();

    // Construct messages for chat template
    const messages = [];
    if (context) {
        messages.push({ role: 'system', content: `Context: ${context}` });
    }
    messages.push(...this.history);
    messages.push({ role: 'user', content: prompt });

    // Update history immediately with user prompt
    this.history.push({ role: 'user', content: prompt });

    // Queue for streaming
    const queue: string[] = [];
    let signal: () => void;
    let promise = new Promise<void>(r => signal = r);
    let isDone = false;
    let error: any = null;

    const pushToQueue = (text: string) => {
      queue.push(text);
      signal();
      // Do not reset promise here; we reset it after consuming
    };

    const streamer = new TextStreamer(this.tokenizer, {
      skip_prompt: true,
      callback_function: (text: string) => {
        pushToQueue(text);
      }
    });

    // Start generation
    let fullResponse = "";

    this.generator(messages, {
      max_new_tokens: 512,
      do_sample: true,
      streamer: streamer,
      return_full_text: false
    }).then((output: any) => {
      isDone = true;
      // Extract full text from output if available, for history
      if (Array.isArray(output) && output.length > 0) {
          fullResponse = output[0].generated_text;
          // Sometimes generated_text includes the prompt if return_full_text is true,
          // but we set it to false. However, for chat templates, behavior varies.
          // Usually output[0].generated_text is the full conversation or just the new part.
          // With return_full_text: false, it should be just the new part.
          if (typeof fullResponse === 'object') {
             // Sometimes it returns message object
             fullResponse = (fullResponse as any).content || "";
          }
      }
      this.history.push({ role: 'assistant', content: fullResponse });
      signal();
    }).catch((err: any) => {
      error = err;
      isDone = true;
      signal();
    });

    while (true) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else if (isDone) {
        break;
      } else if (error) {
        throw error;
      } else {
        await promise;
        promise = new Promise<void>(r => signal = r);
      }
    }
  }

  async *generateHtmlStream(prompt: string, previousHtml: string = ""): AsyncGenerator<string> {
    await this.ensureInitialized();

    const systemInstruction = `You are an expert web developer. Create a single HTML file containing CSS and JS based on the following request. Return ONLY the raw HTML code.`;

    let fullPrompt = "";
    if (previousHtml) {
        fullPrompt = `Update the following HTML based on the user's request.\n\nExisting HTML:\n${previousHtml}\n\nRequest: ${prompt}`;
    } else {
        fullPrompt = `Request: ${prompt}`;
    }

    const messages = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: fullPrompt }
    ];

    const queue: string[] = [];
    let signal: () => void;
    let promise = new Promise<void>(r => signal = r);
    let isDone = false;
    let error: any = null;

    const pushToQueue = (text: string) => {
      queue.push(text);
      signal();
    };

    const streamer = new TextStreamer(this.tokenizer, {
      skip_prompt: true,
      callback_function: (text: string) => {
        pushToQueue(text);
      }
    });

    this.generator(messages, {
      max_new_tokens: 1024,
      do_sample: false,
      streamer: streamer,
      return_full_text: false
    }).then(() => {
      isDone = true;
      signal();
    }).catch((err: any) => {
      error = err;
      isDone = true;
      signal();
    });

    while (true) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else if (isDone) {
        break;
      } else if (error) {
        throw error;
      } else {
        await promise;
        promise = new Promise<void>(r => signal = r);
      }
    }
  }
}
