'''
Business: Универсальный API для мессенджера - отправка/получение сообщений, управление чатами, онлайн пользователи
Args: event - dict с httpMethod, path, queryStringParameters, body
Returns: HTTP response с данными в зависимости от endpoint
'''

import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if method == 'GET':
        if action == 'messages':
            chat_id = params.get('chat_id')
            if not chat_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'chat_id is required'})
                }
            
            cur.execute(
                "SELECT id, chat_id, sender_id, content, photo_url, is_read, created_at FROM messages WHERE chat_id = %s ORDER BY created_at ASC",
                (chat_id,)
            )
            rows = cur.fetchall()
            messages = [{
                'id': r[0], 'chat_id': r[1], 'sender_id': r[2], 'content': r[3],
                'photo_url': r[4], 'is_read': r[5], 'created_at': r[6].isoformat() if r[6] else None
            } for r in rows]
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(messages)
            }
        
        elif action == 'online':
            online_threshold = datetime.now() - timedelta(minutes=5)
            cur.execute(
                "SELECT id, session_id, username, avatar_url, status, last_seen FROM users WHERE last_seen > %s OR status = %s ORDER BY last_seen DESC",
                (online_threshold, 'online')
            )
            rows = cur.fetchall()
            users = [{
                'id': r[0], 'session_id': r[1], 'username': r[2] or f'User_{r[0]}',
                'avatar_url': r[3], 'status': r[4] or 'online', 'last_seen': r[5].isoformat() if r[5] else None
            } for r in rows]
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(users)
            }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        if action == 'send':
            chat_id = body_data.get('chat_id')
            sender_id = body_data.get('sender_id')
            content = body_data.get('content', '')
            photo_url = body_data.get('photo_url')
            
            if not chat_id or not sender_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'chat_id and sender_id required'})
                }
            
            message_id = f"msg_{datetime.now().timestamp()}"
            cur.execute(
                "INSERT INTO messages (id, chat_id, sender_id, content, photo_url, is_read, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, chat_id, sender_id, content, photo_url, is_read, created_at",
                (message_id, chat_id, str(sender_id), content, photo_url, False, datetime.now())
            )
            row = cur.fetchone()
            message = {
                'id': row[0], 'chat_id': row[1], 'sender_id': row[2], 'content': row[3],
                'photo_url': row[4], 'is_read': row[5], 'created_at': row[6].isoformat() if row[6] else None
            }
            conn.commit()
            conn.close()
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(message)
            }
        
        elif action == 'chat':
            user1_id = body_data.get('user1_id')
            user2_id = body_data.get('user2_id')
            
            if not user1_id or not user2_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'user1_id and user2_id required'})
                }
            
            cur.execute(
                "SELECT id, user1_id, user2_id, created_at FROM chats WHERE (user1_id = %s AND user2_id = %s) OR (user1_id = %s AND user2_id = %s)",
                (str(user1_id), str(user2_id), str(user2_id), str(user1_id))
            )
            row = cur.fetchone()
            
            if row:
                chat = {
                    'id': row[0], 'user1_id': row[1], 'user2_id': row[2],
                    'created_at': row[3].isoformat() if row[3] else None
                }
            else:
                chat_id = f"chat_{user1_id}_{user2_id}"
                cur.execute(
                    "INSERT INTO chats (id, user1_id, user2_id, created_at) VALUES (%s, %s, %s, %s) RETURNING id, user1_id, user2_id, created_at",
                    (chat_id, str(user1_id), str(user2_id), datetime.now())
                )
                row = cur.fetchone()
                chat = {
                    'id': row[0], 'user1_id': row[1], 'user2_id': row[2],
                    'created_at': row[3].isoformat() if row[3] else None
                }
                conn.commit()
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(chat)
            }
        
        elif action == 'update_user':
            user_id = body_data.get('user_id')
            username = body_data.get('username')
            avatar_url = body_data.get('avatar_url')
            status = body_data.get('status', 'online')
            
            if not user_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'user_id required'})
                }
            
            updates = []
            values = []
            
            if username is not None:
                updates.append("username = %s")
                values.append(username)
            if avatar_url is not None:
                updates.append("avatar_url = %s")
                values.append(avatar_url)
            if status is not None:
                updates.append("status = %s")
                values.append(status)
            
            updates.append("last_seen = %s")
            values.append(datetime.now())
            values.append(int(user_id))
            
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, session_id, username, avatar_url, status, last_seen"
            cur.execute(query, values)
            row = cur.fetchone()
            
            if not row:
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'User not found'})
                }
            
            user = {
                'id': row[0], 'session_id': row[1], 'username': row[2],
                'avatar_url': row[3], 'status': row[4], 'last_seen': row[5].isoformat() if row[5] else None
            }
            conn.commit()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(user)
            }
    
    conn.close()
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Invalid action'})
    }
