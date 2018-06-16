import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinKitComponent } from './spin-kit.component';

describe('SpinKitComponent', () => {
  let component: SpinKitComponent;
  let fixture: ComponentFixture<SpinKitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpinKitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpinKitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
