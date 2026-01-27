import json
import os
import urllib.request
import urllib.parse
from typing import Any


def handler(event: dict, context: Any) -> dict:
    """
    Добавляет сгенерированную ссылку в Google Таблицу.
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
    
    api_key = os.environ.get('GOOGLE_API_KEY')
    spreadsheet_id = os.environ.get('GOOGLE_SPREADSHEET_ID')
    sheet_name = os.environ.get('GOOGLE_SHEET_NAME', 'Links')
    
    if not api_key or not spreadsheet_id:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Google API credentials not configured',
                'details': 'Please set GOOGLE_API_KEY and GOOGLE_SPREADSHEET_ID'
            }),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        link = body.get('link')
        status = body.get('status', 'new')
        
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
        
        range_notation = f'{sheet_name}!A:B'
        url = f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{urllib.parse.quote(range_notation)}:append'
        
        params = {
            'valueInputOption': 'RAW',
            'key': api_key
        }
        url_with_params = f'{url}?{urllib.parse.urlencode(params)}'
        
        data = {
            'values': [[link, status]]
        }
        
        req = urllib.request.Request(
            url_with_params,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
        
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
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Google Sheets API error',
                'details': error_body
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
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
