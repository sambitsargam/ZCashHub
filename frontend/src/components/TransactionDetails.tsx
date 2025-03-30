import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownRight, Clock, Hash, Database } from 'lucide-react';
import { format } from 'date-fns';
import { TransactionData } from '../types/api';

interface Props {
  data: TransactionData;
  onClose: () => void;
  isOpen: boolean;
}

export const TransactionDetails: React.FC<Props> = ({ data, onClose, isOpen }) => {
  const formatZEC = (value: string) => {
    const amount = parseInt(value) / 100000000;
    return amount.toFixed(8);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash className="h-5 w-5" />
                  <span className="font-medium">Transaction Hash:</span>
                  <span className="font-mono text-sm">{data.transaction.transaction}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Timestamp:</span>
                  <span>{format(new Date(data.transaction.time), 'PPpp')}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Database className="h-5 w-5" />
                  <span className="font-medium">Block:</span>
                  <span>{data.transaction.block}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Events</h3>
                <div className="space-y-3">
                  {data.events['zcash-main'].map((event, index) => (
                    <motion.div
                      key={`${event.address}-${event.sort_key}`}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {event.effect.startsWith('+') ? (
                          <ArrowDownRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatZEC(event.effect.replace('+', '').replace('-', ''))} ZEC
                          </div>
                          <div className="text-xs text-gray-500">{event.address}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};