import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreBuildPC } from '../../../shared/layout/header/models/pre-build.model';
import { PRE_BUILDS_DATA } from '../../../shared/layout/header/data/pre-build.data';
@Component({
  selector: 'app-lista-produtos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-produtos.html',
  styleUrls: ['./lista-produtos.css']
})
export class ListaProdutosComponent implements OnInit {
  listaPcs: PreBuildPC[] = [];

  ngOnInit(): void {
    this.listaPcs = PRE_BUILDS_DATA;
  }
}