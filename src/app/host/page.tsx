'use client';

import * as React from 'react';
import Image from 'next/image';
import { 
  Music, CheckCircle2, 
  Phone, MessageSquare,
  RefreshCcw, MoreHorizontal,
  ClipboardList, AlertTriangle,
  ExternalLink,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { summarizeSingerNotes } from '@/ai/flows/summarize-singer-notes-flow';
import { useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

type SortKey = 'singerName' | 'songTitle' | 'artistName' | 'submittedAt' | 'status';
type SortDirection = 'asc' | 'desc';

export default function HostDashboard() {
  const firestore = useFirestore();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [loadingSummary, setLoadingSummary] = React.useState<string | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: SortDirection }>({
    key: 'submittedAt',
    direction: 'desc'
  });

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  const configRef = useMemoFirebase(() => doc(firestore, 'hostConfiguration', 'karaokeConfig'), [firestore]);
  const { data: config, isLoading: loadingConfig } = useDoc(configRef);

  const requestsQuery = useMemoFirebase(() => query(
    collection(firestore, 'songRequests'),
    orderBy('submittedAt', 'desc')
  ), [firestore]);
  const { data: requests = [], isLoading: loadingRequests } = useCollection(requestsQuery);

  const handleToggleSubmissions = () => {
    if (!config) return;
    updateDocumentNonBlocking(configRef, { submissionsOpen: !config.submissionsOpen });
  };

  const handleInitializeSystem = () => {
    setDocumentNonBlocking(configRef, { 
      id: 'karaokeConfig',
      submissionsOpen: true,
      logoUrl: 'https://i.postimg.cc/hv2G8Cxr/Logo-White-Outline.png'
    }, { merge: true });
  };

  const handleStatusChange = (ids: string[], status: string) => {
    ids.forEach(id => {
      const docRef = doc(firestore, 'songRequests', id);
      updateDocumentNonBlocking(docRef, { status });
    });
    setSelectedIds([]);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    const docRef = doc(firestore, 'songRequests', id);
    deleteDocumentNonBlocking(docRef);
  };

  const handleBulkDelete = (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} requests? This action cannot be undone.`)) return;
    ids.forEach(id => {
      const docRef = doc(firestore, 'songRequests', id);
      deleteDocumentNonBlocking(docRef);
    });
    setSelectedIds([]);
  };

  const handleSummarize = async (req: any) => {
    if (!req.notes) return;
    setLoadingSummary(req.id);
    try {
      const { summary } = await summarizeSingerNotes({ notes: req.notes });
      alert(`AI Summary: ${summary}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummary(null);
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 text-accent" /> : <ArrowDown className="ml-2 h-4 w-4 text-accent" />;
  };

  const sortedRequests = React.useMemo(() => {
    let result = requests || [];

    return [...result].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'submittedAt') {
        aValue = aValue?.toMillis?.() || (aValue instanceof Date ? aValue.getTime() : 0);
        bValue = bValue?.toMillis?.() || (bValue instanceof Date ? bValue.getTime() : 0);
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [requests, sortConfig]);

  const stats = {
    submitted: requests?.filter(r => r.status === 'Submitted').length || 0,
    added: requests?.filter(r => r.status === 'Added to Queue').length || 0,
    performed: requests?.filter(r => r.status === 'Performed').length || 0,
  };

  if (!loadingConfig && !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 font-headline uppercase tracking-tight text-foreground">System Not Initialized</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          The database configuration is missing. Click the button below to set up the default karaoke settings and open submissions.
        </p>
        <Button onClick={handleInitializeSystem} size="lg" className="bg-accent hover:bg-accent/80 text-accent-foreground font-bold h-14 px-8 text-lg uppercase tracking-tight">
          Setup System & Open Submissions
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-black text-white px-8 py-6 border-b-4 border-accent shadow-sm sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {logo && (
              <div className="relative h-16 w-16 shrink-0">
                <Image 
                  src={logo.imageUrl} 
                  alt="App Logo" 
                  fill 
                  className="object-contain" 
                  priority
                />
              </div>
            )}
            
            <div className="flex flex-col items-start text-left">
              <h1 className="text-3xl font-black font-headline uppercase leading-none tracking-tighter text-white">KARAOKE</h1>
              <h1 className="text-lg font-black font-headline uppercase leading-none tracking-tighter text-accent mt-0.5">HOST DASHBOARD</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 border-l border-white/20 pl-6 ml-2">
            <span className="text-xs font-medium text-white/60 uppercase tracking-widest">Submissions:</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${config?.submissionsOpen ? 'text-green-500' : 'text-red-500'}`}>
                {config?.submissionsOpen ? 'OPEN' : 'CLOSED'}
              </span>
              <Switch checked={config?.submissionsOpen || false} onCheckedChange={handleToggleSubmissions} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-white">
            <ThemeToggle />
          </div>
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="gap-2 font-semibold text-white hover:bg-white/10 hover:text-white">
              <ExternalLink className="h-4 w-4" /> Singer Form
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border p-6 shadow-sm flex items-center justify-between group hover:border-primary/50 transition-all">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Submitted</p>
              <h2 className="text-4xl font-black font-headline text-foreground">{stats.submitted}</h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500/20">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-card rounded-xl border p-6 shadow-sm flex items-center justify-between group hover:border-accent/50 transition-all">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">In Queue</p>
              <h2 className="text-4xl font-black font-headline text-foreground">{stats.added}</h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20">
              <Music className="h-6 w-6" />
            </div>
          </div>
          <div className="bg-card rounded-xl border p-6 shadow-sm flex items-center justify-between group hover:border-green-500/50 transition-all">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Performed</p>
              <h2 className="text-4xl font-black font-headline text-foreground">{stats.performed}</h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:bg-green-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-end bg-card p-4 rounded-xl border shadow-sm min-h-[72px]">
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase pr-2">{selectedIds.length} Selected:</span>
                  <Button 
                    size="sm" 
                    className="h-9 bg-accent hover:bg-accent/80 text-accent-foreground font-black uppercase tracking-tight px-6 border-b-2 border-black/20" 
                    onClick={() => handleStatusChange(selectedIds, 'Added to Queue')}
                  >
                    Queue
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-9 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-tight px-6 border-b-2 border-black/20" 
                    onClick={() => handleStatusChange(selectedIds, 'Performed')}
                  >
                    Done
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-9 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-tight px-6 border-b-2 border-black/20" 
                    onClick={() => handleBulkDelete(selectedIds)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedIds.length === sortedRequests.length && sortedRequests.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(sortedRequests.map(r => r.id));
                        else setSelectedIds([]);
                      }}
                    />
                  </TableHead>
                  <TableHead onClick={() => handleSort('singerName')} className="cursor-pointer font-bold uppercase text-[10px] tracking-widest whitespace-nowrap group">
                    <div className="flex items-center">Singer <SortIcon column="singerName" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('songTitle')} className="cursor-pointer font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">
                    <div className="flex items-center">Song Title <SortIcon column="songTitle" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('artistName')} className="cursor-pointer font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">
                    <div className="flex items-center">Artist <SortIcon column="artistName" /></div>
                  </TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest whitespace-nowrap text-center">Key</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest whitespace-nowrap text-center">Tempo</TableHead>
                  <TableHead onClick={() => handleSort('submittedAt')} className="cursor-pointer font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">
                    <div className="flex items-center">Submitted <SortIcon column="submittedAt" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">
                    <div className="flex items-center">Status <SortIcon column="status" /></div>
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRequests ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center text-muted-foreground">
                      <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-2 opacity-20" />
                      <p>Loading requests...</p>
                    </TableCell>
                  </TableRow>
                ) : sortedRequests.length > 0 ? (
                  sortedRequests.map((req) => (
                    <TableRow key={req.id} className="group hover:bg-muted/30 border-b">
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(req.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds([...selectedIds, req.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== req.id));
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-bold text-base whitespace-nowrap text-foreground">
                        <div className="flex items-center gap-2">
                          {req.singerName}
                          {req.contactNumber && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-accent hover:bg-accent/10">
                                  <Phone className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Contact Details</p>
                                <p className="text-sm font-bold text-foreground">{req.contactNumber}</p>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-foreground text-base whitespace-nowrap uppercase tracking-tight">
                        {req.songTitle}
                      </TableCell>
                      <TableCell className="font-bold text-foreground text-base whitespace-nowrap uppercase tracking-tight">
                        {req.artistName}
                      </TableCell>
                      <TableCell className="text-center font-bold text-foreground text-base">
                        {req.keyAdjustment > 0 ? `+${req.keyAdjustment}` : req.keyAdjustment === 0 ? '--' : req.keyAdjustment}
                      </TableCell>
                      <TableCell className="text-center font-bold text-foreground text-base">
                        {req.tempoAdjustment > 0 ? `+${req.tempoAdjustment}%` : req.tempoAdjustment === 0 ? '--' : `${req.tempoAdjustment}%`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {req.submittedAt?.toDate ? req.submittedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge 
                          className={cn(
                            "font-bold border-none",
                            req.status === 'Submitted' && 'bg-blue-500/20 text-blue-500',
                            req.status === 'Added to Queue' && 'bg-accent/20 text-accent',
                            req.status === 'Performed' && 'bg-green-500/20 text-green-500'
                          )}
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {req.notes && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-4">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Singer Notes</p>
                                    <p className="text-sm leading-relaxed italic text-foreground">"{req.notes}"</p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    className="w-full text-xs h-8 gap-2 bg-primary/10 text-primary hover:bg-primary/20"
                                    onClick={() => handleSummarize(req)}
                                    disabled={loadingSummary === req.id}
                                  >
                                    {loadingSummary === req.id ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <MoreHorizontal className="h-3 w-3" />}
                                    Summarize with AI
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusChange([req.id], 'Added to Queue')}>Mark Queued</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange([req.id], 'Performed')}>Mark Done</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(req.id)}>Delete Request</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Music className="h-12 w-12 opacity-10" />
                        <p>No requests found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
