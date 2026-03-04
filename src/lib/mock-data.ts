
import { Song, KaraokeRequest } from './types';

export const MOCK_CATALOG: Song[] = [
  { id: '1', title: 'Bohemian Rhapsody', artist: 'Queen' },
  { id: '2', title: 'Don\'t Stop Believin\'', artist: 'Journey' },
  { id: '3', title: 'Sweet Caroline', artist: 'Neil Diamond' },
  { id: '4', title: 'I Will Survive', artist: 'Gloria Gaynor' },
  { id: '5', title: 'Livin\' on a Prayer', artist: 'Bon Jovi' },
  { id: '6', title: 'Wannabe', artist: 'Spice Girls' },
  { id: '7', title: 'Wonderwall', artist: 'Oasis' },
  { id: '8', title: 'Hotel California', artist: 'Eagles' },
  { id: '9', title: 'Rolling in the Deep', artist: 'Adele' },
  { id: '10', title: 'Summer of \'69', artist: 'Bryan Adams' },
  { id: '11', title: 'Shake It Off', artist: 'Taylor Swift' },
  { id: '12', title: 'Hallelujah', artist: 'Leonard Cohen' },
  { id: '13', title: 'Stayin\' Alive', artist: 'Bee Gees' },
  { id: '14', title: 'Dancing Queen', artist: 'ABBA' },
  { id: '15', title: 'Lose Yourself', artist: 'Eminem' },
];

export const MOCK_REQUESTS: KaraokeRequest[] = [
  {
    id: 'req_1',
    singerName: 'John Doe',
    songTitle: 'Bohemian Rhapsody',
    artistName: 'Queen',
    keyAdjustment: 0,
    tempoAdjustment: 0,
    status: 'Submitted',
    createdAt: new Date().toISOString(),
  }
];
