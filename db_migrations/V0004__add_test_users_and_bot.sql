-- Добавляем тестовых пользователей и бота в мессенджер

INSERT INTO users (session_id, username, avatar_url, status, last_seen) VALUES 
('bot_assistant', 'Ассистент Ti 🤖', 'https://api.dicebear.com/7.x/bottts/svg?seed=assistant', 'online', NOW()),
('user_anna', 'Анна Смирнова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna', 'online', NOW()),
('user_ivan', 'Иван Петров', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivan', 'online', NOW()),
('user_maria', 'Мария Кузнецова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', 'online', NOW()),
('user_alex', 'Алексей Новиков', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', 'online', NOW()),
('user_kate', 'Екатерина Волкова', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kate', 'online', NOW())
ON CONFLICT (session_id) DO UPDATE SET 
  last_seen = NOW(), 
  status = 'online',
  username = EXCLUDED.username,
  avatar_url = EXCLUDED.avatar_url;