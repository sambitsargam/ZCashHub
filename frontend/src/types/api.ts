export interface WalletData {
  address: {
    address: string;
    balances: {
      'zcash-main': number;
    };
    events: {
      'zcash-main': number;
    };
  };
  balances: {
    'zcash-main': {
      zcash: {
        balance: string;
        events: number;
      };
    };
  };
  events: {
    'zcash-main': WalletEvent[];
  };
}

export interface WalletEvent {
  block: number;
  transaction: string;
  sort_key: number;
  time: string;
  currency: string;
  effect: string;
  failed: boolean;
  extra: any;
  extra_indexed: any;
}

export interface TransactionData {
  transaction: {
    block: number;
    transaction: string;
    time: string;
    events: {
      'zcash-main': number;
    };
  };
  events: {
    'zcash-main': TransactionEvent[];
  };
}

export interface TransactionEvent {
  sort_key: number;
  address: string;
  currency: string;
  effect: string;
  failed: boolean;
  extra: any;
  extra_indexed: any;
}

export interface AlertSubscription {
  address: string;
  whatsapp: string;
  email: string;
  minValue: string;
}