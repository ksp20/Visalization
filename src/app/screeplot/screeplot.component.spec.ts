import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreeplotComponent } from './screeplot.component';

describe('ScreeplotComponent', () => {
  let component: ScreeplotComponent;
  let fixture: ComponentFixture<ScreeplotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScreeplotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScreeplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
