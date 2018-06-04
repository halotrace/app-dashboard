import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from 'app/services/auth.service';
import {AssetsService} from 'app/services/assets.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-event-add',
  templateUrl: './event-add.component.html',
  styleUrls: ['./event-add.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EventAddComponent implements OnInit, OnDestroy {
  eventForm: FormGroup;
  error = false;
  spinner = false;
  identifiersAutocomplete = [
    'UPCE', 'UPC12', 'EAN8', 'EAN13', 'CODE 39', 'CODE 128', 'ITF', 'QR',
    'DATAMATRIX', 'RFID', 'NFC', 'GTIN', 'GLN', 'SSCC', 'GSIN', 'GINC', 'GRAI',
    'GIAI', 'GSRN', 'GDTI', 'GCN', 'CPID', 'GMN'
  ];
  json: string;

  constructor(private auth: AuthService,
              private assets: AssetsService,
              private router: Router) {
    this.initForm();
  }

  ngOnInit() {
    this.assets.inputChanged.subscribe(
      (resp: any) => {
        resp.control.get('identifier').setValue(resp.value);
      }
    );
    if (this.assets.getSelectedAssets().length === 0) {
      alert(`You didn\'t select any assets. Please do so on ${location.hostname}/assets`);
      this.router.navigate(['/assets']);
    }
  }

  ngOnDestroy() {
    this.assets.unselectAssets();
  }

  private initForm() {
    this.eventForm = new FormGroup({
      'assetType': new FormControl(null, [Validators.required]),
      'name': new FormControl(null, [Validators.required]),
      'description': new FormControl(null, []),
      'documents': new FormArray([
        new FormGroup({
          'documentTitle': new FormControl(null, []),
          'documentUrl': new FormControl(null, [])
        })
      ]),
      'identifiers': new FormArray([
        new FormGroup({
          'identifier': new FormControl(null, []),
          'identifierValue': new FormControl(null, [])
        })
      ]),
      'customData': new FormArray([
        new FormGroup({
          'customDataKey': new FormControl(null, []),
          'customDataValue': new FormControl(null, [])
        })
      ]),
      'customDataGroups': new FormArray([
        new FormGroup({
          'groupName': new FormControl(null, []),
          'groupValue': new FormArray([
            new FormGroup({
              'groupItemKey': new FormControl(null, []),
              'groupItemValue': new FormControl(null, [])
            })
          ])
        })
      ])
    });
  }

  // Methods for adding new fields to the form
  // Product images
  onAddDocument() {
    (<FormArray>this.eventForm.get('documents')).push(
      new FormGroup({
        'documentTitle': new FormControl(null, []),
        'documentUrl': new FormControl(null, [])
      })
    );
  }

  onRemoveDocument(index: number) {
    (<FormArray>this.eventForm.get('documents')).removeAt(index);
  }

  // Identifiers
  onAddIdentifier() {
    (<FormArray>this.eventForm.get('identifiers')).push(
      new FormGroup({
        'identifier': new FormControl(null, []),
        'identifierValue': new FormControl(null, [])
      })
    );
  }

  onRemoveIdentifier(index: number) {
    (<FormArray>this.eventForm.get('identifiers')).removeAt(index);
  }

  // Custom data (key-value)
  onAddCustomKeyValue() {
    (<FormArray>this.eventForm.get('customData')).push(
      new FormGroup({
        'customDataKey': new FormControl(null, []),
        'customDataValue': new FormControl(null, [])
      })
    );
  }

  onRemoveCustomKeyValue(index: number) {
    (<FormArray>this.eventForm.get('customData')).removeAt(index);
  }

  // Custom data groups (group name: key-value)
  onAddCustomGroup() {
    const customDataGroups = this.eventForm.get('customDataGroups') as FormArray;
    (<FormArray>customDataGroups).push(
      new FormGroup({
        'groupName': new FormControl(null, []),
        'groupValue': new FormArray([
          new FormGroup({
            'groupItemKey': new FormControl(null, []),
            'groupItemValue': new FormControl(null, [])
          })
        ])
      })
    );
  }

  onRemoveCustomGroup(index: number) {
    (<FormArray>this.eventForm.get('customDataGroups')).removeAt(index);
  }

  // Custom group data key-value pairs
  onAddCustomGroupKeyValue(i) {
    const groupsArray = this.eventForm.get('customDataGroups') as FormArray;
    (<FormArray>groupsArray.at(i).get('groupValue')).push(
      new FormGroup({
        'groupItemKey': new FormControl(null, []),
        'groupItemValue': new FormControl(null, [])
      })
    );
  }

  onRemoveCustomGroupKeyValue(i, j) {
    const groupsArray = this.eventForm.get('customDataGroups') as FormArray;
    (<FormArray>groupsArray.at(i).get('groupValue')).removeAt(j);
  }

  onSave() {
    if (this.eventForm.valid) {
      this.error = false;

      // Generate JSON
      this.generateJSON();
    } else {
      this.error = true;
    }
  }

  private generateJSON() {
    const asset = {};
    asset['content'] = {};

    // asset.content.idData
    asset['content']['idData'] = {};
    asset['content']['idData']['assetId'] = 'Asset id from the response';
    asset['content']['idData']['createdBy'] = localStorage.getItem('address');
    asset['content']['idData']['accessLevel'] = 0;
    asset['content']['idData']['timestamp'] = new Date().getTime();

    // asset.content.data
    asset['content']['data'] = [];

    const identifiers = {};
    identifiers['type'] = 'ambrosus.asset.identifier';
    identifiers['identifiers'] = {};
    for (const item of this.eventForm.get('identifiers')['controls']) {
      identifiers['identifiers'][item.value.identifier] = [];
      identifiers['identifiers'][item.value.identifier].push(item.value.identifierValue);
    }

    asset['content']['data'].push(identifiers);

    // Basic + custom data
    const basicAndCustom = {};
    // Basic data
    basicAndCustom['type'] = 'ambrosus.asset.info';
    basicAndCustom['name'] = this.eventForm.get('name').value;
    basicAndCustom['description'] = this.eventForm.get('description').value;
    basicAndCustom['assetType'] = this.eventForm.get('assetType').value;
    // Documents
    basicAndCustom['documents'] = {};
    for (const item of this.eventForm.get('documents')['controls']) {
      basicAndCustom['documents'][item.value.documentTitle] = {};
      basicAndCustom['documents'][item.value.documentTitle]['url'] = item.value.documentUrl;
    }
    // Custom data
    for (const item of this.eventForm.get('customData')['controls']) {
      basicAndCustom[item.value.customDataKey] = item.value.customDataValue;
    }
    // Custom data groups
    const customGroups = this.eventForm.get('customDataGroups')['controls'];
    for (const item of customGroups) {
      basicAndCustom[item.value.groupName] = {};
      for (const group of item.get('groupValue')['controls']) {
        basicAndCustom[item.value.groupName][group.value.groupItemKey] = group.value.groupItemValue;
      }
    }

    asset['content']['data'].push(basicAndCustom);

    const json = JSON.stringify(asset, null, 2);

    this.json = json;
  }
}