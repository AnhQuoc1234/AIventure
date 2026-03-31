import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RightPanelComponent } from './right-panel.component';
import { LogService } from '../../services/log.service';
import { MODEL_BACKEND } from '../../services/model-token';
import { ModelBackend } from '../../services/model-backend.interface';

describe('RightPanelComponent', () => {
  let component: RightPanelComponent;
  let fixture: ComponentFixture<RightPanelComponent>;
  let mockLogService: jasmine.SpyObj<LogService>;
  let mockModelService: jasmine.SpyObj<ModelBackend>;

  beforeEach(async () => {
    mockLogService = jasmine.createSpyObj('LogService', ['addLog', 'appendLog']);
    mockLogService.logs$ = jasmine.createSpyObj('logs$', ['subscribe']); // Handle the observable
    // Fix observable mock more properly if needed, but for now strict: false or simple mock
    (mockLogService as any).logs$ = { subscribe: () => {} };

    mockModelService = jasmine.createSpyObj('ModelBackend', ['generateHtmlStream']);
    mockModelService.generateHtmlStream.and.callFake(async function* () {
      yield '<html></html>';
    });

    await TestBed.configureTestingModule({
      imports: [RightPanelComponent],
      providers: [
        { provide: LogService, useValue: mockLogService },
        { provide: MODEL_BACKEND, useValue: mockModelService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RightPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
