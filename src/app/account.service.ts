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
  public static authTokenStorageKey = 'authToken';

  public account = null;
  public accountHistoricalStats = new BehaviorSubject<any[]>([]);
  public isLoading = false;
  public isAuthenticating = false;
  public isUpdatingAccount = false;

  constructor(
    private statsService: StatsService,
    private poolsProvider: PoolsProvider,
    private localStorageService: LocalStorageService,
    private toastService: ToastService,
    private snippetService: SnippetService,
  ) {}

  async login({ singletonGenesis }) {
    singletonGenesis = singletonGenesis.trim();
    const account = await this.getAccount({ accountIdentifier: singletonGenesis });
    if (account === null) {
      this.toastService.showErrorToast(this.snippetService.getSnippet('account-service.login.error.invalid-farmer', singletonGenesis));
      return false;
    }
    this.localStorageService.setItem(AccountService.singletonGenesisStorageKey, singletonGenesis);
    Sentry.setUser({ id: singletonGenesis });
    await this.updateAccount();
    await this.updateAccountHistoricalStats();
    this.toastService.showSuccessToast(this.snippetService.getSnippet('account-service.login.success'));

    return true;
  }

  logout() {
    this.removeSingletonGenesis();
    this.removeAuthToken();
    this.account = null;
    this.accountHistoricalStats.next([]);
    Sentry.setUser(null);
    this.toastService.showSuccessToast(this.snippetService.getSnippet('account-service.logout.success'));
  }

  get singletonGenesis() {
    return this.localStorageService.getItem(AccountService.singletonGenesisStorageKey);
  }

  removeSingletonGenesis() {
    this.localStorageService.removeItem(AccountService.singletonGenesisStorageKey);
  }

  get haveSingletonGenesis() {
    return !!this.singletonGenesis;
  }

  get haveAccount() {
    return this.account !== null;
  }

  async updateAccount() {
    this.account = await this.getAccount({ accountIdentifier: this.singletonGenesis });
    if (!this.haveAccount) {
      this.removeSingletonGenesis();
      this.removeAuthToken();
      this.accountHistoricalStats.next([]);
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

  patchAccount(account) {
    account.pendingRounded = (new BigNumber(account.pending)).decimalPlaces(12, BigNumber.ROUND_FLOOR).toNumber();
  }

  get authToken() {
    return this.localStorageService.getItem(AccountService.authTokenStorageKey);
  }

  get haveAuthToken() {
    return !!this.authToken;
  }

  removeAuthToken() {
    this.localStorageService.removeItem(AccountService.authTokenStorageKey);
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
      this.localStorageService.setItem(AccountService.authTokenStorageKey, accessToken);
    } finally {
      this.isAuthenticating = false;
    }
  }

  async updateName({ newName }) {
    if (!this.haveAuthToken) {
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
    if (!this.haveAuthToken) {
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
}
