import { Injectable } from '@angular/core';
import { ModelBackend } from './model-backend.interface';

// Imports the Google Cloud Prediction Service Client library
import { PredictionServiceClient, helpers } from '@google-cloud/aiplatform';

/**
 * TODO(developer): Update these variables before running the sample.
 * Consider moving these to environments/environment.ts
 */
const PROJECT_ID = 'your-project-id';
const ENDPOINT_REGION = 'your-vertex-endpoint-region';
const ENDPOINT_ID = 'your-vertex-endpoint-id';

@Injectable({
  providedIn: 'root'
})
export class VertexAiService implements ModelBackend {
  private predictionServiceClient: any;
  private gemmaEndpoint: string;

  constructor() {
    const apiEndpoint = `${ENDPOINT_REGION}-aiplatform.googleapis.com`;
    // Create a client
    this.predictionServiceClient = new PredictionServiceClient({apiEndpoint});
    this.gemmaEndpoint = `projects/${PROJECT_ID}/locations/${ENDPOINT_REGION}/endpoints/${ENDPOINT_ID}`;
  }

  public reset(): void {
    // Implement any necessary reset logic here if maintaining conversation history
  }

  async *generateTextStream(tool_list: string, context: string, prompt: string): AsyncGenerator<string> {
    try {
      // Create the final input prompt considering context
      const fullPrompt = context ? `Context: ${context}\nUser: ${prompt}` : prompt;

      // Encapsulate the prompt in a correct format for TPUs
      const input = {
        prompt: fullPrompt,
        // Parameters for default configuration
        maxOutputTokens: 1024,
        temperature: 0.9,
        topP: 1.0,
        topK: 1,
      };

      // Convert input message to a list of GAPIC instances for model input
      const instances = [helpers.toValue(input)];

      // Call the Gemma endpoint
      const [response] = await this.predictionServiceClient.predict({
        endpoint: this.gemmaEndpoint,
        instances,
      });

      const predictions = response.predictions;
      
      if (predictions && predictions.length > 0) {
        // Vertex AI predict() is generally non-streaming by default for custom endpoints,
        // but since our interface requires an AsyncGenerator, we'll yield the result.
        const text = predictions[0].stringValue;
        yield text;
      }
    } catch (error) {
      console.error('Error querying Vertex AI:', error);
      yield "Sorry, there was an error generating a response from Vertex AI.";
    }
  }

  async *generateHtmlStream(prompt: string, previousHtml: string = ""): AsyncGenerator<string> {
    yield `
    <html>
      <head>
          <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
              .box { padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              h1 { color: #333; }
          </style>
      </head>
      <body>
          <div class="box">
              <h1>Vertex AI HTML Generation</h1>
              <p>This method has not yet been fully implemented for the Vertex AI endpoint.</p>
          </div>
      </body>
    </html>
    `;
  }
}
