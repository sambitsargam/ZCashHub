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

  const calculateTotals = () => {
    let totalSent = 0;
    let totalReceived = 0;

    data.events['zcash-main'].forEach(event => {
      const amount = parseInt(event.effect);
      if (amount > 0) {
        totalReceived += amount;
      } else {
        totalSent += Math.abs(amount);
      }
    });

    return {
      sent: formatZEC(totalSent.toString()),
      received: formatZEC(totalReceived.toString()),
      fee: formatZEC((totalSent - totalReceived).toString())
    };
  };

  const totals = calculateTotals();

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-green-50 p-4 rounded-lg"
                >
                  <h3 className="text-sm font-medium text-green-800 mb-2">Total Received</h3>
                  <p className="text-2xl font-bold text-green-600">{totals.received} ZEC</p>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-red-50 p-4 rounded-lg"
                >
                  <h3 className="text-sm font-medium text-red-800 mb-2">Total Spend</h3>
                  <p className="text-2xl font-bold text-red-600">{totals.sent} ZEC</p>
                </motion.div>

                {/* <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-purple-50 p-4 rounded-lg"
                >
                  <h3 className="text-sm font-medium text-purple-800 mb-2">Network Fee</h3>
                  <p className="text-2xl font-bold text-purple-600">{totals.fee} ZEC</p> 
                </motion.div>  */}
              </div>

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