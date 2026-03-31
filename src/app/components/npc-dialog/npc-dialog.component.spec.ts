import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NpcDialogComponent } from './npc-dialog.component';

describe('NpcDialogComponent', () => {
  let component: NpcDialogComponent;
  let fixture: ComponentFixture<NpcDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NpcDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NpcDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
