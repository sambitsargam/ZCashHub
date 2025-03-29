import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { WalletData, WalletEvent, TransactionData } from '../types/api';
import { useQuery } from 'react-query';
import { getTransactionDetails } from '../services/api';
import { TransactionDetails } from './TransactionDetails';

interface Props {
  data: WalletData;
}

export const WalletInsights: React.FC<Props> = ({ data }) => {
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  const { data: txData } = useQuery<TransactionData>(
    ['transaction', selectedTx],
    () => selectedTx ? getTransactionDetails(selectedTx) : Promise.reject('No transaction selected'),
    { enabled: !!selectedTx }
  );

  const formatZEC = (value: string) => {
    const amount = parseInt(value) / 100000000; // Convert from zatoshi to ZEC
    return amount.toFixed(8);
  };

  const getEventType = (effect: string) => {
    return effect.startsWith('+') ? 'incoming' : 'outgoing';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg">
            <Wallet className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Wallet Overview</h2>
            <p className="text-sm text-gray-500">{data.address.address}</p>
          </div>
        </div>
        <div className="mt-6">
          <div className="text-2xl font-bold text-gray-900">
            {formatZEC(data.balances['zcash-main'].zcash.balance)} ZEC
          </div>
          <p className="text-sm text-gray-500 mt-1">Current Balance</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {data.events['zcash-main'].map((event: WalletEvent) => (
            <div key={`${event.transaction}-${event.sort_key}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getEventType(event.effect) === 'incoming' ? (
                  <ArrowDownRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {getEventType(event.effect) === 'incoming' ? 'Received' : 'Sent'} {formatZEC(event.effect.replace('+', '').replace('-', ''))} ZEC
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(event.time), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(event.transaction)}
                className="text-purple-600 hover:text-purple-700 text-sm"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {txData && (
        <TransactionDetails
          data={txData}
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};