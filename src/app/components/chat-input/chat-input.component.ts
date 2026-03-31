import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.interface';
import { SOCKET_SERVICE } from '../../services/socket-token';
import { EventBus } from '../../../game/core/EventBus';
import { LogService } from '../../services/log.service';
import { MODEL_BACKEND } from '../../services/model-token';
import { ModelBackend } from '../../services/model-backend.interface';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.css'
})
export class ChatInputComponent implements OnInit, OnDestroy {
  @ViewChild('chatInput') chatInput!: ElementRef;
  isVisible = false;
  isAiMode = false;
  message = '';
  isInputLocked = false;
  visibleInteractions: any[] = [];
  npcOrigin: any = null;
  activeBuildInteraction: any = null;
  collectiblesTracker: Record<string, { count: number; max: number }> = {};

  constructor(
    @Inject(SOCKET_SERVICE) private socketService: SocketService | null,
    @Inject(MODEL_BACKEND) private modelService: ModelBackend,
    private logService: LogService
  ) {}

  ngOnInit() {
    EventBus.on('lock-input', this.handleInputLock, this);
    EventBus.on('visible-interactions', (interactions: any[]) => {
      this.modelService.reset();
      this.visibleInteractions = interactions;
    });
    EventBus.on('ask-model', this.handleBackChannel, this);
    EventBus.on('visible-build-interaction', (interaction: any) => {
      this.modelService.reset();
      this.activeBuildInteraction = interaction;
    });
    EventBus.on('open-chat-input', this.handleOpenChatInput, this);
    EventBus.on('collectibles-tracker', (tracker: any) =>
    {
      this.collectiblesTracker = tracker;
    });
  }

  ngOnDestroy() {
    EventBus.off('lock-input', this.handleInputLock, this);
    EventBus.off('visible-interactions');
    EventBus.off('ask-model', this.handleBackChannel, this);
    EventBus.off('visible-build-interaction');
    EventBus.off('open-chat-input', this.handleOpenChatInput, this);
  }

  handleInputLock(isLocked: boolean) {
    this.isInputLocked = isLocked;
  }

  handleOpenChatInput(data: any) {
    this.isVisible = true;
    this.isAiMode = true;
    EventBus.emit('lock-input', true);
    setTimeout(() => {
        if (this.chatInput) {
            this.npcOrigin = data;
            this.chatInput.nativeElement.focus();
        }
    }, 0);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.isInputLocked && !this.isVisible) {
      return;
    }

    if (event.key === 'Enter') {
      if (this.isVisible) {
        this.sendMessage();
      } else {
        this.isVisible = true;
        this.isAiMode = this.socketService ? event.shiftKey : true;
        EventBus.emit('lock-input', true);
        setTimeout(() => {
          this.chatInput?.nativeElement.focus();
        }, 0);
        event.preventDefault();
      }
    } else if (event.key === 'Escape') {
      if (this.isVisible) {
        this.closeModal();
      }
    }
  }

  async handleBackChannel(context: string, prompt: string) {

    this.logService.addLog(`Sending to Model:\n Context: ${context}\n User: ${prompt}`);
    this.logService.addLog('Model Response:\n');

    let fullAiResponse = '';
    try {
      // only uses context, no tool list yet.
      const stream = this.modelService.generateTextStream("", context, prompt);

      for await (const chunk of stream) {
        fullAiResponse += chunk;
        this.logService.appendLog(chunk);
      }
      this.extractAndEmitCode(fullAiResponse);
      this.logService.addLog('Model Stream Complete.');
      this.modelService.reset();
    } catch (error) {
      this.logService.addLog(`Model Stream Error: ${error}`);
    }
  }

  async sendMessage() {
    if (!this.message.trim()) {
      this.modelService.reset();
      this.closeModal();
      return;
    }

    if (this.activeBuildInteraction && this.isAiMode) {
        EventBus.emit('build-html-request', this.message);
        this.closeModal();
        return;
    }

    if (this.npcOrigin) {
        EventBus.emit('npc-interaction', this.npcOrigin, this.message);
        this.closeModal();
        return;
    }

    if (this.isAiMode) {
      // Request code context
      let codeContext = '';
      const codeHandler = (code: string) => {
        codeContext = code;
      };
      EventBus.on('provide-code-context', codeHandler);
      EventBus.emit('request-code-context');
      EventBus.off('provide-code-context', codeHandler);

      const tools = [...this.visibleInteractions];

      const tool_list = JSON.stringify(tools);
      const context = codeContext ? `Current Code:\n${codeContext}` : "";
      
      this.logService.addLog(`Sending to Model:\n Tool List: ${tool_list}\n Context: ${context}\n User: ${this.message}`);
      this.logService.addLog('Model Response:\n');

      let fullAiResponse = '';
      try {
        const stream = this.modelService.generateTextStream(tool_list, context, this.message);

        for await (const chunk of stream) {
          fullAiResponse += chunk;
          this.logService.appendLog(chunk);
        }
        this.extractAndEmitCode(fullAiResponse);
        this.logService.addLog('Model Stream Complete.');
        this.modelService.reset();
      } catch (error) {
        this.logService.addLog(`Model Stream Error: ${error}`);
      }
    } else {
      this.socketService?.sendMessage(this.message, this.isAiMode);
      EventBus.emit('chat-message', `You: ${this.message}`);
    }

    this.closeModal();
  }

  closeModal() {
    this.isVisible = false;
    this.message = '';
    this.isAiMode = false;
    this.npcOrigin = null;
    EventBus.emit('lock-input', false);
  }

  private extractAndEmitCode(response: string) {
    const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)```/i;
    const match = response.match(codeBlockRegex);
    if (match && match[1]) {
      EventBus.emit('model-code-generated', match[1].trim());
    }
  }
}

