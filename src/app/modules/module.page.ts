import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-module',
  templateUrl: './module.page.html',
  styleUrls: ['./module.page.scss'],
})
export class ModulePage implements OnInit {
  public module: string;

  constructor(private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.module = this.activatedRoute.snapshot.paramMap.get('id');
  }

}
