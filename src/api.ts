export interface Source {
  id: string;
  name: string;
  type?: string | null;
  description?: string | null;
  metadata?: string | null;
  createdAt: string;
  targetIndustry?: string | null;
  companySize?: string | null;
  roleFocus?: string | null;
  mainAngle?: string | null;
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
  campaignId: string;
  channel?: string;
  content: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface SocialPostSuggestion {
  id?: string;
  channel?: string;
  content: string;
  tone?: string;
  imageIdea?: string | null;
  [key: string]: any;
}

export interface ProspectEnrichmentPreview {
  prospectId: string;
  companyName: string | null;
  contactName: string | null;
  email: string | null;
  website: string | null;
  status: string | null;
  fitScore: number;
  fitLabel: string;
  primaryPain: string;
  summary: string;
}

export type ProspectStatus = "uncontacted" | "contacted" | "qualified" | "bad-fit";

export interface ProspectNote {
  id: number | string;
  prospectId: string;
  content: string;
  createdAt?: string;
}

export interface PushToLeadDeskResult {
  prospect: Prospect;
  leaddeskLead: any;
}

export interface BulkProspectInput {
  companyName: string;
  contactName?: string;
  role?: string;
  email?: string;
  phone?: string;
  website?: string;
  tags?: string | string[];
  status?: string;
  ownerName?: string;
}

export interface CreateProspectInput {
  sourceId: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  status?: string;
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

export async function updateSourceIcp(
  id: string,
  payload: {
    targetIndustry?: string | null;
    companySize?: string | null;
    roleFocus?: string | null;
    mainAngle?: string | null;
  },
) {
  const res = await fetch(`${BASE_URL}/sources/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update source (${res.status})`);
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

export async function fetchSocialPosts(
  campaignId: string,
): Promise<SocialPost[]> {
  const res = await fetch(
    `/leads-gen-api/social-posts?campaignId=${encodeURIComponent(campaignId)}`,
  );
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

export async function fetchCampaignPostSuggestions(
  campaignId: string,
): Promise<SocialPostSuggestion[]> {
  const res = await fetch(
    `/leads-gen-api/ai/campaigns/${encodeURIComponent(campaignId)}/suggest-posts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch AI post suggestions (${res.status})`);
  }

  return res.json();
}

export interface CreateSocialPostInput {
  campaignId: string;
  channel: string;
  content: string;
  status?: string;
}

export type SocialPostStatus = "draft" | "scheduled" | "sent" | "archived";

export async function createSocialPost(
  input: CreateSocialPostInput,
): Promise<SocialPost> {
  const res = await fetch('/leads-gen-api/social-posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Failed to create social post (${res.status})`);
  }

  return res.json();
}

export async function updateSocialPostStatus(
  postId: string | number,
  status: SocialPostStatus,
): Promise<SocialPost> {
  const res = await fetch(`/leads-gen-api/social-posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update social post status (${res.status})`);
  }

  return res.json();
}

export async function fetchProspectEnrichmentPreview(
  sourceId: string,
): Promise<ProspectEnrichmentPreview[]> {
  const res = await fetch(
    `${BASE_URL}/ai/sources/${encodeURIComponent(sourceId)}/enrich-preview`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch enrichment preview (${res.status})`);
  }

  return res.json();
}

export async function updateProspectStatus(
  prospectId: string,
  status: ProspectStatus,
): Promise<Prospect> {
  const response = await fetch(`/leads-gen-api/prospects/${prospectId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update prospect status (${response.status})`);
  }

  return response.json();
}

export async function fetchProspectNotes(prospectId: string): Promise<ProspectNote[]> {
  const res = await fetch(`/leads-gen-api/prospects/${prospectId}/notes`);
  if (!res.ok) {
    throw new Error(`Failed to fetch prospect notes (${res.status})`);
  }
  return res.json();
}

export async function addProspectNote(
  prospectId: string,
  content: string,
): Promise<ProspectNote> {
  const res = await fetch(`/leads-gen-api/prospects/${prospectId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add prospect note (${res.status})`);
  }

  return res.json();
}

export async function pushProspectToLeadDesk(
  prospectId: string,
): Promise<PushToLeadDeskResult> {
  const res = await fetch(`/leads-gen-api/prospects/${prospectId}/push-to-leaddesk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error(`Failed to push prospect to Lead Desk (${res.status})`);
  }

  return res.json();
}

export async function bulkImportProspects(
  sourceId: string,
  prospects: BulkProspectInput[],
): Promise<void> {
  const res = await fetch(
    `/leads-gen-api/sources/${encodeURIComponent(sourceId)}/prospects/bulk`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prospects }),
    },
  );

  if (!res.ok) {
    throw new Error(`Bulk import failed (${res.status})`);
  }
}

export async function createProspect(
  input: CreateProspectInput,
): Promise<Prospect> {
  const res = await fetch("/leads-gen-api/prospects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Failed to create prospect (${res.status})`);
  }

  return res.json();
}
