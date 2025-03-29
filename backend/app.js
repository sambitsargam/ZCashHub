require('dotenv').config();
const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

// Configure the wallet address and API URL.
const walletAddress = process.env.WALLET_ADDRESS; // e.g., "t1XYZ..."
const zcashWalletApi = `https://sandbox-api.3xpl.com/zcash/address/${walletAddress}`;

// Variable to keep track of the latest transaction seen.
let lastTransactionId = null;

// Set up the Nodemailer transporter.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false otherwise
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Set up the Twilio client.
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Sends an email alert about a new transaction.
 * @param {Object} transactionData - The transaction details.
 */
function sendEmailAlert(transactionData) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: 'New Zcash Transaction Alert',
    text: `A new transaction was detected:\n\n${JSON.stringify(transactionData, null, 2)}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email: ', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

/**
 * Sends a WhatsApp alert using Twilio.
 * @param {Object} transactionData - The transaction details.
 */
function sendWhatsappAlert(transactionData) {
  twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    body: `New Zcash Transaction Detected: ${transactionData.txid}`,
    to: `whatsapp:${process.env.TWILIO_WHATSAPP_TO}`
  })
    .then(message => console.log('WhatsApp message sent: ', message.sid))
    .catch(error => console.error('Error sending WhatsApp message: ', error));
}

/**
 * Polls the wallet API and checks for new transactions.
 */
async function checkForNewTransactions() {
  try {
    const response = await axios.get(zcashWalletApi);
    const data = response.data;
    // Assume the API returns an array called "transactions"
    const transactions = data.transactions || [];
    
    if (transactions.length === 0) {
      console.log('No transactions found.');
      return;
    }
    
    // Assume the first transaction in the array is the latest.
    const latestTransaction = transactions[0];
    
    // If a new transaction is found, update the lastTransactionId and send alerts.
    if (latestTransaction.txid !== lastTransactionId) {
      console.log('New transaction detected:', latestTransaction.txid);
      lastTransactionId = latestTransaction.txid;
      sendEmailAlert(latestTransaction);
      sendWhatsappAlert(latestTransaction);
    }
  } catch (error) {
    console.error('Error fetching wallet data:', error.message);
  }
}

// Poll every 6 seconds.
setInterval(checkForNewTransactions, 6000);

// Health check endpoint.
app.get('/', (req, res) => {
  res.send('Zcash Wallet Alert Service is running.');
});

// Start Express server.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
