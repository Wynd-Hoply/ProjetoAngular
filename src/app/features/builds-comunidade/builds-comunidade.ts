import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-builds-comunidade',
  imports: [RouterLink],
  templateUrl: './builds-comunidade.html',
  styleUrl: './builds-comunidade.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildsComunidade {}