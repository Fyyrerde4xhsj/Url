import { Timestamp } from 'firebase/firestore';

export interface LinkData {
  shortCode: string;
  originalUrl: string;
  createdAt: Timestamp | Date;
  clicks: number;
  owner?: string;
}

export interface CreateLinkResponse {
  shortCode: string;
  originalUrl: string;
  error?: string;
}

export interface LocalCache {
  [shortCode: string]: string; // shortCode -> originalUrl
}
