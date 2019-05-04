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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import * as moment from 'moment-timezone';
import { AccountsService } from './accounts.service';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
declare let Web3: any;
import * as AmbrosusSDK from 'ambrosus-javascript-sdk';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  sdk;
  web3;
  api;
  signupAddress: any = '';
  inviteId: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: StorageService,
    private accountsService: AccountsService,
  ) {
    this.sdk = new AmbrosusSDK({ Web3 });
    this.web3 = new Web3();
    this.api = environment.api;
  }

  to(O: Observable<any>) {
    return O.toPromise()
      .then(response => response)
      .catch(error => ({ error }));
  }

  isLoggedIn(): boolean {
    const account = <any>this.storageService.get('account') || {};
    const secret = this.storageService.get('secret');

    return !!(account.address && secret);
  }

  getToken(): string | null {
    const secret = this.storageService.get('secret');
    const validUntil = moment()
      .add(5, 'days')
      .unix();

    return secret ? this.sdk.getToken(secret, validUntil) : null;
  }

  async verifyAccount(privateKey: string = '', address: string = ''): Promise<any> {
    let _address = address;
    if (privateKey) {
      try {
        _address = this.web3.eth.accounts.privateKeyToAccount(privateKey).address;
      } catch (e) {
        throw new Error('Private key is invalid');
      }
    }
    const url = `${this.api.extended}/account/${_address}/exists`;

    const account = await this.to(this.http.get(url));
    if (account.error) {
      throw account.error;
    }
    if (account.data !== true) {
      throw new Error('Account not found');
    }

    return account.data;
  }

  async login(email: string, password: string): Promise<any> {
    const url = `${this.api.extended}/account/secret`;

    const secretToken = await this.to(this.http.post(url, { email }));
    if (secretToken.error) {
      throw secretToken.error;
    }

    try {
      console.log('[GET] PrivateKey token: ', secretToken.data);

      let token = secretToken.data.token;
      token = JSON.parse(atob(token));
      const [address, privateKey] = this.decryptPrivateKey(
        token,
        password,
      );
      if (!address) {
        throw new Error('Password is incorrect');
      }

      this.storageService.set('secret', privateKey);
      this.storageService.set('token', this.getToken());

      const account = await this.accountsService.getAccount(address);

      console.log('[GET] Account: ', account);
      this.storageService.set('account', account);
      this.accountsService._account.next(account);
      this.signupAddress = '';

      this.router.navigate(['/assets']);

      return account;
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    this.storageService.clear();
    this.router.navigate(['/login']);
  }

  // UTILS

  decryptPrivateKey(token: Object, password: string) {
    try {
      const { address, privateKey } = this.web3.eth.accounts.decrypt(
        token,
        password,
      );
      return [address, privateKey];
    } catch (e) {
      return [null];
    }
  }

  privateKeyToAccount(privateKey: string): string | null {
    try {
      const address = this.web3.eth.accounts.privateKeyToAccount(privateKey)
        .address;
      return address;
    } catch (e) {
      return null;
    }
  }
}
