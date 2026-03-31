import { Observable } from 'rxjs';

export interface SocketService {
  connect(): void;
  disconnect(): void;
  sendMessage(message: string, isAi?: boolean): void;
  getMessages(): Observable<any>;
}
