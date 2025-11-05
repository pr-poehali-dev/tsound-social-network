import json
import hashlib
import uuid
import os
from typing import Dict, Any
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handle user authentication - login and registration
    Args: event with httpMethod (POST), body with username/email/password
    Returns: Session ID and user data on success
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action', 'login')
    
    database_url = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        if action == 'register':
            username = body_data.get('username')
            password = body_data.get('password')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username and password required'})
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            session_id = str(uuid.uuid4())
            avatar_url = f'https://api.dicebear.com/7.x/avataaars/svg?seed={username}'
            
            cur.execute(
                "SELECT id FROM t_p95121472_tsound_social_networ.users WHERE username = %s",
                (username,)
            )
            if cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username already exists'})
                }
            
            cur.execute(
                """INSERT INTO t_p95121472_tsound_social_networ.users 
                   (session_id, username, avatar_url, password_hash, status, last_seen) 
                   VALUES (%s, %s, %s, %s, 'online', NOW()) 
                   RETURNING id""",
                (session_id, username, avatar_url, password_hash)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'sessionId': session_id,
                    'username': username,
                    'userId': user_id,
                    'avatarUrl': avatar_url
                })
            }
        
        elif action == 'login':
            username = body_data.get('username')
            password = body_data.get('password')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username and password required'})
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute(
                """SELECT id, session_id, username, avatar_url 
                   FROM t_p95121472_tsound_social_networ.users 
                   WHERE username = %s AND password_hash = %s""",
                (username, password_hash)
            )
            user = cur.fetchone()
            
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'})
                }
            
            user_id, session_id, username, avatar_url = user
            
            cur.execute(
                "UPDATE t_p95121472_tsound_social_networ.users SET status = 'online', last_seen = NOW() WHERE id = %s",
                (user_id,)
            )
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'sessionId': session_id,
                    'username': username,
                    'userId': user_id,
                    'avatarUrl': avatar_url
                })
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Endpoint not found'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }