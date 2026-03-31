import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugComponent } from './debug.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('DebugComponent', () => {
  let component: DebugComponent;
  let fixture: ComponentFixture<DebugComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebugComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DebugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});