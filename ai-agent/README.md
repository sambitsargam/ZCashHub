# NEAR Intent API Agent with OpenAI & Twilio WhatsApp Integration

This project provides a Flask-based API that integrates NEAR blockchain intent functions with OpenAI natural language processing and Twilio WhatsApp messaging. The API allows you to send natural language commands (e.g., deposit or swap NEAR tokens) via your chat UI or directly via WhatsApp. The API then processes these commands using the OpenAI API, executes the appropriate NEAR intents, and returns all printed output as the response.

## Table of Contents

- [Features](#features)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Running the API](#running-the-api)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Notes](#notes)

## Features

- **NEAR Blockchain Intents**: Deposit NEAR tokens and execute token swaps using custom intent functions.
- **Natural Language Command Interpretation**: Leverages OpenAI to parse natural language commands and extract actions and parameters.
- **Twilio WhatsApp Integration**: Supports sending and receiving WhatsApp messages using Twilio.
- **Chat UI Integration**: Exposes endpoints for receiving commands from your custom chat UI.
- **Extensive Logging**: Provides detailed logging for tracing and debugging operations.

## Folder Structure

```
your_project/
├── .env
├── README.md
├── requirements.txt
├── api_agent.py
├── ai_agent.py
└── near_intents.py
```

- **.env**: Contains environment variables (API keys, account file path, Twilio credentials, etc.).
- **README.md**: Project documentation.
- **requirements.txt**: Lists the project dependencies.
- **api_agent.py**: Main API implementation integrating NEAR intents, OpenAI, and Twilio.
- **ai_agent.py**: NEAR intent agent implementation (deposit and swap operations).
- **near_intents.py**: Low-level functions for interacting with the NEAR blockchain and solver bus.

## Prerequisites

- Python 3.7+
- [Pipenv](https://pipenv.pypa.io/) or pip for dependency management
- A NEAR account with a valid account file (e.g., `account_file.json`)
- An OpenAI API key
- Twilio credentials for WhatsApp messaging (Account SID, Auth Token, and a WhatsApp-enabled number)

## Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/sambitsargam/zcashhub.git
   cd zcashhub/ai-agent
   ```

2. **Create and Activate a Virtual Environment (optional):**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install Dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**

   Create a `.env` file in the project root and add your configuration. See the example below:

   ```env
   # NEAR Account and API configuration
   NEAR_ACCOUNT_FILE=./account_file.json

   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here

   # Twilio Credentials for WhatsApp Messaging
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

## Environment Variables

Make sure your `.env` file includes the following variables:

- **NEAR_ACCOUNT_FILE**: Path to your NEAR account JSON file.
- **OPENAI_API_KEY**: Your OpenAI API key.
- **TWILIO_ACCOUNT_SID**: Your Twilio Account SID.
- **TWILIO_AUTH_TOKEN**: Your Twilio Auth Token.
- **TWILIO_WHATSAPP_FROM**: Your Twilio WhatsApp sender number (e.g., `whatsapp:+14155238886`).

## Running the API

To start the Flask API server, run:

```bash
python api_agent.py
```

The server will start on `http://0.0.0.0:5000` (by default port 5000). You can adjust the port if necessary.

## API Endpoints

### 1. `/agent/command` (POST)

**Description:**  
Accepts a JSON payload with a natural language command and processes it.

**Request Body Example:**

```json
{
  "command": "Please deposit 0.05 NEAR into my account.",
  "channel": "ui"
}
```

For WhatsApp, include the `"channel": "whatsapp"` and `"from"` (recipient's number):

```json
{
  "command": "Swap 0.02 NEAR to ZCASH.",
  "channel": "whatsapp",
  "from": "whatsapp:+1234567890"
}
```

**Response:**  
Returns a JSON object with the processing status and the captured output (all printed messages).

### 2. `/whatsapp/inbound` (POST)

**Description:**  
Webhook for inbound WhatsApp messages via Twilio. Processes the incoming message and replies via TwiML.

### 3. `/agent/status` (GET)

**Description:**  
Returns the current NEAR account status, including the account ID and NEAR balance.

**Response Example:**

```json
{
  "account_id": "your_near_account",
  "balance_NEAR": 1.2345
}
```

## Usage Examples

- **Via Chat UI:**  
  Send a POST request to `/agent/command` with the JSON payload containing your natural language command.  
  The API will process the command and return the response in JSON format.

- **Via WhatsApp:**  
  Configure your Twilio webhook to point to `/whatsapp/inbound`.  
  When a user sends a WhatsApp message, the API processes the command and replies with the outcome via WhatsApp.

## Notes

- **Logging:**  
  The API logs detailed information for debugging. Check the console output for trace logs.

- **NEAR Operations:**  
  The `ai_agent.py` and `near_intents.py` files handle NEAR account interactions. Ensure your account has the required balance and credentials.

- **Extensibility:**  
  You can extend the API to handle additional commands or integrate more features as needed.

- **Deployment:**  
  For production deployment, consider using a production-grade WSGI server (e.g., Gunicorn) and secure your API endpoints.
