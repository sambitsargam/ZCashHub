import React from 'react';
import { AlertSubscription } from '../components/AlertSubscription';

export const AlertsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Wallet Alerts</h1>
        <p className="mt-2 text-gray-600">
          Set up notifications for important wallet events via WhatsApp and email
        </p>
      </div>
      <AlertSubscription />
    </div>
  );
};