import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmatrixComponent } from './smatrix.component';

describe('SmatrixComponent', () => {
  let component: SmatrixComponent;
  let fixture: ComponentFixture<SmatrixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmatrixComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SmatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
