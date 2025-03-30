import os
import json
import logging
import io
from flask import Flask, request, jsonify
from contextlib import redirect_stdout
import openai
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables from .env (or your environment)
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("Please set your OPENAI_API_KEY environment variable")
openai.api_key = OPENAI_API_KEY

# Twilio configuration for WhatsApp
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM")  # e.g. "whatsapp:+14155238886"
if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM):
    logging.warning("Twilio credentials not fully set. WhatsApp functionality may not work.")
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN) else None

# Import your AIAgent class from ai_agent.py
from ai_agent import AIAgent

# Initialize your NEAR agent with the account file (set NEAR_ACCOUNT_FILE in your environment)
NEAR_ACCOUNT_FILE = os.getenv("NEAR_ACCOUNT_FILE", "./account_file.json")
try:
    agent = AIAgent(NEAR_ACCOUNT_FILE)
except Exception as e:
    logging.error("Failed to initialize AIAgent: %s", e)
    raise

def interpret_command(command_text: str) -> dict:
    """
    Uses the OpenAI API to extract an intent from a natural language command.
    Expected JSON output is of the form:
      {
        "action": "deposit" | "swap",
        "params": {
            "amount": <NEAR amount>,
            "target_token": <token symbol>   // only for swap
        }
      }
    """
    prompt = (
        "Extract the intent from the following command and output a JSON "
        "object with the keys 'action' and 'params'. The possible actions are "
        "'deposit' and 'swap'. For a deposit, include 'amount' (in NEAR). "
        "For a swap, include 'target_token' (e.g., 'ZCASH') and 'amount' (NEAR amount to swap).\n\n"
        f"Command: {command_text}\n\nOutput:"
    )
    try:
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=150,
            temperature=0,
            n=1,
            stop=["\n"]
        )
        result_text = response.choices[0].text.strip()
        command_data = json.loads(result_text)
        return command_data
    except Exception as e:
        logging.error("Error interpreting command: %s", e)
        return {}

def process_command(command_text: str) -> str:
    """
    Processes the given command:
    - Uses OpenAI to interpret the command.
    - Executes the corresponding action (deposit or swap) via the AIAgent.
    - Captures all printed output (from both your code and near_intents.py)
      so that every print message is included in the response.
    Returns:
        A string with all the captured output.
    """
    output_capture = io.StringIO()
    with redirect_stdout(output_capture):
        print(f"Processing command: {command_text}")
        command_data = interpret_command(command_text)
        if not command_data or "action" not in command_data:
            print("Could not interpret command.")
            return output_capture.getvalue()
        action = command_data["action"].lower()
        if action == "deposit":
            try:
                amount = float(command_data.get("params", {}).get("amount", 0))
            except ValueError:
                amount = 0
            if amount <= 0:
                print("Invalid deposit amount provided.")
            else:
                print(f"Executing deposit of {amount} NEAR.")
                try:
                    agent.deposit_near(amount)
                    print("Deposit executed successfully.")
                except Exception as e:
                    print(f"Error during deposit: {e}")
        elif action == "swap":
            params = command_data.get("params", {})
            target_token = params.get("target_token")
            try:
                amount = float(params.get("amount", 0))
            except ValueError:
                amount = 0
            if not target_token or amount <= 0:
                print("Invalid swap parameters provided.")
            else:
                print(f"Executing swap of {amount} NEAR to {target_token}.")
                try:
                    swap_response = agent.swap_near_to_token(target_token, amount)
                    print("Swap executed successfully. Response:")
                    print(json.dumps(swap_response, indent=2))
                except Exception as e:
                    print(f"Error during swap: {e}")
        else:
            print("Unknown action specified.")
    return output_capture.getvalue()

def send_whatsapp_message(to_number: str, message_body: str):
    """
    Sends a WhatsApp message using Twilio's API.
    """
    if not twilio_client:
        logging.error("Twilio client not configured.")
        return None
    try:
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_FROM,
            to=to_number  # e.g., "whatsapp:+1234567890"
        )
        logging.info("WhatsApp message sent. SID: %s", message.sid)
        return message.sid
    except Exception as e:
        logging.error("Failed to send WhatsApp message: %s", e)
        return None

@app.route("/agent/command", methods=["POST"])
def handle_command():
    """
    This endpoint is for commands coming from your chat UI.
    Expects a JSON payload with:
      - "command": the natural language command.
      - (Optional) "channel": "ui" or "whatsapp".
      - (For WhatsApp channel) "from": recipient WhatsApp number.
    If the channel is WhatsApp, the response will be sent via Twilio.
    Otherwise, a JSON response is returned.
    """
    data = request.get_json()
    if not data or "command" not in data:
        return jsonify({"error": "Missing 'command' parameter"}), 400

    command_text = data["command"]
    channel = data.get("channel", "ui").lower()
    logging.info("Received command via %s: %s", channel, command_text)
    output = process_command(command_text)
    
    if channel == "whatsapp":
        to_number = data.get("from")
        if not to_number:
            return jsonify({"error": "Missing 'from' parameter for WhatsApp channel"}), 400
        send_whatsapp_message(to_number, output)
        return jsonify({"status": "WhatsApp message sent", "output": output})
    else:
        return jsonify({"status": "OK", "output": output})

@app.route("/whatsapp/inbound", methods=["POST"])
def whatsapp_inbound():
    """
    This endpoint serves as the Twilio webhook for inbound WhatsApp messages.
    It reads the message (from the "Body" field) and sender's number ("From"),
    processes the command, and replies with the output via TwiML.
    """
    command_text = request.form.get("Body", "")
    from_number = request.form.get("From", "")
    logging.info("Received WhatsApp message from %s: %s", from_number, command_text)
    output = process_command(command_text)
    resp = MessagingResponse()
    resp.message(output)
    return str(resp)

@app.route("/agent/status", methods=["GET"])
def agent_status():
    """
    Returns the current state of the NEAR account (e.g., balance).
    """
    try:
        state = agent.account.state()
        balance = float(state.get("amount", 0)) / 10**24 if state.get("amount") else 0
        return jsonify({"account_id": agent.account.account_id, "balance_NEAR": balance})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run the Flask app on port 5000 (or change as needed)
    app.run(host="0.0.0.0", port=5000, debug=True)
