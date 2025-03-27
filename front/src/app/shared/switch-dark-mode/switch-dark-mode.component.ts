import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-switch-dark-mode',
  imports: [FormsModule],
  templateUrl: './switch-dark-mode.component.html',
  styleUrl: './switch-dark-mode.component.scss',
})
export class SwitchDarkModeComponent implements OnInit {
  checked: boolean = false;

  ngOnInit(): void {
    const storedTheme = localStorage.getItem('theme') || 'light';
    this.checked = storedTheme === 'dark';
    this._applyTheme();
  }

  toggleTheme(): void {
    this.checked = !this.checked;
    console.log('Bouton cliqué, état:', this.checked);
    localStorage.setItem('theme', this.checked ? 'dark' : 'light');
    this._applyTheme();
  }


  private _applyTheme(): void {
    const html = document.documentElement;
    if (this.checked) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    console.log('Dark mode:', this.checked, 'HTML classes:', html.classList);
  }


}
