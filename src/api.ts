export interface Source {
  id: string;
  name: string;
  type?: string | null;
  description?: string | null;
  metadata?: string | null;
  createdAt: string;
}

export interface Prospect {
  id: string;
  sourceId: string | null;
  companyName: string | null;
  contactName: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  tags: string | null;
  status: string;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string | null;
  lastContactedAt: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string | null;
  targetDescription: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  campaignId: string | null;
  channel: string | null;
  content: string;
  tone: string | null;
  scheduledFor: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface SocialPostSuggestion {
  id: string;
  campaignId: string;
  channel: string;
  tone: string;
  content: string;
  scheduledForSuggestion: string | null;
}

const BASE_URL = "/leads-gen-api";

// NOTE: There is intentionally no trailing slash.

export async function fetchSources(): Promise<Source[]> {
  const res = await fetch(`${BASE_URL}/sources`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sources (${res.status})`);
  }
  return res.json();
}

export async function fetchProspects(): Promise<Prospect[]> {
  const res = await fetch(`${BASE_URL}/prospects`);
  if (!res.ok) {
    throw new Error(`Failed to fetch prospects (${res.status})`);
  }
  return res.json();
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${BASE_URL}/campaigns`);
  if (!res.ok) {
    throw new Error(`Failed to fetch campaigns (${res.status})`);
  }
  return res.json();
}

export async function fetchSocialPosts(campaignId?: string): Promise<SocialPost[]> {
  const params = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
  const res = await fetch(`${BASE_URL}/social-posts${params}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch social posts (${res.status})`);
  }
  return res.json();
}

export async function fetchPostSuggestionsForCampaign(
  campaignId: string,
): Promise<SocialPostSuggestion[]> {
  const res = await fetch(
    `${BASE_URL}/ai/campaigns/${encodeURIComponent(campaignId)}/suggest-posts`,
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch suggestions (${res.status})`);
  }
  return res.json();
}
