import { Component } from '@angular/core';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent {
  public openGitHub() {
    window.location.href = 'https://github.com/vincent-cm';
  }
}
