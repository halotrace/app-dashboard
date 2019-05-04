/*
 * Copyright: Ambrosus Inc.
 * Email: tech@ambrosus.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AssetsService } from 'app/services/assets.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialogRef, MatDialog } from '@angular/material';
import { EventAddComponent } from '../event-add/event-add.component';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EventComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];
  assetId;
  eventId;
  event;
  eventPrefill;
  location: any = false;
  noContent = false;
  dialogs: {
    event?: MatDialogRef<any>,
  } = {};

  objectKeys = Object.keys;
  isArray = Array.isArray;
  stringify = JSON.stringify;

  isObject(value) {
    return typeof value === 'object';
  }
  valueJSON(value) {
    return value.replace(/["{}\[\]]/g, '').replace(/^\s+/m, '');
  }

  constructor(
    private route: ActivatedRoute,
    public assetsService: AssetsService,
    private sanitizer: DomSanitizer,
    public dialog: MatDialog,
  ) { }

  ngOnDestroy() {
    this.subs.map(sub => sub.unsubscribe());
  }

  ngOnInit() {
    this.subs[this.subs.length] = this.assetsService.event.subscribe(
      event => {
        console.log('Event: ', event);
        this.event = event;
        this.eventPrefill = JSON.parse(JSON.stringify(event));
        console.log('Event prefill: ', this.eventPrefill);

        if (this.event.info) {
          if (
            !this.event.info.images &&
            !this.event.info.description &&
            !this.event.info.documents &&
            !(this.event.info.identifiers && this.event.info.identifiers.identifiers) &&
            !(this.event.info.properties && this.event.info.properties.length) &&
            !(this.event.info.groups && this.event.info.groups.length)
          ) {
            this.noContent = true;
          }
        }

        try {
          this.location = {
            lat: this.event.info.location.geoJson ? this.event.info.location.geoJson.coordinates[0] : this.event.info.location.location.geometry.coordinates[0],
            lng: this.event.info.location.geoJson ? this.event.info.location.geoJson.coordinates[1] : this.event.info.location.location.geometry.coordinates[1],
          };
          delete this.event.info.location.type;
          delete this.event.info.location.location;
          delete this.event.info.location.geoJson;
        } catch (e) { }
      },
      err => console.error('Event: ', err),
    );

    this.subs[this.subs.length] = this.assetsService.progress.status.start.subscribe(next => {
      Object.keys(this.dialogs).map(key => this.dialogs[key].close());
    });

    this.subs[this.subs.length] = this.route.params.subscribe(resp => {
      this.assetId = resp.assetid;
      this.eventId = resp.eventid;
    });
  }

  editEvent() {
    this.dialogs.event = this.dialog.open(EventAddComponent, {
      panelClass: 'dialog',
      disableClose: true,
      data: {
        assetIds: [this.assetId],
        prefill: this.eventPrefill,
        for: 'events',
      },
    });
  }

  sanitizeUrl(url) {
    return this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`);
  }
}
