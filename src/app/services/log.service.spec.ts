import { TestBed } from '@angular/core/testing';
import { LogService } from './log.service';

describe('LogService', () => {
  let service: LogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a log message', (done) => {
    const testMessage = 'Test log message';
    service.addLog(testMessage);

    service.logs$.subscribe(logs => {
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain(testMessage);
      done();
    });
  });

  it('should append to the last log message', (done) => {
    service.addLog('Initial');
    service.appendLog(' appended');

    service.logs$.subscribe(logs => {
      expect(logs.length).toBe(1);
      expect(logs[0]).toContain('Initial appended');
      done();
    });
  });

  it('should create a new log if appending to empty logs', (done) => {
    service.appendLog('New log');

    service.logs$.subscribe(logs => {
      expect(logs.length).toBe(1);
      expect(logs[0]).toBe('New log');
      done();
    });
  });

  it('should clear logs', (done) => {
    service.addLog('Log 1');
    service.addLog('Log 2');
    service.clearLogs();

    service.logs$.subscribe(logs => {
      expect(logs.length).toBe(0);
      done();
    });
  });
});
