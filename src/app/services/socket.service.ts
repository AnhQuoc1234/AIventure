import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { SocketService } from './socket.interface';

@Injectable()
export class SocketIoService implements SocketService {
  private socket: Socket;
  private url = 'http://localhost:3000'; // Default URL, can be configured

  constructor() {
    this.socket = io(this.url, {
      autoConnect: false
    });
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  sendMessage(message: string, isAi: boolean = false) {
    this.socket.emit('chat-message', { message, isAi });
  }

  getMessages(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('chat-message', (data) => {
        observer.next(data);
      });
      
      // Also listen for other relevant events if needed
      return () => {
        this.socket.off('chat-message');
      };
    });
  }
}
