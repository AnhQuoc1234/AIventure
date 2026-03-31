export interface ModelBackend {
  reset(): void;
  generateTextStream(tool_list: string, context: string, prompt: string): AsyncGenerator<string>;
  generateHtmlStream(prompt: string, previousHtml: string): AsyncGenerator<string>;
}
