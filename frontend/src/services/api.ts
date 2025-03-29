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

export const subscribeToAlerts = async (subscription: {
  address: string;
  whatsapp: string;
  email: string;
  minValue: string;
}) => {
  // In a real app, this would call your backend
  console.log('Subscribing to alerts:', subscription);
  return subscription;
};