import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {environment} from 'environments/environment';
import {StorageService} from './storage.service';
import {Subject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  loggedin: Subject<boolean> = new Subject<boolean>();
  cleanForm: Subject<boolean> = new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService) {
  }

  isLoggedIn() {
    const token = this.storage.get('token');
    const address = this.storage.get('address');

    return token && address;
  }

  getToken(secret: string) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `AMB ${secret}`
    };

    const params = {
      'validUntil': 1600000000
    };

    return this.http.post(environment.apiUrls.token, params, {headers});
  }

  login(address: string, secret: string) {
    return new Observable(observer => {
      this.getToken(secret).subscribe(
        (resp: any) => {
          this.storage.set('token', resp.token);
          // Address request
          const url = `${environment.apiUrls.address}${address}`;
          this.http.get(url).subscribe(
            _resp => {
              this.storage.set('address', address);
              observer.next('success');
            },
            err => {
              observer.error(err);
            }
          );
        },
        err => {
          observer.error(err);
        });
    });
  }

  logout() {
    this.storage.delete('token');
    this.storage.delete('address');
    this.router.navigate(['/login']);
    this.loggedin.next(false);
  }
}
