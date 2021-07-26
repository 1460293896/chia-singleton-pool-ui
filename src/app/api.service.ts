import axios, {AxiosInstance} from 'axios';

export class ApiService {
  private client: AxiosInstance;

  constructor(url: string) {
    this.client = axios.create({
      baseURL: `${url}/api/v1`,
    });
  }

  async getPoolConfig({ poolIdentifier }) {
    const { data } = await this.client.get(`${poolIdentifier}/config`);

    return data;
  }

  async getPoolStats({ poolIdentifier }) {
    const { data } = await this.client.get(`${poolIdentifier}/pool`);

    return data;
  }

  async getAccountsStats({ poolIdentifier }) {
    const { data } = await this.client.get(`${poolIdentifier}/accounts`);

    return data;
  }

  async getRewardStats({ poolIdentifier }) {
    const { data } = await this.client.get(`${poolIdentifier}/rewards`);

    return data;
  }

  async getLastPayouts({ poolIdentifier }) {
    const { data } = await this.client.get(`${poolIdentifier}/payouts`);

    return data;
  }

  async getExchangeStats({ poolIdentifier }) {
    const { data } = await this.client.get(`${poolIdentifier}/rates`);

    return data;
  }

  async getAccount({ poolIdentifier, accountIdentifier }) {
    const { data } = await this.client.get(`${poolIdentifier}/account/${accountIdentifier}`);

    return data;
  }

  async authenticateAccount({ poolIdentifier, accountIdentifier, message, signature }) {
    const { data } = await this.client.post(`${poolIdentifier}/account/${accountIdentifier}/authenticate`, {
      message,
      signature,
    });

    return data;
  }

  async updateAccountName({ poolIdentifier, accountIdentifier, authToken, newName }) {
    const { data } = await this.client.post(`${poolIdentifier}/account/${accountIdentifier}/name`, {
      newName,
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    return data;
  }

  async updateAccountDistributionRatio({ poolIdentifier, accountIdentifier, authToken, newDistributionRatio }) {
    const { data } = await this.client.post(`${poolIdentifier}/account/${accountIdentifier}/distribution-ratio`, {
      newDistributionRatio,
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    return data;
  }

  async updateAccountMinimumPayout({ poolIdentifier, accountIdentifier, authToken, minimumPayout }) {
    const { data } = await this.client.post(`${poolIdentifier}/account/${accountIdentifier}/minimum-payout`, {
      minimumPayout,
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    return data;
  }
}
