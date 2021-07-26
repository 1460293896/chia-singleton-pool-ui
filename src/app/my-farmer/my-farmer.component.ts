import {Component, OnInit, ViewChild} from '@angular/core';
import {StatsService} from '../stats.service';
import {ToastService} from '../toast.service';
import {SnippetService} from '../snippet.service';
import Capacity from '../capacity';
import {faCircleNotch, faInfoCircle, faUserCheck} from '@fortawesome/free-solid-svg-icons';
import {AccountService} from '../account.service';
import * as moment from 'moment';
import {UpdateNameModalComponent} from '../update-name-modal/update-name-modal.component';
import BigNumber from 'bignumber.js';
import {UpdateMinimumPayoutModalComponent} from '../update-minimum-payout-modal/update-minimum-payout-modal.component';
import {PoolsProvider} from '../pools.provider';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-my-farmer',
  templateUrl: './my-farmer.component.html',
  styleUrls: ['./my-farmer.component.scss']
})
export class MyFarmerComponent implements OnInit {
  @ViewChild(UpdateNameModalComponent) updateNameModal;
  @ViewChild(UpdateMinimumPayoutModalComponent) updateMinimumPayoutModal;

  public poolConfig:any = {};
  public exchangeStats:any = {};
  public singletonGenesisInput = null;
  public faCircleNotch = faCircleNotch;
  public faUserCheck = faUserCheck;

  private poolEc = 0;
  private dailyRewardPerPib = 0;

  constructor(
    public snippetService: SnippetService,
    public accountService: AccountService,
    private statsService: StatsService,
    private toastService: ToastService,
    private poolsProvider: PoolsProvider,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {}

  async ngOnInit() {
    this.statsService.poolConfig.asObservable().subscribe((poolConfig => this.poolConfig = poolConfig));
    this.statsService.exchangeStats.asObservable().subscribe((exchangeStats => this.exchangeStats = exchangeStats));
    this.poolConfig = this.statsService.poolConfig.getValue();
    this.exchangeStats = this.statsService.exchangeStats.getValue();

    this.statsService.accountStats.asObservable().subscribe(async accountStats => {
      this.poolEc = accountStats.ecSum;
    });
    this.statsService.rewardStats.asObservable().subscribe(async rewardStats => {
      this.dailyRewardPerPib = rewardStats.dailyRewardPerPiB;
    });
    setInterval(async () => {
      if (!this.accountService.haveSingletonGenesis) {
        return;
      }
      await this.accountService.updateAccount();
    }, 3 * 60 * 1000);

    if (this.isLoginRequest()) {
      await this.loginAndAuthFromQueryParams();
      await this.router.navigate([]);
    }
    if (!this.accountService.haveSingletonGenesis) {
      return;
    }
    await this.accountService.updateAccount();
  }

  async loginAndAuthFromQueryParams() {
    const singletonGenesis = this.activatedRoute.snapshot.queryParamMap.get('launcher_id');
    const message = this.activatedRoute.snapshot.queryParamMap.get('authentication_token');
    const signature = this.activatedRoute.snapshot.queryParamMap.get('signature');
    const success: boolean = await this.accountService.login({ singletonGenesis });
    if (!success) {
      return;
    }
    try {
      await this.accountService.authenticate({ message, signature });
      this.toastService.showSuccessToast(this.snippetService.getSnippet('authentication-modal.success'));
    } catch (err) {
      this.toastService.showErrorToast(err.message);
      return;
    }
  }

  isLoginRequest() {
    const singletonGenesis = this.activatedRoute.snapshot.queryParamMap.get('launcher_id');
    const message = this.activatedRoute.snapshot.queryParamMap.get('authentication_token');
    const signature = this.activatedRoute.snapshot.queryParamMap.get('signature');

    return singletonGenesis && message && signature;
  }

  async login() {
    if (!this.singletonGenesisInput) {
      this.toastService.showErrorToast(this.snippetService.getSnippet('my-farmer-component.singleton-genesis-input.error.missing'));
      return;
    }
    const success: boolean = await this.accountService.login({ singletonGenesis: this.singletonGenesisInput });
    if (!success) {
      return;
    }
    this.singletonGenesisInput = null;
  }

  getFormattedCapacity(capacityInGiB) {
    if (capacityInGiB === 0) {
      return this.snippetService.getSnippet('general.not-available.short');
    }

    return (new Capacity(capacityInGiB)).toString();
  }

  getLastAcceptedPartialAtDuration(lastAcceptedPartialAt) {
    if (!lastAcceptedPartialAt) {
      return 'Never';
    }

    return moment(lastAcceptedPartialAt).fromNow();
  }

  get ecShare() {
    if (!this.accountService.account || !this.poolEc) {
      return 0;
    }

    return ((this.accountService.account.ec / this.poolEc) * 100).toFixed(2);
  }

  get estimatedDailyReward() {
    if (!this.accountService.account || !this.dailyRewardPerPib) {
      return 0;
    }
    const ecInPib = (new BigNumber(this.accountService.account.ec)).dividedBy((new BigNumber(1024).exponentiatedBy(2)));

    return ecInPib.multipliedBy(this.dailyRewardPerPib).toFixed(4);
  }

  async updateName() {
    this.updateNameModal.openModal();
  }

  async updateMinimumPayout() {
    this.updateMinimumPayoutModal.openModal();
  }

  getCoinValueAsFiat(value) {
    if (!this.exchangeStats || !this.exchangeStats.rates) {
      return 0;
    }
    if (!value) {
      return 0;
    }
    if (this.poolConfig.isTestnet) {
      return 0;
    }
    if (!this.exchangeStats.rates.usd) { // TODO: user configurable
      return 0;
    }

    return value * this.exchangeStats.rates.usd;
  }

  get authDocsUrl() {
    return `https://docs.foxypool.io/proof-of-spacetime/foxy-pool/pools/${this.poolsProvider.poolIdentifier}/authenticate/`;
  }
}
