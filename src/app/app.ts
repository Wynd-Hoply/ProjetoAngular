import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Header } from './shared/layout/header/header';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
 
}


