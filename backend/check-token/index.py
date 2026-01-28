import json
import os
import base64
import urllib.request
import urllib.parse
from typing import Any


def get_access_token(service_account_json: dict) -> str:
    """Получает access token через JWT"""
    import time
    from Crypto.PublicKey import RSA
    from Crypto.Signature import pkcs1_15
    from Crypto.Hash import SHA256
    
    now = int(time.time())
    
    header = {"alg": "RS256", "typ": "JWT"}
    claim = {
        "iss": service_account_json["client_email"],
        "scope": "https://www.googleapis.com/auth/spreadsheets.readonly",
        "aud": "https://oauth2.googleapis.com/token",
        "exp": now + 3600,
        "iat": now
    }
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    claim_b64 = base64.urlsafe_b64encode(json.dumps(claim).encode()).decode().rstrip('=')
    message = f"{header_b64}.{claim_b64}"
    
    key = RSA.import_key(service_account_json["private_key"])
    h = SHA256.new(message.encode())
    signature = pkcs1_15.new(key).sign(h)
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    jwt_token = f"{message}.{signature_b64}"
    
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
    Проверяет валидность токена в Google Таблице.
    Принимает token в query параметрах, возвращает статус валидности.
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    service_account_json_str = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64')
    
    if service_account_json_str:
        try:
            service_account_json_str = base64.b64decode(service_account_json_str).decode('utf-8')
        except Exception as e:
            print(f"[ERROR] Failed to decode base64: {e}")
    else:
        service_account_json_str = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    
    spreadsheet_id = os.environ.get('GOOGLE_SPREADSHEET_ID')
    sheet_name = os.environ.get('GOOGLE_SHEET_NAME', 'Links')
    
    if not service_account_json_str or not spreadsheet_id:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Service Account not configured',
                'valid': False
            }),
            'isBase64Encoded': False
        }
    
    try:
        query_params = event.get('queryStringParameters') or {}
        token = query_params.get('token', '')
        
        if not token:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Token is required', 'valid': False}),
                'isBase64Encoded': False
            }
        
        service_account_json = json.loads(service_account_json_str)
        access_token = get_access_token(service_account_json)
        
        range_notation = f'{sheet_name}!A:B'
        url = f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{urllib.parse.quote(range_notation)}'
        
        req = urllib.request.Request(
            url,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        values = data.get('values', [])
        is_valid = False
        
        for row in values:
            if len(row) >= 2:
                link = row[0]
                status = row[1]
                
                link_token = None
                if '?token=' in link:
                    link_token = link.split('?token=')[1].split('&')[0]
                elif '&token=' in link:
                    link_token = link.split('&token=')[1].split('&')[0]
                
                if link_token == token and status == 'new':
                    is_valid = True
                    break
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'valid': is_valid, 'token': token}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"[ERROR] Exception: {type(e).__name__}: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'type': type(e).__name__,
                'valid': False
            }),
            'isBase64Encoded': False
        }