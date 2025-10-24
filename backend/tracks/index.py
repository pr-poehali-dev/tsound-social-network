'''
Business: Upload and manage music tracks with file storage
Args: event with httpMethod (GET/POST), body with track data
Returns: Track list or upload confirmation
'''

import json
import os
import base64
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Session',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_session = headers.get('x-user-session', headers.get('X-User-Session', 'anonymous'))
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            cur.execute('''
                SELECT 
                    t.id, t.title, t.artist, t.audio_url, t.cover_url, 
                    t.user_session_id, t.likes, t.created_at,
                    COALESCE(json_agg(
                        json_build_object(
                            'id', c.id,
                            'userId', c.user_session_id,
                            'userName', c.user_name,
                            'text', c.text,
                            'timestamp', c.created_at
                        )
                    ) FILTER (WHERE c.id IS NOT NULL), '[]') as comments,
                    COALESCE(
                        (SELECT json_agg(user_session_id) FROM track_likes WHERE track_id = t.id),
                        '[]'
                    ) as liked_by
                FROM tracks t
                LEFT JOIN comments c ON t.id = c.track_id
                GROUP BY t.id
                ORDER BY t.created_at DESC
            ''')
            
            tracks = cur.fetchall()
            
            result = []
            for track in tracks:
                result.append({
                    'id': track['id'],
                    'title': track['title'],
                    'artist': track['artist'],
                    'url': track['audio_url'],
                    'coverUrl': track['cover_url'],
                    'likes': track['likes'],
                    'likedBy': track['liked_by'] if track['liked_by'] else [],
                    'comments': track['comments'] if track['comments'] else [],
                    'playlistIds': []
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'tracks': result}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            track_id = body_data.get('id')
            title = body_data.get('title')
            artist = body_data.get('artist')
            audio_url = body_data.get('audioUrl')
            cover_url = body_data.get('coverUrl')
            
            cur.execute('''
                INSERT INTO tracks (id, title, artist, audio_url, cover_url, user_session_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (track_id, title, artist, audio_url, cover_url, user_session))
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'trackId': track_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            track_id = body_data.get('trackId')
            action = body_data.get('action')
            
            if action == 'like':
                cur.execute('SELECT likes FROM tracks WHERE id = %s', (track_id,))
                track = cur.fetchone()
                
                if not track:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Track not found'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    SELECT id FROM track_likes 
                    WHERE track_id = %s AND user_session_id = %s
                ''', (track_id, user_session))
                
                existing_like = cur.fetchone()
                
                if existing_like:
                    cur.execute('''
                        DELETE FROM track_likes 
                        WHERE track_id = %s AND user_session_id = %s
                    ''', (track_id, user_session))
                    cur.execute('''
                        UPDATE tracks SET likes = likes - 1 
                        WHERE id = %s
                    ''', (track_id,))
                else:
                    cur.execute('''
                        INSERT INTO track_likes (track_id, user_session_id)
                        VALUES (%s, %s)
                    ''', (track_id, user_session))
                    cur.execute('''
                        UPDATE tracks SET likes = likes + 1 
                        WHERE id = %s
                    ''', (track_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'comment':
                comment_id = body_data.get('commentId')
                comment_text = body_data.get('text')
                user_name = body_data.get('userName', 'Аноним')
                
                cur.execute('''
                    INSERT INTO comments (id, track_id, user_session_id, user_name, text)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (comment_id, track_id, user_session, user_name, comment_text))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
