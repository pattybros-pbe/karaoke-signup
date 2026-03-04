
'use server';

import { KaraokeRequest, AppSettings, RequestStatus } from '@/lib/types';
import { MOCK_REQUESTS } from '@/lib/mock-data';

// Simulation of a persistent store for the demo
let requests: KaraokeRequest[] = [...MOCK_REQUESTS];
let settings: AppSettings = { submissionsOpen: true };

export async function submitRequest(data: Omit<KaraokeRequest, 'id' | 'status' | 'createdAt'>) {
  if (!settings.submissionsOpen) {
    throw new Error("Submissions are currently closed.");
  }

  const newRequest: KaraokeRequest = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    status: 'Submitted',
    createdAt: new Date().toISOString(),
  };

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  requests.push(newRequest);
  return { success: true, request: newRequest };
}

export async function getRequests() {
  return requests;
}

export async function updateRequestStatuses(ids: string[], status: RequestStatus) {
  requests = requests.map(req => 
    ids.includes(req.id) ? { ...req, status } : req
  );
  return { success: true };
}

export async function toggleSubmissions() {
  settings.submissionsOpen = !settings.submissionsOpen;
  return settings;
}

export async function getSettings() {
  return settings;
}
