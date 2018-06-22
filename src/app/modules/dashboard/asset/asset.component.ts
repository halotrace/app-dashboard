import { StorageService } from './../../../services/storage.service';
import { AssetsService } from './../../../services/assets.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.scss']
})
export class AssetComponent implements OnInit {
  asset;
  assetId: string;
  createEvents = false;
  hostLink = 'amb.to';

  objectKeys = Object.keys;
  expandEvents = [];

  constructor(
    private route: ActivatedRoute,
    private assetService: AssetsService,
    private storage: StorageService
  ) {}

  isObject(value) {
    return typeof value === 'object';
  }

  openCreateEvent() {
    this.assetService.unselectAssets();
    this.assetService.selectAsset(this.assetId);
    this.createEvents = true;
  }

  ngOnInit() {
    if (this.storage.environment === 'dev') {
      this.hostLink = 'angular-amb-to-stage.herokuapp.com';
    }

    this.route.params.subscribe(params => {
      this.assetId = params.assetid;
      this.assetService.getAsset(this.assetId).subscribe(
        asset => {
          console.log(asset);
        },
        err => {
          console.log('err ', err);
        }
      );
    });
  }
}
