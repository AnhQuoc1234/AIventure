import { InjectionToken } from '@angular/core';
import { SocketService } from './socket.interface';

export const SOCKET_SERVICE = new InjectionToken<SocketService | null>('SOCKET_SERVICE', {
    providedIn: 'root',
    factory: () => null
});
