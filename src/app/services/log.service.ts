import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private logsSubject = new BehaviorSubject<string[]>([]);
  logs$ = this.logsSubject.asObservable();

  addLog(message: string) {
    const currentLogs = this.logsSubject.value;
    this.logsSubject.next([...currentLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }

  appendLog(message:string) {
    const currentLogs = this.logsSubject.value;

    if (currentLogs.length > 0) {
      currentLogs[currentLogs.length - 1] += message;
      this.logsSubject.next([...currentLogs]);
    } else {
      this.logsSubject.next([message]);
    }
  }

  clearLogs() {
    this.logsSubject.next([]);
  }
}
