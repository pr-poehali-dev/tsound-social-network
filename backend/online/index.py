import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Track online users and return count
    Args: event with httpMethod, body, headers
    Returns: Online users count
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        session_id = body_data.get('sessionId')
        
        if not session_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'sessionId required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO users (session_id, last_seen) VALUES (%s, NOW()) "
            "ON CONFLICT (session_id) DO UPDATE SET last_seen = NOW()",
            (session_id,)
        )
        conn.commit()
    
    threshold = datetime.now() - timedelta(minutes=5)
    cur.execute(
        "SELECT COUNT(*) as count FROM users WHERE last_seen > %s",
        (threshold,)
    )
    result = cur.fetchone()
    online_count = result['count'] if result else 0
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'onlineUsers': online_count}),
        'isBase64Encoded': False
    }
