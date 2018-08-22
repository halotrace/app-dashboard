import { Component, ElementRef, OnInit, Renderer2, ViewEncapsulation, OnDestroy } from '@angular/core';
import { AssetsService } from 'app/services/assets.service';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { StorageService } from 'app/services/storage.service';
import { AuthService } from 'app/services/auth.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventAddComponent } from './../event-add/event-add.component';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AssetsComponent implements OnInit, OnDestroy {
  navigationSubscription;

  toggleDropdown: false;

  assets = {
    assets: [],
    resultCount: 0
  };
  accounts = [];
  accountSelected;
  perPage = 15;
  noEvents = false;
  error = false;
  selectAllText = 'Select all';
  loader = false;
  createEvents = false;
  assetSub: Subscription;
  // Search
  searchPlaceholder = 'ie. Green apple';
  searchResultsFound;
  searchNoResultsFound;
  searchResults;
  // Pagination
  currentAssetPage = 1;
  totalAssetPages = 0;
  resultCountAsset;
  currentSearchPage = 1;
  totalSearchPages = 0;
  resultCountSearch;
  assetsActive = true;
  searchActive = false;
  pagination = [];

  constructor(
    private assetsService: AssetsService,
    private el: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private storage: StorageService,
    private auth: AuthService,
    public dialog: MatDialog
  ) {
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        this.pageLoad();
      }
    });
  }

  pageLoad() {
    this.ngOnInit();
    this.loadAssets();
    this.el.nativeElement.querySelector('#search').value = '';
  }

  bulkActions(action) {
    switch (action.value) {
      case 'createEvent':
        if (this.assetsService.getSelectedAssets().length === 0) {
          alert(`You didn\'t select any assets. Please do so first.`);
        } else {
          this.createEventsDialog();
        }
        break;
    }

    action.value = 'default';
  }

  ngOnInit() {
    // Bind this for pagination
    this.loadAssets = this.loadAssets.bind(this);
    this.search = this.search.bind(this);

    this.accountSelected = <any>this.storage.get('user')['address'];
  }

  ngOnDestroy() {
    this.assetSub.unsubscribe();
    this.navigationSubscription.unsubscribe();
    this.accountSelected = null;
    this.assetsService.unselectAssets();
  }

  rowsPerPage(select) {
    this.perPage = select.value;
    if (this.assetsActive) {
      this.loadAssets(this.currentAssetPage - 1);
    } else {
      this.search(this.currentSearchPage - 1);
    }
  }

  resetLoadAssets() {
    this.assetsActive = true;
    this.searchActive = false;
    this.renderer.removeClass(this.el.nativeElement.querySelector('#selectAll').parentNode.parentNode.parentNode, 'checkbox--checked');
    this.selectAllText = 'Select all';
    this.assetsService.unselectAssets();
    this.assets = {
      assets: [],
      resultCount: 0
    };
    this.searchNoResultsFound = null;
  }

  loadAssets(page = 0, perPage = this.perPage) {
    this.resetLoadAssets();
    this.loader = true;
    const address = this.accountSelected;
    this.assetSub = this.assetsService.getAssetsInfo(page, perPage, address).subscribe(
      (resp: any) => {
        this.loader = false;
        this.assets = resp;
        this.resultCountAsset = resp.resultCount;
        this.totalAssetPages = Math.ceil(resp.resultCount / perPage);
      },
      err => {
        this.loader = false;
        console.log('AssetsInfo get failed: ', err);
      }
    );
  }

  resetSearch() {
    this.searchActive = true;
    this.assetsActive = false;
    this.renderer.removeClass(this.el.nativeElement.querySelector('#selectAll').parentNode.parentNode.parentNode, 'checkbox--checked');
    this.selectAllText = 'Select all';
    this.assetsService.unselectAssets();
    this.assets = {
      assets: [],
      resultCount: 0
    };
  }

  search(page = 0, perPage = this.perPage, address = this.accountSelected) {
    const search = this.el.nativeElement.querySelector('#search').value;
    const select = this.el.nativeElement.querySelector('#select').value;
    this.searchPlaceholder = 'ie. Green apple';
    if (search.length < 1) {
      if (this.searchActive) {
        this.pageLoad();
      } else {
        this.searchPlaceholder = 'Please type something first';
      }
      return;
    }
    this.resetSearch();
    this.loader = true;

    const searchValues = search.split(',');
    const queries = {};
    switch (select) {
      case 'name':
        queries['data[name]'] = searchValues[0].trim();
        break;
      case 'createdBy':
        queries['createdBy'] = searchValues[0].trim();
        break;
      case 'type':
        queries['data[type]'] = `ambrosus.asset.${searchValues[0].trim()}`;
        break;
      case 'asset identifiers':
        queries['data[type]'] = `ambrosus.asset.identifiers`;
        searchValues.map((query) => {
          const ide = query.split(':');
          const param = `data[identifiers.${ide[0].trim()}]`;
          const value = ide[1] ? ide[1].trim() : '';
          queries[param] = value;
        });
        break;
      case 'event identifiers':
        queries['data[type]'] = `ambrosus.event.identifiers`;
        searchValues.map((query) => {
          const ide = query.split(':');
          const param = `data[identifiers.${ide[0].trim()}]`;
          const value = ide[1] ? ide[1].trim() : '';
          queries[param] = value;
        });
        break;
    }

    if (select !== 'createdBy') {
      queries['createdBy'] = address;
    }

    this.searchResults = null;
    this.searchNoResultsFound = null;
    this.searchResultsFound = null;

    // Make a request
    this.assetsService.getEvents(queries, page, perPage)
      .then((resp: any) => {
        this.assetsService.attachInfoEvents(resp, address).then((r: any) => {
          this.loader = false;
          if (r.assets.length > 0) {
            this.assets = r;
            this.resultCountSearch = r.resultCount;
            this.totalSearchPages = Math.ceil(r.resultCount / perPage);
            this.searchResultsFound = `Found ${r.resultCount} results`;
          } else {
            this.searchNoResultsFound = 'No results found';
          }
        }).catch(e => {});
      })
      .catch(err => {
        this.loader = false;
      });
  }

  findInfo(info) {
    const infoEvent = info.content.data.find(obj => obj.type === 'ambrosus.asset.info');
    return infoEvent;
  }

  onSelectAll(e, input) {
    let table = this.el.nativeElement.querySelectorAll('.table__item.table');
    table = Array.from(table);
    if (input.checked) {
      this.selectAllText = 'Unselect all';
      table.map((item) => {
        const checkbox = item.children[0].children[0].children[0];
        checkbox.checked = true;
        this.assetsService.selectAsset(checkbox.name);
      });
      const event = new Event('on:checked');
      window.dispatchEvent(event);
    } else {
      this.selectAllText = 'Select all';
      table.map((item) => {
        const checkbox = item.children[0].children[0].children[0];
        checkbox.checked = false;
      });
      this.assetsService.unselectAssets();
      const event = new Event('on:checked');
      window.dispatchEvent(event);
    }
  }

  checkAsset(assetId) {
    const selectedAssets = this.assetsService.getSelectedAssets();
    if (selectedAssets.indexOf(assetId) === -1) {
      this.assetsService.selectAsset(assetId);
    } else {
      this.assetsService.unselectAsset(assetId);
    }
  }

  createEventsDialog() {
    const dialogRef = this.dialog.open(EventAddComponent, {
      width: '600px',
      position: { right: '0'}
    });
    const instance = dialogRef.componentInstance;
    instance.assetId = this.assetsService.getSelectedAssets();
    instance.isMultiple = true;

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

}
