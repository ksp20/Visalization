import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VizprojComponent } from './vizproj.component';

describe('VizprojComponent', () => {
  let component: VizprojComponent;
  let fixture: ComponentFixture<VizprojComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VizprojComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VizprojComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
