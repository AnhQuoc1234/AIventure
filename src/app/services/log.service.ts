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
