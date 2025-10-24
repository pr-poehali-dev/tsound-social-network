import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Track {
  id: string;
  title: string;
  artist: string;
  file: File;
  url: string;
  coverUrl?: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  playlistIds: string[];
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  coverUrl?: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
}

export default function Index() {
  const currentUser: User = { id: 'user1', name: 'Вы', avatar: '' };
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(1200);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
    } else {
      toast.error('Выберите MP3 файл');
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedCover(file);
      setCoverPreview(URL.createObjectURL(file));
    } else {
      toast.error('Выберите изображение');
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadTitle.trim()) {
      toast.error('Заполните название трека');
      return;
    }

    const newTrack: Track = {
      id: Date.now().toString(),
      title: uploadTitle,
      artist: uploadArtist || currentUser.name,
      file: selectedFile,
      url: URL.createObjectURL(selectedFile),
      coverUrl: coverPreview || undefined,
      likes: 0,
      likedBy: [],
      comments: [],
      playlistIds: [],
    };

    setTracks([newTrack, ...tracks]);
    toast.success('Трек загружен!');
    setUploadTitle('');
    setUploadArtist('');
    setSelectedFile(null);
    setSelectedCover(null);
    setCoverPreview('');
    setIsDialogOpen(false);
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  };

  const handleLike = (trackId: string) => {
    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        const isLiked = track.likedBy.includes(currentUser.id);
        return {
          ...track,
          likes: isLiked ? track.likes - 1 : track.likes + 1,
          likedBy: isLiked 
            ? track.likedBy.filter(id => id !== currentUser.id)
            : [...track.likedBy, currentUser.id]
        };
      }
      return track;
    }));
  };

  const handleComment = (trackId: string) => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: commentText,
      timestamp: new Date(),
    };

    setTracks(tracks.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          comments: [...track.comments, newComment]
        };
      }
      return track;
    }));

    setCommentText('');
    toast.success('Комментарий добавлен');
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error('Введите название плейлиста');
      return;
    }

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      trackIds: [],
    };

    setPlaylists([...playlists, newPlaylist]);
    toast.success('Плейлист создан!');
    setNewPlaylistName('');
    setIsPlaylistDialogOpen(false);
  };

  const handleAddToPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists(playlists.map(playlist => {
      if (playlist.id === playlistId) {
        const isInPlaylist = playlist.trackIds.includes(trackId);
        return {
          ...playlist,
          trackIds: isInPlaylist
            ? playlist.trackIds.filter(id => id !== trackId)
            : [...playlist.trackIds, trackId]
        };
      }
      return playlist;
    }));
    toast.success('Плейлист обновлён');
  };

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myTracks = tracks.filter(track => track.artist === currentUser.name);
  
  const getPlaylistTracks = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return tracks.filter(track => playlist?.trackIds.includes(track.id));
  };

  const renderTrackCard = (track: Track) => {
    const isLiked = track.likedBy.includes(currentUser.id);
    
    return (
      <Card key={track.id} className="bg-card border-border hover:bg-card/80 transition-all">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              {track.coverUrl ? (
                <img 
                  src={track.coverUrl} 
                  alt={track.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                  <Icon name="Music" size={32} className="text-muted-foreground" />
                </div>
              )}
              <Button
                size="icon"
                onClick={() => handlePlayTrack(track)}
                className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Icon 
                  name={currentTrack?.id === track.id && isPlaying ? "Pause" : "Play"} 
                  size={16} 
                />
              </Button>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">{track.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{track.artist}</p>
              
              <div className="flex items-center gap-4 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(track.id)}
                  className={isLiked ? 'text-primary' : 'text-muted-foreground'}
                >
                  <Icon name="Heart" fill={isLiked ? 'currentColor' : 'none'} size={18} className="mr-1" />
                  {track.likes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTrackId(selectedTrackId === track.id ? null : track.id)}
                  className="text-muted-foreground"
                >
                  <Icon name="MessageCircle" size={18} className="mr-1" />
                  {track.comments.length}
                </Button>
              </div>

              {selectedTrackId === track.id && (
                <div className="space-y-3 mt-4 pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Написать комментарий..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="bg-muted border-border"
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(track.id)}
                    />
                    <Button 
                      size="icon"
                      onClick={() => handleComment(track.id)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {track.comments.map(comment => (
                        <div key={comment.id} className="text-sm">
                          <span className="font-semibold text-foreground">{comment.userName}</span>
                          <span className="text-muted-foreground ml-2">{comment.text}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.poehali.dev/files/48f57fe1-0319-4b4e-a11c-f276b029ce01.jpg" 
                alt="TSound" 
                className="h-12 w-auto"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Поиск треков..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 bg-muted border-border"
                />
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-foreground">В онлайне {onlineUsers.toLocaleString()}</span>
              </div>

              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUser.name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="bg-muted">
                <TabsTrigger value="all">Все треки</TabsTrigger>
                <TabsTrigger value="my">Мои треки</TabsTrigger>
                <TabsTrigger value="playlists">Плейлисты</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                {activeTab === 'playlists' && (
                  <Dialog open={isPlaylistDialogOpen} onOpenChange={setIsPlaylistDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
                        <Icon name="ListMusic" size={20} />
                        Создать плейлист
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Новый плейлист</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Input
                          placeholder="Название плейлиста..."
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="bg-muted border-border"
                        />
                        <Button 
                          onClick={handleCreatePlaylist}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Создать
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      <Icon name="Plus" size={20} />
                      Загрузить трек
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Загрузить новый трек</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-foreground">Название трека</Label>
                        <Input
                          id="title"
                          placeholder="Введите название..."
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="bg-muted border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="artist" className="text-foreground">Исполнитель (необязательно)</Label>
                        <Input
                          id="artist"
                          placeholder="Имя исполнителя..."
                          value={uploadArtist}
                          onChange={(e) => setUploadArtist(e.target.value)}
                          className="bg-muted border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Обложка (необязательно)</Label>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverSelect}
                          className="hidden"
                        />
                        {coverPreview ? (
                          <div className="relative">
                            <img src={coverPreview} alt="Cover" className="w-full h-40 object-cover rounded-lg" />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setSelectedCover(null);
                                setCoverPreview('');
                              }}
                            >
                              <Icon name="X" size={16} />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-border hover:bg-muted"
                            onClick={() => coverInputRef.current?.click()}
                          >
                            <Icon name="Image" className="mr-2" size={18} />
                            Выбрать обложку
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">MP3 файл</Label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/mp3,audio/mpeg"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-border hover:bg-muted"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Icon name="Upload" className="mr-2" size={18} />
                          {selectedFile ? selectedFile.name : 'Выбрать файл'}
                        </Button>
                      </div>
                      <Button 
                        onClick={handleUpload}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={!selectedFile || !uploadTitle.trim()}
                      >
                        Загрузить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              {filteredTracks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <Icon name="Music" size={40} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Ещё нет треков</h3>
                  <p className="text-muted-foreground mb-6">Загрузите первый трек</p>
                </div>
              ) : (
                filteredTracks.map(renderTrackCard)
              )}
            </TabsContent>

            <TabsContent value="my" className="space-y-4">
              {myTracks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <Icon name="User" size={40} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">У вас нет треков</h3>
                  <p className="text-muted-foreground mb-6">Загрузите свой первый трек</p>
                </div>
              ) : (
                myTracks.map(renderTrackCard)
              )}
            </TabsContent>

            <TabsContent value="playlists" className="space-y-4">
              {playlists.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <Icon name="ListMusic" size={40} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Нет плейлистов</h3>
                  <p className="text-muted-foreground mb-6">Создайте свой первый плейлист</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {playlists.map((playlist) => {
                    const playlistTracks = getPlaylistTracks(playlist.id);
                    return (
                      <Card key={playlist.id} className="bg-card border-border">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                              <Icon name="ListMusic" size={32} className="text-primary" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground">{playlist.name}</h3>
                              <p className="text-sm text-muted-foreground">{playlistTracks.length} треков</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {playlistTracks.map((track) => (
                              <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                {track.coverUrl ? (
                                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                    <Icon name="Music" size={16} className="text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handlePlayTrack(track)}
                                  className="shrink-0"
                                >
                                  <Icon name={currentTrack?.id === track.id && isPlaying ? "Pause" : "Play"} size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {currentTrack && (
          <audio
            ref={audioRef}
            src={currentTrack.url}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </main>

      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-50">
          <div className="container mx-auto">
            <div className="flex items-center gap-4">
              {currentTrack.coverUrl ? (
                <img 
                  src={currentTrack.coverUrl} 
                  alt={currentTrack.title}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                  <Icon name="Music" size={24} className="text-muted-foreground" />
                </div>
              )}
              
              <Button
                size="icon"
                onClick={() => handlePlayTrack(currentTrack)}
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Icon name={isPlaying ? "Pause" : "Play"} size={20} />
              </Button>
              
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{currentTrack.title}</h4>
                <p className="text-sm text-muted-foreground">{currentTrack.artist}</p>
              </div>
              
              <Icon name="Volume2" className="text-primary" size={24} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
