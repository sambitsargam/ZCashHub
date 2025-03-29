import axios from 'axios';
import { WalletData, TransactionData } from '../types/api';

const API_BASE_URL = 'https://sandbox-api.3xpl.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getWalletData = async (address: string): Promise<WalletData> => {
  const response = await api.get(`/zcash/address/${address}`, {
    params: {
      data: 'address,balances,events,mempool',
      from: 'all'
    }
  });
  return response.data.data;
};

export const getTransactionDetails = async (hash: string): Promise<TransactionData> => {
  const response = await api.get(`/zcash/transaction/${hash}`, {
    params: {
      data: 'transaction,events',
      from: 'all',
      limit: 'default'
    }
  });
  return response.data.data;
};

// services/api.ts

export interface SubscriptionFormData {
  address: string;
  whatsapp: string;
  email: string;
  minValue: string;
}

export interface FirebaseResponse {
  name: string; // Firebase returns a unique key under the property "name"
}

export async function subscribeToAlerts(
  formData: SubscriptionFormData
): Promise<FirebaseResponse> {
  const response = await fetch(
    'https://zcash-f9192-default-rtdb.firebaseio.com/alerts.json', // Firebase REST endpoint requires the .json suffix
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }
  );

  if (!response.ok) {
    throw new Error('Error saving subscription details');
  }

  return response.json();
}
