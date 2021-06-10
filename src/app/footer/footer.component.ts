import { Component, OnInit } from '@angular/core';
import {SnippetService} from '../snippet.service';
import {faDiscord, faGithub, faTwitter} from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  public faDiscord = faDiscord;
  public faGithub = faGithub;
  public faTwitter = faTwitter;

  constructor(private _snippetService: SnippetService) {}

  get snippetService(): SnippetService {
    return this._snippetService;
  }

  ngOnInit() {
  }

}
