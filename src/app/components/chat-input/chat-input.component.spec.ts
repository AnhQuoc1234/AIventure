import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChatInputComponent } from './chat-input.component';
import { SocketService } from '../../services/socket.interface';
import { SOCKET_SERVICE } from '../../services/socket-token';
import { MODEL_BACKEND } from '../../services/model-token';
import { ModelBackend } from '../../services/model-backend.interface';
import { LogService } from '../../services/log.service';
import { EventBus } from '../../../game/core/EventBus';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

describe('ChatInputComponent', () => {
  let component: ChatInputComponent;
  let fixture: ComponentFixture<ChatInputComponent>;
  let mockSocketService: jasmine.SpyObj<SocketService>;
  let mockModelService: jasmine.SpyObj<ModelBackend>;
  let mockLogService: jasmine.SpyObj<LogService>;

  beforeEach(async () => {
    mockSocketService = jasmine.createSpyObj('SocketService', ['sendMessage', 'connect', 'disconnect', 'getMessages']);
    mockModelService = jasmine.createSpyObj('ModelBackend', ['generateTextStream', 'reset']);
    mockLogService = jasmine.createSpyObj('LogService', ['addLog', 'appendLog']);

    await TestBed.configureTestingModule({
      imports: [ChatInputComponent, FormsModule],
      providers: [
        { provide: SOCKET_SERVICE, useValue: mockSocketService },
        { provide: MODEL_BACKEND, useValue: mockModelService },
        { provide: LogService, useValue: mockLogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to lock-input event on init', () => {
    spyOn(EventBus, 'on');
    component.ngOnInit();
    expect(EventBus.on).toHaveBeenCalledWith('lock-input', component.handleInputLock, component);
  });

  it('should unsubscribe from lock-input event on destroy', () => {
    spyOn(EventBus, 'off');
    component.ngOnDestroy();
    expect(EventBus.off).toHaveBeenCalledWith('lock-input', component.handleInputLock, component);
  });

  it('should update isInputLocked when handleInputLock is called', () => {
    component.handleInputLock(true);
    expect(component.isInputLocked).toBeTrue();
    component.handleInputLock(false);
    expect(component.isInputLocked).toBeFalse();
  });

  it('should open chat on Enter key if not visible', fakeAsync(() => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');
    component.isVisible = false;
    
    component.handleKeyDown(event);
    
    expect(component.isVisible).toBeTrue();
    expect(event.preventDefault).toHaveBeenCalled();
    tick(); // for setTimeout
  }));

  it('should send message on Enter key if visible', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.isVisible = true;
    component.message = 'Hello';
    spyOn(component, 'sendMessage');

    component.handleKeyDown(event);

    expect(component.sendMessage).toHaveBeenCalled();
  });

  it('should close modal on Escape key if visible', () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.isVisible = true;
    spyOn(component, 'closeModal');

    component.handleKeyDown(event);

    expect(component.closeModal).toHaveBeenCalled();
  });

  it('should send message via socket in normal mode', () => {
    component.message = 'Hello World';
    component.isAiMode = false;
    spyOn(EventBus, 'emit');

    component.sendMessage();

    expect(mockSocketService.sendMessage).toHaveBeenCalledWith('Hello World', false);
    expect(EventBus.emit).toHaveBeenCalledWith('chat-message', 'You: Hello World');
    expect(component.isVisible).toBeFalse();
    expect(component.message).toBe('');
  });

  it('should send message via Model service in AI mode', fakeAsync(async () => {
    component.message = 'Hello AI';
    component.isAiMode = true;
    
    // Mock async generator
    async function* mockGenerator() {
      yield 'Response';
    }
    mockModelService.generateTextStream.and.returnValue(mockGenerator());

    await component.sendMessage();

    expect(mockLogService.addLog).toHaveBeenCalledWith('Sending to Model:\n Tool List: []\n Context: \n User: Hello AI');
    expect(mockLogService.addLog).toHaveBeenCalledWith('Model Response:\n');
    expect(mockModelService.generateTextStream).toHaveBeenCalledWith('[]', '', 'Hello AI');
    // Since sendMessage is async and we await it, the loop should have finished
    expect(mockLogService.appendLog).toHaveBeenCalledWith('Response');
    expect(mockLogService.addLog).toHaveBeenCalledWith('Model Stream Complete.');
    expect(mockModelService.reset).toHaveBeenCalled();
    expect(component.isVisible).toBeFalse();
  }));

  it('should not send empty message', () => {
    component.message = '   ';
    component.sendMessage();
    
    expect(mockSocketService.sendMessage).not.toHaveBeenCalled();
    expect(component.isVisible).toBeFalse();
  });
});
