import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreBuildPC } from '../../shared/layout/header/models/pre-build.model';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './produtos.html',
  styleUrl: './produtos.css',
})
export class ProdutosComponent implements OnInit {
  listaDePcs: PreBuildPC[] = [];

  ngOnInit(): void {
  }
}
