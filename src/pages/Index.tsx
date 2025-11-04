import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface User {
  id: number;
  session_id: string;
  username: string;
  avatar_url?: string;
  status: string;
  last_seen: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  photo_url?: string;
  is_read: boolean;
  created_at: string;
}

interface Chat {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

const API_URL = 'https://functions.poehali.dev/08b27303-4176-4c11-827e-d7c2c0ede910';

export default function Index() {
  const [sessionId] = useState(() => {
    const existing = localStorage.getItem('session_id');
    if (existing) return existing;
    const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', newId);
    return newId;
  });

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadOnlineUsers();
    const interval = setInterval(loadOnlineUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat.id);
      const interval = setInterval(() => loadMessages(currentChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [currentChat]);

  const loadOnlineUsers = async () => {
    const response = await fetch(`${API_URL}?action=online`);
    const users = await response.json();
    setOnlineUsers(users);

    const currentUser = users.find((u: User) => u.session_id === sessionId);
    if (currentUser) {
      setCurrentUserId(currentUser.id);
      setUsername(currentUser.username || '');
      setAvatarUrl(currentUser.avatar_url || '');
    }
  };

  const loadMessages = async (chatId: string) => {
    const response = await fetch(`${API_URL}?action=messages&chat_id=${chatId}`);
    const msgs = await response.json();
    setMessages(msgs);
  };

  const handleUpdateProfile = async () => {
    if (!currentUserId) return;

    const response = await fetch(`${API_URL}?action=update_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUserId,
        username: username || `User_${currentUserId}`,
        avatar_url: avatarUrl,
        status: 'online'
      })
    });

    if (response.ok) {
      toast.success('Профиль обновлён');
      setShowSettings(false);
      loadOnlineUsers();
    }
  };

  const handleSelectUser = async (user: User) => {
    if (!currentUserId) return;
    
    setSelectedUser(user);
    
    const response = await fetch(`${API_URL}?action=chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user1_id: currentUserId,
        user2_id: user.id
      })
    });

    const chat = await response.json();
    setCurrentChat(chat);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentChat || !currentUserId) return;

    const response = await fetch(`${API_URL}?action=send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: currentChat.id,
        sender_id: currentUserId,
        content: messageInput
      })
    });

    if (response.ok) {
      setMessageInput('');
      loadMessages(currentChat.id);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChat || !currentUserId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      
      await fetch(`${API_URL}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: currentChat.id,
          sender_id: currentUserId,
          content: '📷 Фото',
          photo_url: base64
        })
      });

      loadMessages(currentChat.id);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-screen flex bg-secondary">
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{username?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{username || 'Гость'}</h2>
              <p className="text-xs text-muted-foreground">Ti Messenger</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Icon name="Settings" size={20} />
          </Button>
        </div>

        {showSettings && (
          <div className="p-4 border-b border-border bg-muted/50">
            <div className="space-y-3">
              <Input
                placeholder="Ваше имя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                placeholder="URL аватара"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <Button onClick={handleUpdateProfile} className="w-full">
                Сохранить
              </Button>
            </div>
          </div>
        )}

        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Icon name="Users" size={16} />
            Онлайн ({onlineUsers.filter(u => u.session_id !== sessionId).length})
          </h3>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2">
            {onlineUsers
              .filter((user) => user.session_id !== sessionId)
              .map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                    selectedUser?.id === user.id ? 'bg-muted' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.username?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{user.username}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      онлайн
                    </p>
                  </div>
                  {user.session_id === 'bot_assistant' && (
                    <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      Бот
                    </div>
                  )}
                </button>
              ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="bg-card border-b border-border p-4 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.avatar_url} />
                <AvatarFallback>{selectedUser.username?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{selectedUser.username}</h2>
                <p className="text-xs text-muted-foreground">онлайн</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === String(currentUserId) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md p-3 rounded-2xl ${
                        msg.sender_id === String(currentUserId)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card'
                      }`}
                    >
                      {msg.photo_url && (
                        <img src={msg.photo_url} alt="Фото" className="rounded-lg mb-2 max-w-full" />
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 bg-card border-t border-border flex items-center gap-2">
              <label htmlFor="photo-upload">
                <Button type="button" variant="ghost" size="icon" asChild>
                  <span>
                    <Icon name="Image" size={20} />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </span>
                </Button>
              </label>
              <Input
                placeholder="Написать сообщение..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Icon name="Send" size={20} />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Icon name="MessageCircle" size={40} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Ti Messenger</h2>
              <p className="text-muted-foreground">Выберите пользователя из списка онлайн</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}