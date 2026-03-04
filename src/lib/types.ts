
export type RequestStatus = 'Submitted' | 'Added to Queue' | 'Performed';

export interface KaraokeRequest {
  id: string;
  singerName: string;
  songTitle: string;
  artistName: string;
  notes?: string;
  keyAdjustment: number;
  tempoAdjustment: number;
  contactNumber?: string;
  status: RequestStatus;
  createdAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
}

export interface AppSettings {
  submissionsOpen: boolean;
}
