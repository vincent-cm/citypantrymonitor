import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomepageComponent } from './homepage.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

describe('HomepageComponent', () => {
  let component: HomepageComponent;
  let fixture: ComponentFixture<HomepageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [HomepageComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomepageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain a title', () => {
    const title = fixture.debugElement.query(By.css('h1'));

    expect(title).toBeTruthy();
    expect(title.nativeElement.innerText).toContain('City Pantry');
  });

  it('should have a link', () => {
    const links = fixture.debugElement.query(By.css('a'));

    expect(links).toBeTruthy();
  });

  it('should have a link to the order list page', () => {
    const links = fixture.debugElement.queryAll(By.css('a'));

    expect(links[0].nativeElement.href).toMatch(/\/orders$/);
  });
});
