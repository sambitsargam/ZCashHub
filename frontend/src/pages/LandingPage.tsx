/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Bell, ArrowRight, Bot, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative z-10 py-24 lg:py-40">
            <motion.div variants={itemVariants} className="text-center">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8">
                Your Smart Gateway to <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                  Zcash Trading
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-12">
                Get AI-powered insights, real-time alerts, and smart swap recommendations for your Zcash portfolio.
              </p>
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <button
                  onClick={() => navigate('/insights')}
                  className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                >
                  Start Trading
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/ai-agent')}
                  className="inline-flex items-center px-8 py-4 rounded-lg border-2 border-purple-600 text-purple-600 font-semibold hover:bg-purple-50 transition-all transform hover:scale-105"
                >
                  Chat with AI
                  <Bot className="ml-2 h-5 w-5" />
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Animated Background Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 overflow-hidden"
        >
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-purple-200 via-transparent to-transparent rounded-full" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-indigo-200 via-transparent to-transparent rounded-full" />
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose ZcashHub?</h2>
            <p className="text-xl text-gray-600">
              Your all-in-one platform for secure and intelligent Zcash trading
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              variants={itemVariants}
              className="p-8 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-sm transform hover:scale-105 transition-all"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">AI Trading Assistant</h3>
              <p className="text-gray-600">
                Get personalized trading insights and recommendations from our smart AI agent.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-8 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm transform hover:scale-105 transition-all"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Smart Swaps</h3>
              <p className="text-gray-600">
                Execute trades at optimal times with AI-powered market analysis and timing recommendations.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-8 bg-gradient-to-br from-green-50 to-white rounded-xl shadow-sm transform hover:scale-105 transition-all"
            >
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Bell className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Instant Alerts</h3>
              <p className="text-gray-600">
                Stay informed with real-time WhatsApp and email notifications for important wallet events.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={itemVariants}>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Elevate Your Zcash Trading?
            </h2>
            <p className="text-xl text-purple-100 mb-12">
              Join ZcashHub today and experience the power of AI-driven trading insights.
            </p>
            <button
              onClick={() => navigate('/ai-agent')}
              className="inline-flex items-center px-8 py-4 rounded-lg bg-white text-purple-600 font-semibold hover:bg-purple-50 transition-all transform hover:scale-105"
            >
              Start Trading Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};