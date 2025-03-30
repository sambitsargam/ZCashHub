from typing import TypedDict, List, Dict, Union
import borsh_construct
import os
import json
import base64
import base58
import random
import requests
import near_api
import time

MAX_GAS = 300 * 10 ** 12

SOLVER_BUS_URL = "https://solver-relay-v2.chaindefuser.com/rpc"

ASSET_MAP = {
    'USDC': { 
        'token_id': '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
        'omft': 'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near',
        'decimals': 6,
    },
    'NEAR': {
        'token_id': 'wrap.near',
        'decimals': 24,
    },
    'ZCASH': {
        'token_id': 'zec.omft.near',
        'decimals': 8,
    }
}

class Intent(TypedDict):
    intent: str
    diff: Dict[str, str]

class Quote(TypedDict):
    nonce: str
    signer_id: str
    verifying_contract: str
    deadline: str
    intents: List[Intent]

def quote_to_borsh(quote):
    QuoteSchema = borsh_construct.CStruct(
        'nonce' / borsh_construct.String,
        'signer_id' / borsh_construct.String,
        'verifying_contract' / borsh_construct.String,
        'deadline' / borsh_construct.String,
        'intents' / borsh_construct.Vec(borsh_construct.CStruct(
            'intent' / borsh_construct.String,
            'diff' / borsh_construct.HashMap(borsh_construct.String, borsh_construct.String)
        ))
    )
    return QuoteSchema.build(quote)

class AcceptQuote(TypedDict):
    nonce: str
    recipient: str
    message: str

class Commitment(TypedDict):
    standard: str
    payload: Union[AcceptQuote, str]
    signature: str
    public_key: str

class SignedIntent(TypedDict):
    signed: List[Commitment]
    
class PublishIntent(TypedDict):
    signed_data: Commitment
    quote_hashes: List[str]

class NEARAccount:
    def __init__(self, provider, signer, account_id):
        self.provider = provider
        self.signer = signer
        self.account_id = account_id
        self._account = near_api.account.Account(provider, signer, account_id)
    
    def state(self):
        return self.provider.query({
            "request_type": "view_account",
            "finality": "final",
            "account_id": self.account_id
        })
    
    def view_account(self, account_id):
        return self.provider.query({
            "request_type": "view_account",
            "finality": "final",
            "account_id": account_id
        })
    
    def function_call(self, *args, **kwargs):
        return self._account.function_call(*args, **kwargs)
    
    def view_function(self, *args, **kwargs):
        return self._account.view_function(*args, **kwargs)
    
    def register_token_storage(self, token, other_account=None):
        account_id = other_account if other_account else self.account_id
        balance = self.view_function(ASSET_MAP[token]['token_id'], 'storage_balance_of', {'account_id': account_id})['result']
        if not balance:
            print('Register %s for %s storage' % (account_id, token))
            self.function_call(ASSET_MAP[token]['token_id'], 'storage_deposit',
                {"account_id": account_id}, MAX_GAS, 1250000000000000000000)
        return balance

def account(account_path):
    RPC_NODE_URL = 'https://rpc.mainnet.near.org'
    content = json.load(open(os.path.expanduser(account_path), 'r'))
    near_provider = near_api.providers.JsonProvider(RPC_NODE_URL)
    key_pair = near_api.signer.KeyPair(content["private_key"])
    signer = near_api.signer.Signer(content["account_id"], key_pair)
    return NEARAccount(near_provider, signer, content["account_id"])

def get_asset_id(token):
    if token == 'NEAR':
        return 'near'
    elif token == 'USDC':
        return 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
    return 'nep141:%s' % ASSET_MAP[token]['token_id']

def to_decimals(amount, decimals):
    return str(int(amount * 10 ** decimals))

def register_token_storage(account, token, other_account=None):
    return account.register_token_storage(token, other_account)

def sign_quote(account, quote):
    quote_data = quote.encode('utf-8')
    signature = 'ed25519:' + base58.b58encode(account.signer.sign(quote_data)).decode('utf-8')
    public_key = 'ed25519:' + base58.b58encode(account.signer.public_key).decode('utf-8')
    return Commitment(standard="raw_ed25519", payload=quote, signature=signature, public_key=public_key)

def create_token_diff_quote(account, token_in, amount_in, token_out, amount_out):
    nonce = base64.b64encode(random.getrandbits(256).to_bytes(32, byteorder='big')).decode('utf-8')
    
    quote = Quote(
        nonce=nonce,
        signer_id=account.account_id,
        verifying_contract='intents.near',
        deadline=str(int(time.time() * 1000) + 120000),
        intents=[
            Intent(
                intent='token_diff',
                diff={
                    get_asset_id(token_in): '-' + to_decimals(float(amount_in), ASSET_MAP[token_in]['decimals']),
                    get_asset_id(token_out): to_decimals(float(amount_out), ASSET_MAP[token_out]['decimals'])
                }
            )
        ]
    )
    
    return sign_quote(account, json.dumps(quote))

def submit_signed_intent(account, signed_intent):
    account.function_call("intents.near", "execute_intents", signed_intent, MAX_GAS, 0)

def intent_deposit(account, token, amount):
    if token == 'NEAR':
        amount_raw = to_decimals(amount, ASSET_MAP[token]['decimals'])
        print(f"Depositing {amount} NEAR (raw amount: {amount_raw})")
        print("Wrapping NEAR before deposit")
        account.function_call('wrap.near', 'near_deposit', {}, MAX_GAS, int(amount_raw))
        account.function_call('wrap.near', 'ft_transfer_call', {
            "receiver_id": "intents.near",
            "amount": amount_raw,
            "msg": ""
        }, MAX_GAS, 1)
    else:
        amount_raw = to_decimals(amount, ASSET_MAP[token]['decimals'])
        print(f"Depositing {amount} {token} (raw amount: {amount_raw})")
        account.function_call(ASSET_MAP[token]['token_id'], 'ft_transfer_call', {
            "receiver_id": "intents.near",
            "amount": amount_raw,
            "msg": ""
        }, MAX_GAS, 1)

def register_intent_public_key(account):
    account.function_call("intents.near", "add_public_key", {
        "public_key": "ed25519:" + base58.b58encode(account.signer.public_key).decode('utf-8')
    }, MAX_GAS, 1)

class IntentRequest(object):
    def __init__(self, request=None, thread=None, min_deadline_ms=120000):
        self.request = request
        self.thread = thread
        self.min_deadline_ms = min_deadline_ms
        self._asset_in = None
        self._asset_out = None

    def set_asset_in(self, asset_name, amount):
        self._asset_in = {
            "asset": get_asset_id(asset_name),
            "amount": to_decimals(amount, ASSET_MAP[asset_name]['decimals'])
        }
        return self

    def set_asset_out(self, asset_name, amount=None):
        self._asset_out = {
            "asset": get_asset_id(asset_name),
            "amount": to_decimals(amount, ASSET_MAP[asset_name]['decimals']) if amount else None
        }
        return self

    def serialize(self):
        if not self._asset_in or not self._asset_out:
            raise ValueError("Both input and output assets must be specified")
            
        message = {
            "defuse_asset_identifier_in": self._asset_in["asset"],
            "defuse_asset_identifier_out": self._asset_out["asset"],
            "exact_amount_in": self._asset_in["amount"],
            "min_deadline_ms": self.min_deadline_ms
        }
        
        if self._asset_out["amount"] is not None:
            message["exact_amount_out"] = self._asset_out["amount"]
            
        return message

def fetch_options(request):
    rpc_request = {
        "id": "dontcare",
        "jsonrpc": "2.0",
        "method": "quote",
        "params": [request.serialize()]
    }
    print(f"Sending request to solver bus: {json.dumps(rpc_request, indent=2)}")
    response = requests.post(SOLVER_BUS_URL, json=rpc_request)
    response_json = response.json()
    print(f"Received response from solver bus: {json.dumps(response_json, indent=2)}")
    return response_json.get("result", [])

def publish_intent(signed_intent):
    rpc_request = {
        "id": "dontcare",
        "jsonrpc": "2.0",
        "method": "publish_intent",
        "params": [signed_intent]
    }
    response = requests.post(SOLVER_BUS_URL, json=rpc_request)
    return response.json()

def select_best_option(options):
    if not options:
        print("No options available from solver bus")
        return None
        
    print(f"Found {len(options)} options from solver bus")
    best_option = None
    for i, option in enumerate(options):
        print(f"Option {i+1}: {json.dumps(option, indent=2)}")
        if not best_option or float(option.get("amount_out", 0)) > float(best_option.get("amount_out", 0)):
            best_option = option
            
    if best_option:
        print(f"Selected best option: {json.dumps(best_option, indent=2)}")
    return best_option

def intent_swap(account, token_in, amount_in, token_out):
    print(f"\nInitiating swap: {amount_in} {token_in} -> {token_out}")
    print("Checking storage registration...")
    register_token_storage(account, token_in)
    register_token_storage(account, token_out)
    
    request = IntentRequest().set_asset_in(token_in, amount_in).set_asset_out(token_out)
    request_data = request.serialize()
    print(f"Created intent request: {json.dumps(request_data, indent=2)}")
    
    options = fetch_options(request)
    best_option = select_best_option(options)
    
    if not best_option:
        raise ValueError("No valid swap options available from solver bus")
        
    amount_in_decimals = to_decimals(amount_in, ASSET_MAP[token_in]['decimals'])
    print(f"Creating quote for {amount_in} {token_in} ({amount_in_decimals} raw units)")
    
    quote = create_token_diff_quote(account, token_in, amount_in, token_out, best_option['amount_out'])
    print(f"Created quote: {json.dumps(quote, indent=2)}")
    
    signed_intent = PublishIntent(signed_data=quote, quote_hashes=[best_option['quote_hash']])
    print(f"Created signed intent: {json.dumps(signed_intent, indent=2)}")
    
    print("Publishing signed intent to solver bus...")
    response = publish_intent(signed_intent)
    print(f"Received response: {json.dumps(response, indent=2)}")
    
    return response

def intent_withdraw(account, destination_address, token, amount, network='near'):
    nonce = base64.b64encode(random.getrandbits(256).to_bytes(32, byteorder='big')).decode('utf-8')
    quote = Quote(
        signer_id=account.account_id,
        nonce=nonce,
        verifying_contract="intents.testnet",
        deadline="2025-12-31T11:59:59.000Z",
        intents=[
            {
                "intent": "ft_withdraw",
                "token": ASSET_MAP[token]['token_id'],
                "receiver_id": destination_address,
                "amount": to_decimals(amount, ASSET_MAP[token]['decimals'])
            }
        ]
    )
    if network != 'near':
        quote["intents"][0]["token"] = ASSET_MAP[token]['omft']
        quote["intents"][0]["receiver_id"] = ASSET_MAP[token]['omft']
        quote["intents"][0]["memo"] = "WITHDRAW_TO:%s" % destination_address
    signed_quote = sign_quote(account, json.dumps(quote))
    signed_intent = PublishIntent(signed_data=signed_quote, quote_hashes=[])
    return publish_intent(signed_intent)

if __name__ == "__main__":
    # Withdraw to external address example
    account1 = account("<>")
    print(intent_withdraw(account1, "<eth address>", "USDC", 1, network='eth'))
