import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventBus } from '../../../game/core/EventBus';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.css'
})
export class ChatPanelComponent {
  @Input() messages: string[] = [];

  addMessage(message: string) {
    this.messages.push(message);
  }

  @Input() collectiblesTracker: Record<string, { count: number; max: number }> = {};

  ngOnInit()
  {
    EventBus.on('collectibles-tracker', (tracker: any) =>
    {
      this.collectiblesTracker = tracker;
      console.log('coll', this.collectiblesTracker)
    });
  }
}
