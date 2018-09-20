import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-role-dialog',
  templateUrl: './role-dialog.component.html',
  styleUrls: ['./role-dialog.component.scss']
})
export class RoleDialogComponent implements OnInit {

  createPromise;
  title: string;
  permissions: string;
  selectedPermissions: string[] = [];
  isEdit: Boolean = false;
  message: { type: Boolean, text: string };

  permissionsArray = [
    { id: '1', name: 'Invites', value: 'invites' },
    { id: '2', name: 'Users', value: 'users' },
    { id: '3', name: 'Roles', value: 'roles' }
  ];

  @Input() roleObj;

  constructor(private dialogRef: MatDialogRef<RoleDialogComponent>, private http: HttpClient) { }

  ngOnInit() {
    if (this.roleObj) { this.getRoleById(this.roleObj[0]); this.isEdit = true; }
  }

  getRoleById(role) {
    this.selectedPermissions = role.permissions;
    this.title = role.title;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  save() {
    this.message.text = null;

    this.createPromise = new Promise((resolve, reject) => {
      if (this.selectedPermissions.length === 0) { this.message.text = 'Please select at least one permission'; this.message.type = false; reject(); }
      else if (!this.isEdit) {
        const body = { title: this.title, permissions: this.selectedPermissions };
        this.createRole(body).then(response => resolve()).catch(error => reject()); 
      } else if (this.isEdit) {
        const body = { _id: this.roleObj[0]._id, title: this.title, permissions: this.selectedPermissions };
        this.putRole(body).then(response => resolve()).catch(error => reject());
      }

    });
  }

  putRole(body) {
    const url = `/api/roles`;
    return new Promise((resolve, reject) => {
      this.http.put(url, body).subscribe(
        (resp: any) => {
          this.message.text = 'Saved Successfully';
          this.message.type = true;
          resolve();
        },
        err => {
          reject();
          this.message.type = false;
          this.message.text = err.error ? err.error.message : JSON.stringify(err);
          console.log('Role save failed: ', err);
      });
    });
  }  

  createRole(body) {
    const url = `/api/roles`;
    return new Promise((resolve, reject) => {
      this.http.post(url, body).subscribe(
        (resp: any) => {
          this.message.text = 'Saved Successfully';
          this.message.type = true;
          resolve();
        },
        err => {
          reject();
          this.message.type = false;
          this.message.text = err.error ? err.error.message : JSON.stringify(err);
          console.log('Role save failed: ', err);
      });
    });
  }  

  selectPermission(value) {
    if (this.selectedPermissions.indexOf(value) > -1) { this.selectedPermissions = this.selectedPermissions.filter(a => a !== value); } 
    else { this.selectedPermissions.push(value); }
  }

  checkPermission(value) {
    if (this.selectedPermissions.indexOf(value) > -1) { return true; }
    else { return false; }
  }

}
