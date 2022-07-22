import {Inject, Injectable} from '@angular/core';
import {WINDOW} from './window.provider';

@Injectable({
  providedIn: 'root'
})
export class PoolsProvider {

  public pools = [
    {
      group: 'CHIA',
      name: 'Foxy-Pool CHIA',
      url: 'https://chia.foxypool.io',
      poolIdentifier: 'chia',
      hostnames: ['chia.foxypool.io', 'localhost'],
      apiUrl: 'https://api2.foxypool.io',
      algorithm: 'Proof of Spacetime',
      downloadUrl: 'https://github.com/Chia-Network/chia-blockchain/releases/latest',
    },{
      group: 'CHIA',
      name: 'Foxy-Pool CHIA (OG)',
      url: 'https://chia-og.foxypool.io',
      poolIdentifier: 'chia-og',
      hostnames: ['chia-og.foxypool.io'],
      apiUrl: 'https://api2.foxypool.io',
      algorithm: 'Proof of Spacetime',
      downloadUrl: 'https://github.com/foxypool/chia-blockchain/releases/latest',
    },{
      group: 'CHIA',
      name: 'Foxy-Pool CHIA (Testnet)',
      url: 'https://chia-testnet.foxypool.io',
      poolIdentifier: 'chia-testnet',
      hostnames: ['chia-testnet.foxypool.io'],
      apiUrl: 'https://api2.foxypool.io',
      algorithm: 'Proof of Spacetime',
      hidden: true,
    },{
      group: 'FLAX',
      name: 'Foxy-Pool FLAX (OG)',
      url: 'https://flax-og.foxypool.io',
      poolIdentifier: 'flax-og',
      hostnames: ['flax-og.foxypool.io'],
      apiUrl: 'https://api2.foxypool.io',
      algorithm: 'Proof of Spacetime',
      downloadUrl: 'https://github.com/foxypool/flax-blockchain/releases/latest',
    },{
      group: 'CHIVES',
      name: 'Foxy-Pool CHIVES',
      url: 'https://chives.foxypool.io',
      poolIdentifier: 'chives',
      hostnames: ['chives.foxypool.io'],
      apiUrl: 'https://api2.foxypool.io',
      algorithm: 'Proof of Spacetime',
      downloadUrl: 'https://github.com/HiveProject2021/chives-blockchain/releases/latest',
    },{
      group: 'CHIVES',
      name: 'Foxy-Pool CHIVES (OG)',
      url: 'https://chives-og.foxypool.io',
      poolIdentifier: 'chives-og',
      hostnames: ['chives-og.foxypool.io'],
      apiUrl: 'https://api2.foxypool.io',
      algorithm: 'Proof of Spacetime',
      downloadUrl: 'https://github.com/foxypool/chives-blockchain/releases/latest',
    },{
      group: 'HDDCOIN',
      name: 'Foxy-Pool HDDCOIN (OG)',
      url: 'https://hddcoin-og.foxypool.io',
      poolIdentifier: 'hddcoin-og',
      hostnames: ['hddcoin-og.foxypool.io'],
      apiUrl: 'https://api2.foxypool.io',
      algorithm: 'Proof of Spacetime',
      downloadUrl: 'https://github.com/foxypool/hddcoin-blockchain/releases/latest',
    },{
      group: 'STAI',
      name: 'Foxy-Pool STAI (OG)',
      url: 'https://stai-og.foxypool.io',
      poolIdentifier: 'stai-og',
      hostnames: ['stai-og.foxypool.io'],
      apiUrl: 'https://api2.foxypool.io',
      algorithm: 'Proof of Spacetime',
      downloadUrl: 'https://github.com/foxypool/stai-blockchain/releases/latest',
    },{
      group: 'BHD',
      name: 'Foxy-Pool BHD',
      url: 'https://bhd.foxypool.io',
      algorithm: 'Proof of Capacity',
    },{
      group: 'SIGNA',
      name: 'Foxy-Pool SIGNA',
      url:  'https://signa.foxypool.io',
      algorithm: 'Proof of Capacity',
    },
  ];

  public readonly pool = null;
  public readonly apiUrl = null;
  private readonly _poolIdentifier = null;
  private readonly _coin = null;

  constructor(
    @Inject(WINDOW) private window: Window,
  ) {
    const hostname = this.window.location.hostname;
    const pool = this.pools
      .filter(pool => pool.hostnames)
      .find(pool => pool.hostnames.some(curr => curr === hostname));
    if (pool) {
      this.pool = pool;
      this._poolIdentifier = pool.poolIdentifier;
      this._coin = pool.group;
      this.apiUrl = pool.apiUrl;
    }
  }

  get poolIdentifier() : string {
    return this._poolIdentifier;
  }

  get coin() : string {
    return this._coin;
  }
}
