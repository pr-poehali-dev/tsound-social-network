import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Track {
  id: string;
  title: string;
  file: File;
  url: string;
}

export default function Index() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(1200);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
    } else {
      toast.error('Выберите MP3 файл');
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
      file: selectedFile,
      url: URL.createObjectURL(selectedFile),
    };

    setTracks([newTrack, ...tracks]);
    toast.success('Трек загружен!');
    setUploadTitle('');
    setSelectedFile(null);
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

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Музыка</h1>
            <p className="text-muted-foreground">Слушай и делись любимыми треками</p>
          </div>
          
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

        {tracks.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <Icon name="Music" size={40} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Ещё нет треков</h3>
            <p className="text-muted-foreground mb-6">Загрузите первый трек, чтобы начать</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTracks.map((track) => (
              <Card key={track.id} className="bg-card border-border hover:bg-card/80 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Button
                      size="icon"
                      onClick={() => handlePlayTrack(track)}
                      className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                    >
                      <Icon 
                        name={currentTrack?.id === track.id && isPlaying ? "Pause" : "Play"} 
                        size={24} 
                      />
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">{track.title}</h3>
                      <p className="text-sm text-muted-foreground">Загружено недавно</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="Music" size={18} />
                      <span className="text-sm">MP3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                onClick={() => handlePlayTrack(currentTrack)}
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Icon name={isPlaying ? "Pause" : "Play"} size={20} />
              </Button>
              
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{currentTrack.title}</h4>
                <p className="text-sm text-muted-foreground">Сейчас играет</p>
              </div>
              
              <Icon name="Volume2" className="text-primary" size={24} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
