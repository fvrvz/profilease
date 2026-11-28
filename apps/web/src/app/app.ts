import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackOverlayComponent } from '@shared/components/feedback-overlay.component';

@Component({
  imports: [RouterOutlet, FeedbackOverlayComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
