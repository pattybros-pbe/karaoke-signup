'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/theme-toggle';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  singerName: z.string().min(2, "Singer name is required"),
  songTitle: z.string().min(1, "Song title is required"),
  artistName: z.string().min(1, "Artist name is required"),
  notes: z.string().optional(),
  keyAdjustment: z.number().min(-5).max(5).default(0),
  tempoAdjustment: z.number().min(-50).max(50).default(0),
  contactSinger: z.boolean().default(false),
  contactNumber: z.string().optional(),
}).refine((data) => {
  if (data.contactSinger && (!data.contactNumber || data.contactNumber.length < 7)) {
    return false;
  }
  return true;
}, {
  message: "Phone number is required if contact box is checked",
  path: ["contactNumber"],
});

function SingerPageContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const configRef = useMemoFirebase(() => doc(firestore, 'hostConfiguration', 'karaokeConfig'), [firestore]);
  const { data: config, isLoading: loadingSettings } = useDoc(configRef);

  const initialSong = searchParams.get('song');
  const initialArtist = searchParams.get('artist');

  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      singerName: '',
      songTitle: initialSong || '',
      artistName: initialArtist || '',
      notes: '',
      keyAdjustment: 0,
      tempoAdjustment: 0,
      contactSinger: false,
      contactNumber: '',
    },
  });

  React.useEffect(() => {
    if (initialSong) form.setValue('songTitle', initialSong);
    if (initialArtist) form.setValue('artistName', initialArtist);
  }, [initialSong, initialArtist, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!config || config.submissionsOpen === false) return;
    
    setIsSubmitting(true);
    try {
      const requestsRef = collection(firestore, 'songRequests');
      addDocumentNonBlocking(requestsRef, {
        singerName: values.singerName,
        songTitle: values.songTitle,
        artistName: values.artistName,
        notes: values.notes || "",
        keyAdjustment: values.keyAdjustment,
        tempoAdjustment: values.tempoAdjustment,
        contactNumber: values.contactSinger ? values.contactNumber : null,
        status: 'Submitted',
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleResetForm = () => {
    form.reset({
      singerName: '',
      songTitle: '',
      artistName: '',
      notes: '',
      keyAdjustment: 0,
      tempoAdjustment: 0,
      contactSinger: false,
      contactNumber: '',
    });
    setSubmitted(false);
  };

  if (loadingSettings) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!config || config.submissionsOpen === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2 font-headline uppercase tracking-tight">Submissions Closed</h1>
        <p className="text-muted-foreground max-w-md">
          {config ? "The host is not accepting new song requests at this time." : "The karaoke system is currently being initialized by the host. Please check back in a moment."}
        </p>
        <div className="mt-8">
          <ThemeToggle />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-background text-center animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="h-14 w-14 sm:h-20 sm:w-20 text-accent mb-4 sm:mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 font-headline uppercase">Request Received!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Thank you for your submission. Get ready to rock the stage!
        </p>
        <Button onClick={handleResetForm} className="w-full max-w-xs h-12 bg-accent hover:bg-accent/80 text-accent-foreground font-bold uppercase tracking-widest">
          Submit Another Song
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <header className="bg-black text-white px-4 py-6 sm:px-6 sm:py-12 border-b-4 border-accent relative flex flex-col items-center justify-center text-center">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="flex flex-col items-center max-w-2xl w-full">
          <div className="flex items-center gap-4 justify-center">
            {logo && (
              <div className="relative h-14 w-14 sm:h-20 sm:w-20 shrink-0">
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
              <h1 className="text-3xl sm:text-5xl font-black font-headline uppercase leading-tight tracking-tighter text-white">KARAOKE</h1>
              <h1 className="text-lg sm:text-2xl font-black font-headline uppercase leading-tight tracking-tighter text-accent mt-0.5">
                SIGN-UP&nbsp;&nbsp;FORM
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 sm:px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight border-l-4 border-accent pl-3">Song Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="songTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase text-muted-foreground">Song Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Title" {...field} className="h-10 border-2 border-primary focus-visible:ring-accent text-sm bg-muted/20" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="artistName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase text-muted-foreground">Artist</FormLabel>
                      <FormControl>
                        <Input placeholder="Artist" {...field} className="h-10 border-2 border-primary focus-visible:ring-accent text-sm bg-muted/20" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="singerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase text-muted-foreground">Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} className="h-10 border-2 border-primary focus-visible:ring-accent text-sm bg-muted/20" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-end">
                  <Link href="https://www.karafun.com/karaoke/playlist/" target="_blank" className="w-full">
                    <Button 
                      type="button"
                      className="w-full h-10 font-bold uppercase tracking-tight text-sm bg-accent hover:bg-accent/80 text-accent-foreground px-2"
                    >
                      VIEW SONG CATALOG
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t-2 border-dashed">
              <h2 className="text-xl font-black uppercase tracking-tight border-l-4 border-accent pl-3">Adjustments</h2>
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="keyAdjustment"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel className="font-bold text-xs uppercase text-accent">Key Change</FormLabel>
                        <span className="text-sm font-bold text-accent px-2 py-0.5 bg-accent/10 rounded">
                          {field.value === 0 ? "Original" : field.value > 0 ? `+${field.value}` : field.value}
                        </span>
                      </div>
                      <FormControl>
                        <div className="h-10 flex items-center px-3 border-2 border-primary rounded-md bg-muted/20">
                          <Slider
                            min={-5}
                            max={5}
                            step={1}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="w-full"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tempoAdjustment"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex justify-between items-center">
                        <FormLabel className="font-bold text-xs uppercase text-accent">Tempo</FormLabel>
                        <span className="text-sm font-bold text-accent px-2 py-0.5 bg-accent/10 rounded">
                          {field.value > 0 ? `+${field.value}%` : `${field.value}%`}
                        </span>
                      </div>
                      <FormControl>
                        <div className="h-10 flex items-center px-3 border-2 border-primary rounded-md bg-muted/20">
                          <Slider
                            min={-50}
                            max={50}
                            step={5}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="w-full"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase text-muted-foreground">Special Requests</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Anything else the host should know?" 
                            className="min-h-[80px] border-2 border-primary focus-visible:ring-accent text-sm py-2 bg-muted/20" 
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t-2 border-dashed">
              <FormField
                control={form.control}
                name="contactSinger"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-lg border-2 border-transparent hover:border-accent/10 transition-colors">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-5 w-5 border-2 border-primary data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                      />
                    </FormControl>
                    <FormLabel className="font-bold cursor-pointer text-[10px] uppercase tracking-tight leading-none">
                      ALLOW HOST TO CONTACT YOU WITH QUESTIONS
                    </FormLabel>
                  </FormItem>
                )}
              />

              {form.watch('contactSinger') && (
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem className="animate-in slide-in-from-top-2 duration-200">
                      <FormLabel className="font-bold text-xs uppercase text-muted-foreground">Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000-000-0000" 
                          type="tel" 
                          {...field} 
                          className="h-10 border-2 border-primary focus-visible:ring-accent text-sm bg-muted/20" 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}

              <Button 
                type="submit" 
                className="w-full h-14 bg-black hover:bg-black/90 text-white text-lg font-black uppercase tracking-widest shadow-xl border-b-4 border-accent active:translate-y-1 active:border-b-0 transition-all mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
                  </span>
                ) : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}

export default function SingerPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <SingerPageContent />
    </Suspense>
  );
}