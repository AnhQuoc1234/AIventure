type Listener = (...args: any[]) => void;

interface ListenerRecord {
    fn: Listener;
    context?: any;
}

export class SimpleEventEmitter {
    private listeners: { [key: string]: ListenerRecord[] } = {};

    on(event: string, listener: Listener, context?: any) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push({ fn: listener, context: context });
    }

    off(event: string, listener?: Listener, context?: any) {
        if (!this.listeners[event]) return;
        
        if (!listener) {
            // Remove all listeners for this event if no specific listener provided
            delete this.listeners[event];
            return;
        }

        this.listeners[event] = this.listeners[event].filter(l => {
            if (l.fn !== listener) return true;
            if (context && l.context !== context) return true;
            return false;
        });
    }

    emit(event: string, ...args: any[]) {
        if (!this.listeners[event]) return;
        
        // Copy to avoid issues if listeners remove themselves during execution
        const listeners = [...this.listeners[event]];
        
        listeners.forEach(l => {
            if (l.context) {
                l.fn.apply(l.context, args);
            } else {
                l.fn(...args);
            }
        });
    }
}