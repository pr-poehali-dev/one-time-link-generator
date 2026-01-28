import json
import os
import time
import base64
import hashlib
import hmac
import urllib.request
import urllib.parse
from typing import Any


def create_jwt(service_account_json: dict, scope: str) -> str:
    """Создает JWT токен для Google OAuth2"""
    now = int(time.time())
    
    header = {
        "alg": "RS256",
        "typ": "JWT"
    }
    
    claim = {
        "iss": service_account_json["client_email"],
        "scope": scope,
        "aud": "https://oauth2.googleapis.com/token",
        "exp": now + 3600,
        "iat": now
    }
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    claim_b64 = base64.urlsafe_b64encode(json.dumps(claim).encode()).decode().rstrip('=')
    
    message = f"{header_b64}.{claim_b64}"
    
    from Crypto.PublicKey import RSA
    from Crypto.Signature import pkcs1_15
    from Crypto.Hash import SHA256
    
    key = RSA.import_key(service_account_json["private_key"])
    h = SHA256.new(message.encode())
    signature = pkcs1_15.new(key).sign(h)
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    return f"{message}.{signature_b64}"


def get_access_token(service_account_json: dict) -> str:
    """Получает access token через JWT"""
    scope = "https://www.googleapis.com/auth/spreadsheets"
    jwt_token = create_jwt(service_account_json, scope)
    
    data = urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt_token
    }).encode()
    
    req = urllib.request.Request(
        'https://oauth2.googleapis.com/token',
        data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        return result['access_token']


def handler(event: dict, context: Any) -> dict:
    """
    Добавляет сгенерированную ссылку в Google Таблицу через Service Account.
    Принимает URL ссылки и статус, добавляет новую строку в таблицу.
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    service_account_json_str = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    spreadsheet_id = os.environ.get('GOOGLE_SPREADSHEET_ID')
    sheet_name = os.environ.get('GOOGLE_SHEET_NAME', 'Links')
    
    print(f"[DEBUG] Service Account exists: {bool(service_account_json_str)}")
    print(f"[DEBUG] Spreadsheet ID: {spreadsheet_id}")
    print(f"[DEBUG] Sheet name: {sheet_name}")
    
    if not service_account_json_str or not spreadsheet_id:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Google Service Account not configured',
                'details': 'Please set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SPREADSHEET_ID'
            }),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        link = body.get('link')
        status = body.get('status', 'new')
        
        print(f"[DEBUG] Link: {link}")
        print(f"[DEBUG] Status: {status}")
        
        if not link:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Link is required'}),
                'isBase64Encoded': False
            }
        
        print(f"[DEBUG] Raw service account string (first 200 chars): {service_account_json_str[:200]}")
        
        try:
            service_account_json = json.loads(service_account_json_str)
        except json.JSONDecodeError as je:
            print(f"[ERROR] First JSON parse failed: {je}")
            cleaned = service_account_json_str.strip()
            
            if cleaned.startswith('"') and cleaned.endswith('"'):
                print("[DEBUG] Removing outer quotes...")
                cleaned = cleaned[1:-1]
            
            cleaned = cleaned.replace('\\"', '"')
            cleaned = cleaned.replace('\\n', '\n')
            
            print(f"[DEBUG] Cleaned string (first 200 chars): {cleaned[:200]}")
            service_account_json = json.loads(cleaned)
        
        print(f"[DEBUG] Service account email: {service_account_json.get('client_email')}")
        
        print("[DEBUG] Getting access token...")
        access_token = get_access_token(service_account_json)
        print(f"[DEBUG] Access token received: {access_token[:20]}...")
        
        range_notation = f'{sheet_name}!A:B'
        url = f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{urllib.parse.quote(range_notation)}:append?valueInputOption=RAW'
        print(f"[DEBUG] API URL: {url}")
        
        data = {
            'values': [[link, status]]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            },
            method='POST'
        )
        
        print("[DEBUG] Sending request to Google Sheets API...")
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f"[DEBUG] Success! Response: {result}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Link added to Google Sheet',
                'result': result
            }),
            'isBase64Encoded': False
        }
        
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"[ERROR] HTTP Error {e.code}: {error_body}")
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Google Sheets API error',
                'details': error_body,
                'status_code': e.code
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f"[ERROR] Exception: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'type': type(e).__name__
            }),
            'isBase64Encoded': False
        }