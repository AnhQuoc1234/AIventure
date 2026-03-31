import { SimpleEventEmitter } from './utils/SimpleEventEmitter';

// Used to emit events between components, HTML and Phaser scenes
// Replaced Phaser.Events.EventEmitter with SimpleEventEmitter to decouple logic
export const EventBus = new SimpleEventEmitter();