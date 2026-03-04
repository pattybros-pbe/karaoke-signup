'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Music2, CheckCircle, RefreshCcw } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Song } from '@/lib/types';

export default function CatalogPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedSong, setSelectedSong] = React.useState<Song | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  // Fetch songs from Firestore. Limit increased to 2000 for larger catalogs.
  const catalogQuery = useMemoFirebase(() => query(
    collection(firestore, 'catalogSongs'),
    orderBy('title', 'asc'),
    limit(2000)
  ), [firestore]);

  const { data: songs = [], isLoading } = useCollection<Song>(catalogQuery);

  const filteredSongs = (songs || []).filter(song => 
    song.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    setIsConfirmOpen(true);
  };

  const confirmSelection = () => {
    if (selectedSong) {
      router.push(`/?song=${encodeURIComponent(selectedSong.title)}&artist=${encodeURIComponent(selectedSong.artist)}`);
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold font-headline">Song Catalog</h1>
      </header>

      <div className="p-6 pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or artist..."
            className="h-12 pl-10 bg-muted/30 focus-visible:ring-accent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <RefreshCcw className="h-8 w-8 animate-spin mb-4 opacity-20" />
              <p>Loading your catalog...</p>
            </div>
          ) : filteredSongs.length > 0 ? (
            filteredSongs.map(song => (
              <div
                key={song.id}
                onClick={() => handleSongSelect(song)}
                className="group flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-accent/5 hover:border-accent/50 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-accent/20 transition-colors">
                    <Music2 className="h-5 w-5 text-muted-foreground group-hover:text-accent" />
                  </div>
                  <div>
                    <p className="font-bold leading-none">{song.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{song.artist}</p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p>{searchTerm ? 'No songs found matching your search.' : 'The catalog is empty. Ask the host to upload some songs!'}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-headline">Confirm Selection</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Would you like to request this song?
            </DialogDescription>
          </DialogHeader>
          {selectedSong && (
            <div className="py-4 text-center">
              <p className="text-xl font-bold">{selectedSong.title}</p>
              <p className="text-muted-foreground">{selectedSong.artist}</p>
            </div>
          )}
          <DialogFooter className="flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-accent hover:bg-accent/80 text-accent-foreground font-bold" onClick={confirmSelection}>
              Add to Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
