import { Injectable } from '@angular/core';

import {StatsService} from './stats.service';
import {PoolsProvider} from './pools.provider';
import {LocalStorageService} from './local-storage.service';
import {ToastService} from './toast.service';
import {BigNumber} from 'bignumber.js';
import {SnippetService} from './snippet.service';
import * as Sentry from '@sentry/angular';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  public static singletonGenesisStorageKey = 'singletonGenesis';
  public static authTokenStorageKey = (singletonGenesis: string): string => `authToken:${singletonGenesis}`;

  public accountSubject = new BehaviorSubject<any>(null);
  public accountHistoricalStats = new BehaviorSubject<any[]>([]);
  public isLoading = false;
  public isAuthenticating = false;
  public isUpdatingAccount = false;
  public isMyFarmerPage = true;

  private _singletonGenesis: string = null;

  constructor(
    private statsService: StatsService,
    private poolsProvider: PoolsProvider,
    private localStorageService: LocalStorageService,
    private toastService: ToastService,
    private snippetService: SnippetService,
  ) {
    this.migrateLegacyConfig();
    this.singletonGenesis = this.singletonGenesisFromLocalStorage;
  }

  get account(): any {
    return this.accountSubject.getValue();
  }

  set account(account: any) {
    this.accountSubject.next(account);
  }

  get singletonGenesis(): string {
    return this._singletonGenesis;
  }

  set singletonGenesis(value: string) {
    this._singletonGenesis = value;
    if (value) {
      Sentry.setUser({ id: value });
    } else {
      Sentry.setUser(null);
    }
  }

  get singletonGenesisFromLocalStorage(): string {
    return this.localStorageService.getItem(AccountService.singletonGenesisStorageKey);
  }

  get authToken(): string {
    return this.localStorageService.getItem(AccountService.authTokenStorageKey(this.singletonGenesis));
  }

  async login({ singletonGenesis }): Promise<boolean> {
    singletonGenesis = singletonGenesis.trim();
    const account = await this.getAccount({ accountIdentifier: singletonGenesis });
    if (account === null) {
      this.toastService.showErrorToast(this.snippetService.getSnippet('account-service.login.error.invalid-farmer', singletonGenesis));
      return false;
    }
    this.setSingletonGenesisInLocalStorage(singletonGenesis);
    this.singletonGenesis = singletonGenesis;
    await this.updateAccount();
    await this.updateAccountHistoricalStats();
    this.toastService.showSuccessToast(this.snippetService.getSnippet('account-service.login.success'));

    return true;
  }

  async doesAccountExist({ singletonGenesis }) {
    const account = await this.getAccount({ accountIdentifier: singletonGenesis });
    if (account === null) {
      this.toastService.showErrorToast(this.snippetService.getSnippet('account-service.login.error.invalid-farmer', singletonGenesis));

      return false;
    }

    return true;
  }

  logout(): void {
    this.removeAuthTokenFromLocalStorage();
    if (!this.isExternalSingletonGenesis) {
      this.removeSingletonGenesisFromLocalStorage();
      this.clearStats();
    }
    this.toastService.showSuccessToast(this.snippetService.getSnippet('account-service.logout.success'));
  }

  clearStats(): void {
    this.singletonGenesis = null;
    this.account = null;
    this.accountHistoricalStats.next([]);
  }

  removeSingletonGenesisFromLocalStorage(): void {
    this.localStorageService.removeItem(AccountService.singletonGenesisStorageKey);
  }

  setSingletonGenesisInLocalStorage(singletonGenesis: string): void {
    this.localStorageService.setItem(AccountService.singletonGenesisStorageKey, singletonGenesis);
  }

  setAuthTokenInLocalStorage(authToken: string): void {
    this.localStorageService.setItem(AccountService.authTokenStorageKey(this.singletonGenesis), authToken);
  }

  removeAuthTokenFromLocalStorage(): void {
    this.localStorageService.removeItem(AccountService.authTokenStorageKey(this.singletonGenesis));
  }

  get haveSingletonGenesis(): boolean {
    return !!this.singletonGenesis;
  }

  get haveAccount(): boolean {
    return this.account !== null;
  }

  get haveAuthToken(): boolean {
    return !!this.authToken;
  }

  get isAuthenticated(): boolean {
    return this.haveSingletonGenesis && this.haveAuthToken;
  }

  get isExternalSingletonGenesis(): boolean {
    return this.singletonGenesis !== this.singletonGenesisFromLocalStorage;
  }

  async updateAccount() {
    this.account = await this.getAccount({ accountIdentifier: this.singletonGenesis });
    if (!this.haveAccount) {
      if (this.isMyFarmerPage) {
        this.removeAuthTokenFromLocalStorage();
        this.removeSingletonGenesisFromLocalStorage();
      }
      this.accountHistoricalStats.next([]);
      this.toastService.showErrorToast(this.snippetService.getSnippet('account-service.login.error.invalid-farmer', this.singletonGenesis));
    }
  }

  async updateAccountHistoricalStats() {
    this.accountHistoricalStats.next(await this.getAccountHistoricalStats({ accountIdentifier: this.singletonGenesis }));
  }

  async getAccount({ accountIdentifier }) {
    this.isLoading = true;
    let account = null;
    try {
      account = await this.statsService.getAccount({ accountIdentifier });
      if (account) {
        this.patchAccount(account);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        account = null;
      } else {
        throw err;
      }
    } finally {
      this.isLoading = false;
    }

    return account;
  }

  async getAccountHistoricalStats({ accountIdentifier }) {
    this.isLoading = true;
    let accountHistoricalStats = [];
    try {
      accountHistoricalStats = await this.statsService.getAccountHistoricalStats({ accountIdentifier });
    } finally {
      this.isLoading = false;
    }

    return accountHistoricalStats;
  }

  patchAccount(account): void {
    account.pendingBN = new BigNumber(account.pending);
    account.pendingRounded = account.pendingBN.decimalPlaces(12, BigNumber.ROUND_FLOOR).toNumber();
  }

  async authenticate({ signature, message }) {
    if (!this.haveSingletonGenesis) {
      return;
    }
    this.isAuthenticating = true;
    try {
      const { accessToken } = await this.statsService.authenticate({
        accountIdentifier: this.singletonGenesis,
        signature,
        message,
      });
      this.setAuthTokenInLocalStorage(accessToken);
    } finally {
      this.isAuthenticating = false;
    }
  }

  async updateName({ newName }) {
    if (!this.isAuthenticated) {
      return;
    }
    this.isUpdatingAccount = true;
    try {
      await this.statsService.updateAccountName({
        accountIdentifier: this.singletonGenesis,
        authToken: this.authToken,
        newName,
      });
      await this.updateAccount();
    } finally {
      this.isUpdatingAccount = false;
    }
  }

  async updateMinimumPayout({ newMinimumPayout }) {
    if (!this.isAuthenticated) {
      return;
    }
    this.isUpdatingAccount = true;
    try {
      await this.statsService.updateAccountMinimumPayout({
        accountIdentifier: this.singletonGenesis,
        authToken: this.authToken,
        minimumPayout: newMinimumPayout,
      });
      await this.updateAccount();
    } finally {
      this.isUpdatingAccount = false;
    }
  }

  private migrateLegacyConfig() {
    const legacyAuthToken = this.localStorageService.getItem('authToken');
    if (legacyAuthToken) {
      this.localStorageService.setItem(AccountService.authTokenStorageKey(this.singletonGenesisFromLocalStorage), legacyAuthToken);
      this.localStorageService.removeItem('authToken');
    }
  }
}
