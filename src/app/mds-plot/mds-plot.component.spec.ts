import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MdsPlotComponent } from './mds-plot.component';

describe('MdsPlotComponent', () => {
  let component: MdsPlotComponent;
  let fixture: ComponentFixture<MdsPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdsPlotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MdsPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
