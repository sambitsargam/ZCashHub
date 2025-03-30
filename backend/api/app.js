require('dotenv').config();
const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cors = require('cors');
const app = express();
app.use(express.json()); // To parse JSON request bodies
app.use(cors()); // Enable CORS for all routes
const port = process.env.PORT || 3000;

// Firebase URL for alert subscriptions.
const firebaseAlertsUrl = process.env.FIREBASE_ALERTS_URL || 'https://zcash-f9192-default-rtdb.firebaseio.com/alerts.json';

// Object to store the last seen transaction for each subscription (keyed by Firebase ID).
const lastTransactionMap = {};

// Set up Nodemailer transporter for email alerts.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Set up Twilio client for WhatsApp alerts.
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Sends an email alert about a new transaction using an HTML template.
 * @param {Object} subscription - The subscription object containing the email.
 * @param {Object} transactionData - The transaction details.
 */
function sendEmailAlert(subscription, transactionData) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #333;">Zcash Wallet Transaction Alert</h2>
      <p>Hello,</p>
      <p>A new transaction has been detected for your wallet <strong>${subscription.address}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Field</th>
          <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Value</th>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Transaction ID</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${transactionData.txid}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Value</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${transactionData.value}</td>
        </tr>
      </table>
      <p>For more details, please check your dashboard.</p>
      <p>Thank you for using our service!</p>
      <p>Best regards,<br/>Zcash Alert Service Team</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: subscription.email,
    subject: 'New Zcash Transaction Alert',
    html: htmlContent
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
 * @param {Object} subscription - The subscription object containing the WhatsApp number.
 * @param {Object} transactionData - The transaction details.
 */
function sendWhatsappAlert(subscription, transactionData) {
  twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    body: `Alert: New transaction for wallet ${subscription.address}.\nTransaction ID: ${transactionData.txid}\nValue: ${transactionData.value}`,
    to: `whatsapp:${subscription.whatsapp}`
  })
    .then(message => console.log('WhatsApp message sent: ', message.sid))
    .catch(error => console.error('Error sending WhatsApp message: ', error));
}

/**
 * Checks for new transactions for a given subscription.
 * @param {String} subscriptionId - The unique subscription key from Firebase.
 * @param {Object} subscription - The subscription object containing address, email, minValue, and whatsapp.
 */

async function checkSubscription(subscriptionId, subscription) {
  const walletAddress = subscription.address;
  const apiUrl = `https://sandbox-api.3xpl.com/zcash/address/${walletAddress}?data=address,balances,events,mempool&from=all`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    const transactions = data.data.events["zcash-main"] || [];
    if (transactions.length === 0) {
      console.log(`No transactions found for wallet ${walletAddress}`);
      return;
    }

    const latestTransaction = transactions[0]; 
    const txid = latestTransaction.transaction;
    const txValue = parseFloat(latestTransaction.effect.replace("+", "").replace("-", "")) / 1e8; 

    if (!lastTransactionMap[subscriptionId]) {
      lastTransactionMap[subscriptionId] = txid;
      console.log(`Initialized wallet ${walletAddress} with transaction: ${txid}`);
      return;
    }

    if (txid !== lastTransactionMap[subscriptionId]) {
      const minValue = parseFloat(subscription.minValue || 0);
      if (txValue >= minValue) {
        console.log(`New transaction detected for ${walletAddress}: ${txid}`);
        lastTransactionMap[subscriptionId] = txid;

        sendEmailAlert(subscription, { txid, value: txValue });
        sendWhatsappAlert(subscription, { txid, value: txValue });
      } else {
        console.log(`Transaction ${txid} does not meet minValue ${minValue}. Value: ${txValue}`);
        lastTransactionMap[subscriptionId] = txid;
      }
    }
  } catch (error) {
    console.error(`Error fetching data for wallet ${walletAddress}:`, error.response?.data || error.message);
  }
}

    

/**
 * Fetches alert subscriptions from Firebase and checks transactions for each.
 */
async function checkAllSubscriptions() {
  try {
    const response = await axios.get(firebaseAlertsUrl);
    const subscriptionsData = response.data;

    if (!subscriptionsData) {
     // console.log('No subscriptions found in Firebase.');
      return;
    }

    // Iterate over each subscription from Firebase.
    for (const subscriptionId in subscriptionsData) {
      if (subscriptionsData.hasOwnProperty(subscriptionId)) {
        const subscription = subscriptionsData[subscriptionId];
        await checkSubscription(subscriptionId, subscription);
      }
    }
  } catch (error) {
    console.error('Error fetching alert subscriptions:', error.message);
  }
}

// Poll every 6 seconds to check for new transactions.
setInterval(checkAllSubscriptions, 6000);

/**
 * Registration endpoint:
 * Accepts a JSON body with 'email' and 'whatsapp' fields, then sends
 * a confirmation email and WhatsApp message to confirm successful registration.
 */
app.post('/register', async (req, res) => {
  const { email, whatsapp } = req.body;
  if (!email || !whatsapp) {
    return res.status(400).json({ error: 'Email and WhatsApp number are required.' });
  }
  try {
    // Prepare registration email content.
    const registrationHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Registration Successful</h2>
        <p>Hello,</p>
        <p>You have successfully registered with <strong>Zcash Monitor</strong>.</p>
        <p>Thank you for joining us. We will keep you updated with the latest alerts and insights from your wallet.</p>
        <p>Best regards,<br/>Zcash Alert Service Team</p>
      </div>
    `;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Registration Confirmation for Zcash Monitor',
      html: registrationHtml
    };

    // Send the confirmation email.
    await transporter.sendMail(mailOptions);

    // Send the confirmation WhatsApp message.
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      body: 'Registration Successful: You have successfully registered with the Zcash Monitor. Thank you for joining us!',
      to: `whatsapp:${whatsapp}`
    });

    return res.status(200).json({ message: 'Registration confirmation sent via email and WhatsApp.' });
  } catch (error) {
    console.error('Error in registration:', error);
    return res.status(500).json({ error: 'Error during registration process.' });
  }
});

// Health check endpoint.
app.get('/', (req, res) => {
  res.send('Zcash Wallet Alert Service with Firebase subscriptions is running.');
});

// Start Express server.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

module.exports = app;