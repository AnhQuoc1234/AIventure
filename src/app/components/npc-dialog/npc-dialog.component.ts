/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, OnInit, OnDestroy, HostListener, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventBus } from '../../../game/core/EventBus';
import { MODEL_BACKEND } from '../../services/model-token';
import { ModelBackend } from '../../services/model-backend.interface';
import { CONSTANTS, InteractionType } from '../../../game/core/Constants';
import { AgentState, AgenticNPC } from '../../../game/core/AgenticNPC';

@Component({
  selector: 'app-npc-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './npc-dialog.component.html',
  styleUrls: ['./npc-dialog.component.css']
})
export class NpcDialogComponent implements OnInit, OnDestroy {
  isVisible = false;
  npcName = '';
  npcText = '';
  npcImage = '';
  displayedText = '';
  private typingInterval: any;
  isTyping = false;
  
  private dialogSegments: string[] = [];
  private currentSegmentIndex = 0;
  private unlockTimeout: any;
  private openAiChatOnClose: boolean = false;
  private npcOrigin: any = null;

  currentBuildInteraction: any = null;
  currentVisibleNPCs: any = null;

  private onBuildInteraction = (interaction: any) => {
      this.modelService.reset();
      this.currentBuildInteraction = interaction;
  };

  private onVisibleNPCs = (npcs: any) => {
      this.currentVisibleNPCs = npcs;
  }

  constructor(
    @Inject(MODEL_BACKEND) private modelService: ModelBackend
  ) {}

  ngOnInit() {
    EventBus.on('interaction', this.handleInteraction, this);
    EventBus.on('npc-interaction', this.handleNpcInteraction, this);
    EventBus.on('ask-ai-npc', this.handleBackChannel, this);
    EventBus.on('visible-build-interaction', this.onBuildInteraction);
    EventBus.on('visible-npcs', this.onVisibleNPCs);
  }

  ngOnDestroy() {
    EventBus.off('interaction', this.handleInteraction, this);
    EventBus.off('npc-interaction', this.handleNpcInteraction, this);
    EventBus.off('ask-ai-npc', this.handleBackChannel, this);
    EventBus.off('visible-build-interaction', this.onBuildInteraction);
    EventBus.off('visible-npcs', this.onVisibleNPCs);
    this.stopTyping();
    if (this.unlockTimeout) {
      clearTimeout(this.unlockTimeout);
    }
  }

  async handleNpcInteraction(npc: AgenticNPC, message: string) {
    if (message) {
      this.npcOrigin = npc;
      const npcSkills = this.npcOrigin?.props.skill;
      const parsedSkills = npcSkills ? JSON.parse(npcSkills) : [];
      const tool_list = JSON.stringify([...parsedSkills]);

      if (npc.props.persona) {
        let context = `You are ${npc.props.persona}.
Original script says: "${npc.props.chatResponse}"
Think what will be the next step.`;

        try {
          let fullResponse = "";
          const stream = this.modelService.generateTextStream(tool_list, context, message);
             
          for await (const chunk of stream) {
            fullResponse += chunk;
          }

          this.npcOrigin.setThought(fullResponse, CONSTANTS.THOUGHT_BUBBLE.LONG_DURATION);
          this.npcOrigin.setState(AgentState.EXECUTE);
        } catch (e) {
          console.error("Gemini Error", e);
          this.npcOrigin.setThought(e);
        }
      }
    }
  }

  async handleInteraction(data: any) {
    if (data.type === InteractionType.SLOT || data.type === InteractionType.LINK) return;

    if (this.unlockTimeout) {
      clearTimeout(this.unlockTimeout);
      this.unlockTimeout = null;
    }

    if (data.type === InteractionType.CHAT || data.type === InteractionType.TREASURE || data.type === InteractionType.SWITCH || data.type === InteractionType.AI_NPC) {
      this.isVisible = true;
      this.npcName = data.name;
      this.openAiChatOnClose = (data.type === InteractionType.AI_NPC);
      this.npcOrigin = data.origin;
      
      // Assuming image is the filename provided by Game.ts
      this.npcImage = `assets/gamedata/${data.image}`;
      EventBus.emit('lock-input', true);

      // [START solution_code]

      const npcSkills = data.skill;
      const parsedSkills = (typeof npcSkills === 'string' && npcSkills && npcSkills !== '{}') 
        ? JSON.parse(npcSkills) 
        : (npcSkills && Object.keys(npcSkills).length > 0 ? npcSkills : []);
      const tool_list = JSON.stringify([...parsedSkills]);

      if ((data.type === InteractionType.CHAT || data.type === InteractionType.AI_NPC) && data.persona) {
          this.npcText = "Thinking...";
          this.startTyping();

          let context = `You are ${data.persona}.`;
          if (this.currentBuildInteraction && this.currentBuildInteraction.html) {
          
              context += `The player is interacting with you. 
Nearby Build Interaction HTML: ${this.currentBuildInteraction.html}.
Judge the result and use provided tool if it matches your goal.`;
          } else {
              context += `Original script says: "${data.chatResponse}"
Respond to the player in character. Keep it brief (1-2 sentences).`;
          }

          try {
             let fullResponse = "";
             console.log(tool_list);
             console.log(context);
             const stream = this.modelService.generateTextStream(tool_list, context, "");
             
             for await (const chunk of stream) {
                 fullResponse += chunk;
             }

             if (fullResponse.includes("Function call: ")) {
                this.openAiChatOnClose = false;
             }
             this.dialogSegments = fullResponse.split('\n').filter(s => 
                 s.trim().length > 0 && !s.trim().startsWith("Function call: ")
             );
             this.currentSegmentIndex = 0;
             this.npcText = this.dialogSegments[this.currentSegmentIndex];
             this.startTyping();

          } catch (e) {
              console.error("Gemini Error", e);
              // Fallback to original text
              this.dialogSegments = data.chatResponse.split('<br>');
              this.currentSegmentIndex = 0;
              this.npcText = this.dialogSegments[this.currentSegmentIndex];
              this.startTyping();
          }

      } else if (data.chatResponse) {
          this.dialogSegments = data.chatResponse.split('<br>');
          this.currentSegmentIndex = 0;
          this.npcText = this.dialogSegments[this.currentSegmentIndex];
          this.startTyping();
      }
    }

    // [END solution_code]
  }

  async handleBackChannel(targetNpc: string, context: string, prompt: string) {
    this.npcOrigin = this.currentVisibleNPCs?.find((n: any) => n.name === targetNpc) ?? null;
    if (!this.npcOrigin) return;

    if (this.unlockTimeout) {
      clearTimeout(this.unlockTimeout);
      this.unlockTimeout = null;
    }

    this.isVisible = true;
    this.npcName = targetNpc;
    this.openAiChatOnClose = false;
    this.npcImage = `assets/gamedata/${this.npcOrigin.image}`;
    EventBus.emit('lock-input', true);

    const npcSkills = this.npcOrigin ? this.npcOrigin.skill : '';
    const parsedSkills = npcSkills ? JSON.parse(npcSkills) : [];
    const tool_list = JSON.stringify([...parsedSkills]);

    this.npcText = "Thinking...";
    this.startTyping();

    const presona = this.npcOrigin.persona ? `You are ${this.npcOrigin.persona}.\nCONTEXT: ${context}`: '';

    try {
      let fullResponse = "";
      console.log(tool_list);
      console.log(context);
      const stream = this.modelService.generateTextStream(tool_list, presona, prompt);

      for await (const chunk of stream) {
        fullResponse += chunk;
      }
      console.log(fullResponse);

      if (fullResponse.includes("Function call: ")) {
        this.openAiChatOnClose = false;
      }
      this.dialogSegments = fullResponse.split('\n').filter(s => 
        s.trim().length > 0 && !s.trim().startsWith("Function call: ")
      );
      this.currentSegmentIndex = 0;
      this.npcText = this.dialogSegments[this.currentSegmentIndex];
      if (this.npcText) {
        this.startTyping();
      }
    } catch (e) {
      console.error("Gemini Error", e);
      // Fallback to original text
      this.dialogSegments = this.npcOrigin.chatResponse.split('<br>');
      this.currentSegmentIndex = 0;
      this.npcText = this.dialogSegments[this.currentSegmentIndex];
      if (this.npcText) {
        this.startTyping();
      }
    }
  }

  startTyping() {
    this.displayedText = '';
    this.isTyping = true;
    let currentIndex = 0;
    this.stopTyping(); // Clear any existing interval

    this.typingInterval = setInterval(() => {
      if (currentIndex < this.npcText.length) {
        this.displayedText += this.npcText[currentIndex];
        currentIndex++;
      } else {
        this.stopTyping();
        this.isTyping = false;
      }
    }, 30); // Adjust speed here (30ms per char)
  }

  stopTyping() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
  }

  closeDialog() {
    this.isVisible = false;
    if (this.unlockTimeout) {
      clearTimeout(this.unlockTimeout);
    }
    this.unlockTimeout = setTimeout(() => {
      EventBus.emit('lock-input', false);
      this.unlockTimeout = null;

      if (this.openAiChatOnClose) {
        if (this.npcOrigin instanceof AgenticNPC) {
          this.npcOrigin.setThought("...", CONSTANTS.THOUGHT_BUBBLE.SHORT_DURATION);
          this.npcOrigin.setState(AgentState.THINKING);
        }
        this.openAiChatOnClose = false;
        EventBus.emit('open-chat-input', this.npcOrigin);
      }
    }, 200);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isVisible) return;
    if (this.npcText === 'Thinking...') return;

    if (event.key === 'Escape') {
      this.closeDialog();
      return;
    }

    if (this.isTyping) {
      // Skip animation
      this.stopTyping();
      this.displayedText = this.npcText;
      this.isTyping = false;
    } else {
      if (this.currentSegmentIndex < this.dialogSegments.length - 1) {
        this.currentSegmentIndex++;
        this.npcText = this.dialogSegments[this.currentSegmentIndex];
        this.startTyping();
      } else {
        // Close dialog
        this.closeDialog();
      }
    }
  }
}
