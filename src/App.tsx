import { useEffect, useMemo, useState } from "react";
import {
  fetchCampaigns,
  fetchCampaignPostSuggestions,
  fetchPostSuggestionsForCampaign,
  fetchProspects,
  fetchSocialPosts,
  fetchSources,
  fetchProspectEnrichmentPreview,
  createSocialPost,
  updateSocialPostStatus,
  updateProspectStatus,
  archiveProspect,
  fetchProspectNotes,
  addProspectNote,
  pushProspectToLeadDesk,
  createProspect,
  createSource,
  updateSourceIcp,
} from "./api";
import ProspectManualForm from "./components/ProspectManualForm";
import ProspectsCsvImport from "./components/ProspectsCsvImport";
import type {
  Campaign,
  Prospect,
  SocialPost,
  SocialPostSuggestion,
  SocialPostStatus,
  ProspectEnrichmentPreview,
  ProspectNote,
  ProspectStatus,
  PushToLeadDeskResult,
  Source,
  CreateProspectInput,
} from "./api";
import { CampaignDetailPanel } from "./components/CampaignDetailPanel";
import { ProspectDetailPanel } from "./components/ProspectDetailPanel";

function getSourceNameForProspect(
  sources: Source[],
  sourceId?: string | null,
): string {
  if (!sourceId) return "Unknown source";
  const match = sources.find((s) => s.id === sourceId);
  return match?.name || "Unknown source";
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const csvContent = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialPostsLoading, setSocialPostsLoading] = useState(false);
  const [socialPostsError, setSocialPostsError] = useState<string | null>(null);
  const [postSuggestions, setPostSuggestions] = useState<SocialPostSuggestion[]>([]);
  const [postSuggestionsLoading, setPostSuggestionsLoading] = useState(false);
  const [postSuggestionsError, setPostSuggestionsError] = useState<string | null>(null);
  const [savingSuggestionId, setSavingSuggestionId] = useState<string | null>(null);
  const [saveSuggestionError, setSaveSuggestionError] = useState<string | null>(null);
  const [updatingPostId, setUpdatingPostId] = useState<string | number | null>(null);
  const [socialSuggestions, setSocialSuggestions] = useState<SocialPostSuggestion[]>([]);
  const [lastSavedSuggestionMessage, setLastSavedSuggestionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "campaigns" | "prospects" | "settings">("dashboard");
  const [selectedSourceId, setSelectedSourceId] = useState<string | "all">("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [enrichment, setEnrichment] = useState<ProspectEnrichmentPreview[]>([]);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const [fitFilter, setFitFilter] = useState<"all" | "best" | "best-fit">("all");
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateStatusError, setUpdateStatusError] = useState<string | null>(null);
  const [prospectNotes, setProspectNotes] = useState<ProspectNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [addNoteError, setAddNoteError] = useState<string | null>(null);
  const [pushingToLeadDesk, setPushingToLeadDesk] = useState(false);
  const [pushToLeadDeskError, setPushToLeadDeskError] = useState<string | null>(null);
  const [lastPushedLeadDeskId, setLastPushedLeadDeskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "uncontacted" | "contacted" | "qualified" | "bad-fit">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [prospectsReloadToken, setProspectsReloadToken] = useState(0);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showManualProspectForm, setShowManualProspectForm] = useState(false);
  const [editedSources, setEditedSources] = useState<Record<
    string,
    {
      targetIndustry?: string | null;
      companySize?: string | null;
      roleFocus?: string | null;
      mainAngle?: string | null;
    }
  >>({});
  const [sourceSaveState, setSourceSaveState] = useState<Record<
    string,
    { saving: boolean; error: string | null; success: boolean }
  >>({});
  const [newSourceName, setNewSourceName] = useState("");
  const [creatingSource, setCreatingSource] = useState(false);
  const [createSourceError, setCreateSourceError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [sourcesData, prospectsData, campaignsData] = await Promise.all([
          fetchSources(),
          fetchProspects(),
          fetchCampaigns(),
        ]);

        if (!isMounted) return;

        setSources(sourcesData);
        setProspects(prospectsData);
        setCampaigns(campaignsData);
      } catch (err: any) {
        console.error("Failed to load initial data", err);
        if (isMounted) {
          setError("Failed to load data. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [prospectsReloadToken]);

  function buildSourceIcpSummary(source?: Source | null): string | null {
    if (!source) return null;
    const parts: string[] = [];
    if (source.targetIndustry) parts.push(`Target: ${source.targetIndustry}`);
    if (source.companySize) parts.push(`Size: ${source.companySize}`);
    if (source.roleFocus) parts.push(`Role: ${source.roleFocus}`);
    if (source.mainAngle) parts.push(`Angle: ${source.mainAngle}`);
    if (parts.length === 0) return null;
    return parts.join(" · ");
  }

  const primarySource = sources[0];
  useEffect(() => {
    setEditedSources((prev) => {
      const next = { ...prev };
      for (const source of sources) {
        if (!next[source.id]) {
          next[source.id] = {
            targetIndustry: source.targetIndustry ?? null,
            companySize: source.companySize ?? null,
            roleFocus: source.roleFocus ?? null,
            mainAngle: source.mainAngle ?? null,
          };
        }
      }
      return next;
    });
  }, [sources]);
  useEffect(() => {
    setLastSavedSuggestionMessage(null);
  }, [selectedCampaignId]);

  const handleSourceCreated = (source: Source) => {
    setSources((prev) => [...prev, source]);
  };

  async function handleAddSource() {
    const trimmed = newSourceName.trim();
    if (!trimmed) return;
    try {
      setCreatingSource(true);
      setCreateSourceError(null);
      const newSource = await createSource({ name: trimmed });
      handleSourceCreated(newSource);
      setNewSourceName("");
      setSelectedSourceId(newSource.id);
    } catch (err) {
      console.error("Failed to create source", err);
      setCreateSourceError("Failed to create source. Please try again.");
    } finally {
      setCreatingSource(false);
    }
  }
  const primaryCampaign = campaigns[0];
  const primarySourceIcpSummary = buildSourceIcpSummary(primarySource || null);
  const postsForPrimaryCampaign = primaryCampaign
    ? socialPosts.filter((post) => post.campaignId === primaryCampaign.id)
    : [];
  const campaignsCount = campaigns.length;
  const sourcesCount = sources.length;
  const prospectsCount = prospects.length;
  const enrichmentByProspectId: Record<string, ProspectEnrichmentPreview> = {};
  for (const e of enrichment) {
    enrichmentByProspectId[e.prospectId] = e;
  }
  const filteredProspects =
    selectedSourceId === "all"
      ? prospects
      : prospects.filter((p) => p.sourceId === selectedSourceId);
  const getSourceName = (sourceId: Prospect["sourceId"]) => {
    return getSourceNameForProspect(sources, sourceId);
  };
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const isBestFitProspect = (prospect: Prospect): boolean => {
    const enrichment = enrichmentByProspectId[prospect.id];
    const label = enrichment?.fitLabel?.toLowerCase() || "";
    const score = typeof enrichment?.fitScore === "number" ? enrichment.fitScore : null;

    if (label) {
      if (label.includes("warm") || label.includes("hot") || label.includes("best") || label === "high") {
        return true;
      }
    }

    if (score !== null) {
      return score >= 50;
    }

    return false;
  };
  const statusAndSearchFilteredProspects = filteredProspects.filter((prospect) => {
    const matchesStatus =
      statusFilter === "all" ? true : prospect.status === statusFilter;

    if (!matchesStatus) return false;

    if (!normalizedSearch) return true;

    const haystack = [
      prospect.companyName || "",
      prospect.contactName || "",
      prospect.email || "",
    ]
      .join(" ")
      .toLowerCase();

  return haystack.includes(normalizedSearch);
  });
  const wantsBestFit = fitFilter === "best" || fitFilter === "best-fit";
  const fitFilteredProspects = statusAndSearchFilteredProspects.filter((prospect) => {
    if (!wantsBestFit) return true;
    return isBestFitProspect(prospect);
  });
  const sortedProspects: Prospect[] = [...fitFilteredProspects].sort((a, b) => {
    const ea = enrichmentByProspectId[a.id];
    const eb = enrichmentByProspectId[b.id];

    const scoreA = ea?.fitScore ?? 0;
    const scoreB = eb?.fitScore ?? 0;

    if (ea && eb) {
      return scoreB - scoreA;
    }
    if (ea && !eb) return -1;
    if (!ea && eb) return 1;
    return 0;
  });
  const readyToCallProspects = sortedProspects
    .filter((prospect) => {
      const enrichment = enrichmentByProspectId[prospect.id];
      if (!enrichment) return false;
      return prospect.status === "uncontacted";
    })
    .slice(0, 5);
  const globalCallQueueProspects = useMemo(() => {
    if (!prospects || prospects.length === 0) return [];

    const candidates = prospects.filter((prospect) => {
      const enrichment = enrichmentByProspectId[prospect.id];
      if (!enrichment) return false;
      if (prospect.status !== "uncontacted") return false;
      return true;
    });

    const sorted = [...candidates].sort((a, b) => {
      const ea = enrichmentByProspectId[a.id];
      const eb = enrichmentByProspectId[b.id];
      const scoreA = ea?.fitScore ?? 0;
      const scoreB = eb?.fitScore ?? 0;
      return scoreB - scoreA;
    });

    return sorted.slice(0, 10);
  }, [prospects, enrichmentByProspectId]);
  const totalInView = statusAndSearchFilteredProspects.length;
  const uncontactedCount = statusAndSearchFilteredProspects.filter(
    (p) => p.status === "uncontacted",
  ).length;
  const qualifiedCount = statusAndSearchFilteredProspects.filter(
    (p) => p.status === "qualified",
  ).length;

  const selectedCampaign =
    selectedCampaignId != null
      ? campaigns.find((c) => c.id === selectedCampaignId) ?? null
      : null;
  const selectedSource =
    selectedSourceId !== "all"
      ? sources.find((s) => s.id === selectedSourceId) ?? null
      : null;
  const selectedSourceIcpSummary = buildSourceIcpSummary(selectedSource);

  const handleCloseCampaignDetail = () => {
    setSelectedCampaignId(null);
  };

  async function handleGenerateSuggestions() {
    if (!primaryCampaign || suggestionsLoading) return;

    try {
      setSuggestionsLoading(true);
      const suggestions = await fetchPostSuggestionsForCampaign(primaryCampaign.id);
      setSocialSuggestions(suggestions);
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function handleRunEnrichment() {
    if (!selectedSourceId || selectedSourceId === "all") {
      return;
    }

    try {
      setEnrichmentLoading(true);
      setEnrichmentError(null);

      const previews = await fetchProspectEnrichmentPreview(selectedSourceId);
      setEnrichment(previews);
    } catch (err) {
      console.error("Failed to fetch enrichment preview", err);
      setEnrichmentError("Failed to run AI enrichment for this source.");
      setEnrichment([]);
    } finally {
      setEnrichmentLoading(false);
    }
  }

  const handleExportProspectsCsv = () => {
    const list = sortedProspects;

    if (!list || list.length === 0) {
      alert("No prospects in the current view to export.");
      return;
    }

    const header = [
      "prospectId",
      "companyName",
      "contactName",
      "email",
      "phone",
      "website",
      "sourceName",
      "status",
      "fitLabel",
      "fitScore",
      "primaryPain",
      "summary",
    ];

    const rows: string[][] = [header];

    for (const p of list) {
      const enrichment = enrichmentByProspectId[p.id];
      const sourceName = getSourceNameForProspect(sources, p.sourceId);

      rows.push([
        p.id ?? "",
        p.companyName ?? "",
        p.contactName ?? "",
        p.email ?? "",
        p.phone ?? "",
        p.website ?? "",
        sourceName,
        p.status ?? "",
        enrichment?.fitLabel ?? "",
        enrichment?.fitScore != null ? String(enrichment.fitScore) : "",
        enrichment?.primaryPain ?? "",
        enrichment?.summary ?? "",
      ]);
    }

    const today = new Date().toISOString().slice(0, 10);
    const filename = `leadgen-prospects-${today}.csv`;
    downloadCsv(filename, rows);
  };

  const handleProspectStatusChange = async (
    prospectId: string,
    newStatus: ProspectStatus,
  ) => {
    try {
      setUpdatingStatus(true);
      setUpdateStatusError(null);

      const updated = await updateProspectStatus(prospectId, newStatus);

      setProspects((prev) =>
        prev.map((p) => (p.id === prospectId ? { ...p, status: updated.status } : p)),
      );
    } catch (err) {
      console.error("Failed to update prospect status", err);
      setUpdateStatusError("Could not update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (!selectedProspectId) {
      setProspectNotes([]);
      setNotesLoading(false);
      setNotesError(null);
      return;
    }

    let cancelled = false;
    setNotesLoading(true);
    setNotesError(null);

    fetchProspectNotes(selectedProspectId)
      .then((notes) => {
        if (!cancelled) {
          setProspectNotes(notes);
        }
      })
      .catch((err) => {
        console.error("Failed to load prospect notes", err);
        if (!cancelled) {
          setNotesError("Could not load notes.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setNotesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProspectId]);

  const handleAddProspectNote = async (content: string) => {
    if (!selectedProspectId || !content.trim()) return;
    try {
      setAddingNote(true);
      setAddNoteError(null);
      const note = await addProspectNote(selectedProspectId, content.trim());
      setProspectNotes((prev) => [note, ...prev]);
    } catch (err) {
      console.error("Failed to add prospect note", err);
      setAddNoteError("Could not save note. Please try again.");
    } finally {
      setAddingNote(false);
    }
  };

  const handlePushToLeadDesk = async (prospectId: string) => {
    try {
      setPushingToLeadDesk(true);
      setPushToLeadDeskError(null);
      setLastPushedLeadDeskId(null);

      const result: PushToLeadDeskResult = await pushProspectToLeadDesk(prospectId);
      const ldId =
        (result.leaddeskLead && (result.leaddeskLead.id || result.leaddeskLead.leadId)) ||
        null;
      if (ldId) {
        setLastPushedLeadDeskId(String(ldId));
      }
    } catch (err) {
      console.error("Failed to push to Lead Desk", err);
      setPushToLeadDeskError("Could not send to Lead Desk. Please try again.");
    } finally {
      setPushingToLeadDesk(false);
    }
  };

  const handleCreateProspect = async (input: CreateProspectInput) => {
    await createProspect(input);
    setProspectsReloadToken((prev) => prev + 1);
  };

  const handleSourceFieldChange = (
    sourceId: string,
    field: "targetIndustry" | "companySize" | "roleFocus" | "mainAngle",
    value: string,
  ) => {
    setEditedSources((prev) => ({
      ...prev,
      [sourceId]: {
        ...(prev[sourceId] || {}),
        [field]: value,
      },
    }));
    setSourceSaveState((prev) => ({
      ...prev,
      [sourceId]: { saving: false, error: null, success: false },
    }));
  };

  const handleSaveSourceIcp = async (source: Source) => {
    const current = editedSources[source.id] || {};
    const payload = {
      targetIndustry: current.targetIndustry ?? null,
      companySize: current.companySize ?? null,
      roleFocus: current.roleFocus ?? null,
      mainAngle: current.mainAngle ?? null,
    };

    setSourceSaveState((prev) => ({
      ...prev,
      [source.id]: { saving: true, error: null, success: false },
    }));

    try {
      const updated = await updateSourceIcp(source.id, payload);
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, ...updated } : s)),
      );
      setSourceSaveState((prev) => ({
        ...prev,
        [source.id]: { saving: false, error: null, success: true },
      }));
    } catch (err: any) {
      console.error("Failed to update source ICP", err);
      setSourceSaveState((prev) => ({
        ...prev,
        [source.id]: {
          saving: false,
          error: "Could not save ICP fields. Backend PATCH /sources/:id may be missing.",
          success: false,
        },
      }));
    }
  };

  const selectedProspect = selectedProspectId
    ? prospects.find((p) => p.id === selectedProspectId) ?? null
    : null;

  const selectedProspectSourceName = selectedProspect
    ? getSourceName(selectedProspect.sourceId)
    : "Unknown source";

  const selectedEnrichment = selectedProspect
    ? enrichmentByProspectId[selectedProspect.id]
    : undefined;

  const handleCloseDetail = () => {
    setSelectedProspectId(null);
  };

  const handleArchiveSelectedProspect = async () => {
    if (!selectedProspectId) return;
    try {
      await archiveProspect(selectedProspectId);
      setProspectsReloadToken((prev) => prev + 1);
      setSelectedProspectId(null);
    } catch (err) {
      console.error("Failed to archive prospect", err);
      setError("Could not archive prospect. Please try again.");
    }
  };

  const loadSocialPostsForCampaign = async (campaignId: string) => {
    if (!campaignId) return;
    try {
      setSocialPostsLoading(true);
      setSocialPostsError(null);
      const posts = await fetchSocialPosts(campaignId);
      setSocialPosts(posts);
    } catch (err) {
      console.error("Failed to load social posts", err);
      setSocialPostsError("Could not load social posts.");
    } finally {
      setSocialPostsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCampaignId) {
      setSocialPosts([]);
      setSocialPostsLoading(false);
      setSocialPostsError(null);
      setPostSuggestions([]);
      setPostSuggestionsLoading(false);
      setPostSuggestionsError(null);
      setSavingSuggestionId(null);
      setSaveSuggestionError(null);
      return;
    }

    loadSocialPostsForCampaign(selectedCampaignId);
  }, [selectedCampaignId]);

  const handleGeneratePostSuggestions = async (campaignId: string) => {
    try {
      setPostSuggestionsLoading(true);
      setPostSuggestionsError(null);
      setLastSavedSuggestionMessage(null);
      setPostSuggestions([]);

      const suggestions = await fetchCampaignPostSuggestions(campaignId);
      setPostSuggestions(suggestions);
    } catch (err) {
      console.error("Failed to fetch AI post suggestions", err);
      setPostSuggestionsError("Could not generate AI suggestions. Please try again.");
    } finally {
      setPostSuggestionsLoading(false);
    }
  };

  const handleUpdatePostStatus = async (
    postId: string | number,
    newStatus: SocialPostStatus,
  ) => {
    try {
      setUpdatingPostId(postId);

      await updateSocialPostStatus(postId, newStatus);

      const campaignIdToReload = selectedCampaignId || selectedCampaign?.id;
      if (campaignIdToReload) {
        await loadSocialPostsForCampaign(campaignIdToReload);
      }
    } catch (err) {
      console.error("Failed to update social post status", err);
    } finally {
      setUpdatingPostId(null);
    }
  };

  const handleDashboardGenerateSuggestionsClick = () => {
    if (!campaigns || campaigns.length === 0) {
      console.warn("No campaigns available for AI suggestions.");
      return;
    }

    const targetCampaignId = selectedCampaignId || campaigns[0].id;

    setSelectedCampaignId(targetCampaignId);
    setActiveTab("campaigns");

    handleGeneratePostSuggestions(targetCampaignId);
    handleGenerateSuggestions();
  };

  const handleSaveSuggestionAsPost = async (suggestion: SocialPostSuggestion) => {
    if (!selectedCampaign) return;

    const suggestionKey = suggestion.id ?? suggestion.channel ?? "suggestion";

    try {
      setSavingSuggestionId(suggestionKey);
      setSaveSuggestionError(null);

      const post = await createSocialPost({
        campaignId: selectedCampaign.id,
        channel: suggestion.channel || "linkedin",
        content: suggestion.content,
        status: "draft",
      });

      setSocialPosts((prev) => [post, ...prev]);
      setPostSuggestions((prev) =>
        (prev || []).filter((s, index) => {
          const key = s?.id ?? s?.channel ?? s?.content ?? `suggestion-${index}`;
          return key !== suggestionKey;
        }),
      );
      setLastSavedSuggestionMessage('Saved as draft in Social posts ↑');
    } catch (err) {
      console.error("Failed to save suggestion as post", err);
      setSaveSuggestionError("Could not save this suggestion as a post.");
    } finally {
      setSavingSuggestionId(null);
    }
  };

  const prospectsTable = (
    <section className="rounded-2xl bg-white shadow-soft border border-slate-100 px-3 py-3 md:px-4 md:py-4">
      {loading && (
        <p className="text-sm text-slate-500">Loading prospects…</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && filteredProspects.length === 0 && (
        <p className="text-sm text-slate-500">
          No prospects yet. Import a list into a Source on the Dashboard to see them here.
        </p>
      )}

      {!loading && !error && filteredProspects.length > 0 && (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="overflow-hidden rounded-xl border border-slate-100 min-w-full">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="text-left">
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Company
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Contact
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Email
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Phone
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Status
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  AI fit
                </th>
                <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProspects.map((prospect) => {
                const status = prospect.status || "unknown";
                let statusClasses =
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

                if (status === "uncontacted") {
                  statusClasses += " bg-[#ffe4d6] text-[#ff6a3c]";
                } else if (status === "qualified") {
                  statusClasses += " bg-[#d6f2e7] text-[#49a682]";
                } else if (status === "contacted") {
                  statusClasses += " bg-slate-100 text-slate-700";
                } else {
                  statusClasses += " bg-slate-100 text-slate-600";
                }

                const e = enrichmentByProspectId[prospect.id];

                return (
                  <tr
                    key={prospect.id}
                    onClick={() => setSelectedProspectId(prospect.id)}
                    className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 align-top">
                      {prospect.companyName || "-"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {prospect.contactName
                        ? prospect.role
                          ? `${prospect.contactName} (${prospect.role})`
                          : prospect.contactName
                        : "-"}
                    </td>
                  <td className="px-3 py-2 align-top">
                    {prospect.email || "-"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {prospect.phone || "—"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className={statusClasses}>{status}</span>
                  </td>
                    <td className="px-3 py-2 align-top">
                      {e ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {e.fitLabel} · {e.fitScore}
                          </span>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {e.summary}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          No enrichment yet
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-slate-500">
                      {getSourceName(prospect.sourceId)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-pageBg text-textMain px-3 py-3 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-medium tracking-[0.18em] uppercase text-slate-400">
              Kalyan AI
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Lead Generation Engine
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
            >
              <span>All time</span>
            </button>
          </div>
        </header>

        <nav className="mt-4 rounded-full bg-white shadow-sm border border-slate-100 px-1 py-1">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 -mx-2 px-2 sm:pb-0 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={
                "rounded-full text-xs sm:text-sm font-medium px-3 py-1.5 shadow-sm transition " +
                (activeTab === "dashboard"
                  ? "bg-[#ff6a3c] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")
              }
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("campaigns")}
              className={
                "rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition " +
                (activeTab === "campaigns"
                  ? "bg-[#ff6a3c] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")
              }
            >
              Campaigns
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("prospects")}
              className={
                "rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition " +
                (activeTab === "prospects"
                  ? "bg-[#ff6a3c] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")
              }
            >
              Prospects
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={
                "rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition " +
                (activeTab === "settings"
                  ? "bg-[#ff6a3c] text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")
              }
            >
              Settings
            </button>
          </div>
        </nav>

        {activeTab === "dashboard" && (
          <main className="mt-4">
            <section className="rounded-3xl bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] border border-slate-100 px-3 py-4 sm:px-6 sm:py-6 space-y-5 sm:space-y-6">
              {(() => {
                console.log("Dashboard Call queue card rendered");
                return null;
              })()}
              <div className="space-y-1">
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400">
                  Overview
                </p>
                <h2 className="text-lg md:text-xl font-semibold tracking-tight text-[#49a682]">
                  Dashboard
                </h2>
                <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
                  A clear, AI-supported view of your campaigns, sources, and prospects, plus suggested content to keep your funnel warm.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 mt-4">
                <div className="rounded-2xl bg-gradient-to-b from-[#ffe4d6]/70 via-cardBg to-cardBg shadow-card p-[1.5px]">
                  <div className="rounded-[1rem] bg-cardBg border border-borderSoft px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-[#49a682] uppercase tracking-wide">
                        Active campaigns
                      </p>
                    </div>
                    <p className="text-2xl font-semibold">{campaignsCount}</p>
                    <p className="text-[11px] text-textMuted">
                      Driving AI-powered outreach.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-b from-[#ffe4d6]/70 via-cardBg to-cardBg shadow-card p-[1.5px]">
                  <div className="rounded-[1rem] bg-cardBg border border-borderSoft px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-[#49a682] uppercase tracking-wide">
                        Lead sources
                      </p>
                    </div>
                    <p className="text-2xl font-semibold">{sourcesCount}</p>
                    <p className="text-[11px] text-textMuted">
                      Lists feeding this engine.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-b from-[#ffe4d6]/70 via-cardBg to-cardBg shadow-card p-[1.5px]">
                  <div className="rounded-[1rem] bg-cardBg border border-borderSoft px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-[#49a682] uppercase tracking-wide">
                        Prospects
                      </p>
                    </div>
                    <p className="text-2xl font-semibold">{prospectsCount}</p>
                    <p className="text-[11px] text-textMuted">
                      People we can turn into opportunities.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] md:items-start">
                <div className="space-y-4 md:space-y-5">
                  <section className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-[#ff6a3c] via-[#c68a3c] to-[#49a682]" />
                    <div className="px-4 py-4 md:px-5 md:py-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h2 className="text-sm font-semibold text-[#49a682]">Campaigns</h2>
                        {primaryCampaign && (
                          <span className="inline-flex items-center rounded-full bg-[#ffe4d6] px-2 py-0.5 text-[11px] font-medium text-[#ff6a3c]">
                            {primaryCampaign.status || "active"}
                          </span>
                        )}
                      </div>

                      {loading && (
                        <p className="text-xs text-textMuted">Loading campaigns…</p>
                      )}
                      {error && (
                        <p className="text-xs text-red-500">{error}</p>
                      )}

                      {!loading && !error && primaryCampaign && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-textMain">{primaryCampaign.name}</p>
                          {primaryCampaign.objective && (
                            <p className="text-xs text-textMuted leading-relaxed">
                              {primaryCampaign.objective}
                            </p>
                          )}
                          {primaryCampaign.targetDescription && (
                            <p className="text-xs text-textMuted leading-relaxed">
                              Target: SME service businesses that want hosted AI systems to streamline their work.
                            </p>
                          )}
                        </div>
                      )}

                      {!loading && !error && !primaryCampaign && (
                        <p className="text-xs text-textMuted">
                          No campaigns yet. We will use this area to plan and track AI-powered lead generation campaigns.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4 md:px-5 md:py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                      <div>
                        <h2 className="text-sm font-semibold text-[#49a682]">Social posts</h2>
                        {primaryCampaign && isExpanded && (
                          <p className="text-xs text-slate-500">
                            For campaign: <span className="font-medium text-slate-900">{primaryCampaign.name}</span>
                          </p>
                        )}
                      </div>
                      {primaryCampaign && (
                        <button
                          type="button"
                          onClick={handleDashboardGenerateSuggestionsClick}
                          className={
                            "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[11px] font-medium shadow-sm transition " +
                            (suggestionsLoading
                              ? "bg-neutral-200 text-neutral-500 cursor-wait"
                              : "bg-[#ff6a3c] text-white hover:bg-[#ff5a28]")
                          }
                          disabled={suggestionsLoading}
                        >
                          {suggestionsLoading ? "Generating…" : "Generate AI suggestions"}
                        </button>
                      )}
                    </div>

                    {!isExpanded && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <p className="text-[11px]">Social posts preview is hidden.</p>
                        <button
                          type="button"
                          onClick={() => setIsExpanded(true)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                          Show posts
                        </button>
                      </div>
                    )}

                    {isExpanded && (
                      <>
                        {loading && (
                          <p className="text-xs text-slate-500">Loading social posts…</p>
                        )}

                        {error && (
                          <p className="text-xs text-red-500">{error}</p>
                        )}

                        {suggestionsLoading && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Generating suggestions…
                          </p>
                        )}

                        {!loading && !error && primaryCampaign && postsForPrimaryCampaign.length > 0 && (
                          <ul className="mt-2 space-y-2 text-xs">
                            {postsForPrimaryCampaign.slice(0, 3).map((post) => (
                              <li
                                key={post.id}
                                className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 hover:border-[#ffe4d6] hover:bg-[#ffe4d6]/50 transition"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium capitalize">
                                    {post.channel || "linkedin"}
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-[#ffe4d6] px-2 py-0.5 text-[10px] font-medium text-[#ff6a3c]">
                                    {post.status || "draft"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-3">
                                  {post.content}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}

                        {!loading &&
                          !error &&
                          primaryCampaign &&
                          socialSuggestions.length > 0 && (
                            <div className="mt-3 border-t border-slate-100 pt-2">
                              <p className="mb-2 text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                                AI suggestions (not yet scheduled)
                              </p>
                              <ul className="space-y-2 text-xs">
                                {socialSuggestions.map((s) => (
                                  <li
                                    key={s.id}
                                    className="rounded-lg border border-dashed border-[#ffe4d6] bg-white px-3 py-2 hover:border-[#ff6a3c] transition"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="capitalize">
                                        {s.channel || "linkedin"}
                                      </span>
                                      <span className="inline-flex items-center rounded-full bg-[#ffe4d6] px-2 py-0.5 text-[10px] font-medium text-[#ff6a3c]">
                                        suggestion
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 whitespace-pre-line">
                                      {s.content}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                    {!loading && !error && primaryCampaign && postsForPrimaryCampaign.length === 0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        Click "Generate AI suggestions" to draft social posts for this campaign, then fine-tune them on the Campaigns tab.
                      </p>
                    )}

                        {!loading && !error && !primaryCampaign && (
                          <p className="mt-1 text-xs text-slate-500">
                            Create a campaign to start planning social posts.
                          </p>
                        )}

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                          >
                            Close
                          </button>
                        </div>
                      </>
                    )}
                  </section>

                  {/* Call queue card */}
                  <div className="rounded-3xl bg-white shadow-sm p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">
                          Call queue
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          Top uncontacted prospects
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          AI-ordered by fit across all sources. Click a row to open it in the Prospects view.
                        </p>
                      </div>
                    </div>

                    {globalCallQueueProspects.length === 0 ? (
                      <p className="mt-2 text-[11px] text-slate-500">
                        No enriched uncontacted prospects yet. Import a list, run AI enrichment,
                        and they will appear here.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {globalCallQueueProspects.map((prospect) => {
                          const enrichment = enrichmentByProspectId[prospect.id];

                          return (
                            <button
                              key={prospect.id}
                              type="button"
                              className="w-full text-left rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 hover:bg-slate-100 transition cursor-pointer"
                              onClick={() => {
                                console.log("Call queue click", {
                                  id: prospect.id,
                                  sourceId: prospect.sourceId,
                                });

                                if (prospect.sourceId) {
                                  setSelectedSourceId(prospect.sourceId);
                                } else {
                                  setSelectedSourceId("all");
                                }

                                setStatusFilter("all");
                                setFitFilter("all");
                                setSearchQuery("");

                                setSelectedProspectId(prospect.id);

                                setActiveTab("prospects");
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate">
                                    {prospect.companyName || "Unnamed company"}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                                    {prospect.contactName || prospect.email || "No contact"}
                                  </p>
                                  {prospect.sourceId && (
                                    <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                                      Source: {getSourceName(prospect.sourceId)}
                                    </p>
                                  )}
                                </div>
                                {enrichment && (
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-[2px] text-[11px] font-medium text-amber-700">
                                      {(enrichment.fitLabel || "fit").toLowerCase()} ·{" "}
                                      {enrichment.fitScore ?? 0}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4 md:px-5 md:py-4">
                    <h2 className="text-sm font-semibold tracking-tight mb-2 text-[#49a682]">Sources</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your lead lists and imports will appear here. Select a source to see its prospects and manage outreach.
                    </p>
                    {loading && (
                      <p className="mt-2 text-xs text-slate-500">Loading sources…</p>
                    )}
                    {error && (
                      <p className="mt-2 text-xs text-red-500">{error}</p>
                    )}
                    {!loading && !error && primarySource && (
                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                          active source
                        </p>
                        <p className="text-sm font-semibold text-slate-900">{primarySource.name}</p>
                        {primarySource.type && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Type: {primarySource.type}
                          </p>
                        )}
                        {primarySourceIcpSummary && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            ICP: {primarySourceIcpSummary}
                          </p>
                        )}
                      </div>
                    )}
                    {!loading && !error && !primarySource && (
                      <p className="mt-2 text-xs text-slate-500">
                        No sources yet. We’ll add import options later.
                      </p>
                    )}
                  </section>

                  <section className="rounded-2xl bg-white shadow-soft border border-dashed border-[#f6e7cf] px-4 py-4 md:px-5 md:py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h2 className="text-sm font-semibold tracking-tight text-[#49a682]">LinkedIn (coming soon)</h2>
                      <span className="inline-flex items-center rounded-full bg-[#f6e7cf] px-2 py-0.5 text-[11px] font-medium text-[#c68a3c]">
                        planned
                      </span>
                    </div>
                    <p className="text-sm text-textMuted leading-relaxed">
                      Planned LinkedIn automation will capture saved profiles, monitor outreach, and sync replies directly into your prospect list.
                    </p>
                  </section>
                </div>

                <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4 md:px-5 md:py-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold tracking-tight text-[#49a682]">Prospects</h2>
                        <p className="text-sm text-slate-500 mt-1">
                        Prospects for this source will appear here after you import a CSV or add them manually.
                      </p>
                      </div>
                    </div>

                  {loading && (
                    <p className="mt-3 text-sm text-slate-500">Loading prospects…</p>
                  )}
                  {error && (
                    <p className="mt-3 text-sm text-red-500">{error}</p>
                  )}
                  {!loading && !error && (
                    <div className="mt-3 overflow-x-auto -mx-2 sm:mx-0">
                      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white min-w-full">
                      <p className="text-xs text-slate-500 mb-2 px-3 pt-2">
                        Showing {prospects.length} prospect{prospects.length === 1 ? "" : "s"} for this engine.
                      </p>
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-400">
                          <tr className="text-left">
                            <th className="px-3 py-2 font-medium">
                              Company
                            </th>
                            <th className="px-3 py-2 font-medium">
                              Contact
                            </th>
                            <th className="px-3 py-2 font-medium">
                              Phone
                            </th>
                            <th className="px-3 py-2 font-medium">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {prospects.map((prospect) => (
                            <tr
                              key={prospect.id}
                              className="group cursor-pointer hover:bg-slate-50"
                              onClick={() => {
                                console.log("Dashboard Prospects click", {
                                  id: prospect.id,
                                  sourceId: prospect.sourceId,
                                });
                                if (prospect.sourceId) {
                                  setSelectedSourceId(prospect.sourceId);
                                } else {
                                  setSelectedSourceId("all");
                                }
                                setStatusFilter("all");
                                setFitFilter("all");
                                setSearchQuery("");
                                setSelectedProspectId(prospect.id);
                                setActiveTab("prospects");
                              }}
                            >
                              <td className="px-3 py-2 border-t border-slate-100 text-[11px] text-slate-800 truncate">
                                {prospect.companyName || "-"}
                              </td>
                              <td className="px-3 py-2 border-t border-slate-100 text-[11px] text-slate-600 truncate">
                                {prospect.contactName
                                  ? prospect.role
                                    ? `${prospect.contactName} (${prospect.role})`
                                    : prospect.contactName
                                  : "-"}
                              </td>
                              <td className="px-3 py-2 border-t border-slate-100 text-[11px] text-slate-600 truncate">
                                {prospect.phone || "—"}
                              </td>
                              <td className="px-3 py-2 border-t border-slate-100">
                                {(() => {
                                  const status = prospect.status || "unknown";
                                  let statusClasses =
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
                                  if (status === "uncontacted") {
                                    statusClasses += " bg-leadOrangeSoft text-leadOrange";
                                  } else if (status === "qualified") {
                                    statusClasses += " bg-leadGreenSoft text-leadGreen";
                                  } else if (status === "contacted") {
                                    statusClasses += " bg-slate-100 text-slate-700";
                                  } else {
                                    statusClasses += " bg-slate-100 text-slate-600";
                                  }
                                  return <span className={statusClasses}>{status}</span>;
                                })()}
                              </td>
                            </tr>
                          ))}

                          {prospects.length === 0 && !loading && !error && (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-3 py-4 text-center text-sm text-slate-500"
                              >
                                No prospects yet. Once we import lists and create outreach plans,
                                your prospects will appear here.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </section>
          </main>
        )}

        {activeTab === "campaigns" && (
          <main className="mt-4">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">
                  CAMPAIGNS
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-emerald-800">
                  AI-powered outreach campaigns
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  View and manage the campaigns driving your lead generation engine.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.1fr,1.7fr] gap-4">
                <div className="rounded-3xl bg-white shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Campaigns</p>
                      <p className="text-[11px] text-slate-500">
                        {campaigns.length === 0
                          ? "No campaigns yet."
                          : `Showing ${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}.`}
                      </p>
                    </div>
                  </div>

                  {campaigns.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Once you add campaigns, they will appear here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {campaigns.map((campaign) => (
                        <button
                          key={campaign.id}
                          type="button"
                          onClick={() => setSelectedCampaignId(campaign.id)}
                          className={`w-full text-left rounded-2xl text-sm transition ${
                            selectedCampaignId === campaign.id
                              ? "bg-gradient-to-b from-[#ffe4d6]/70 via-cardBg to-cardBg shadow-card p-[1.5px]"
                              : "border border-slate-100 bg-white hover:bg-slate-50 px-3 py-2"
                          }`}
                        >
                          <div
                            className={`${
                              selectedCampaignId === campaign.id
                                ? "rounded-[1rem] bg-white border border-borderSoft px-3 py-2"
                                : ""
                            }`}
                          >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {campaign.name || "Untitled campaign"}
                              </p>
                              {campaign.objective && (
                                <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                                  {campaign.objective}
                                </p>
                              )}
                            </div>
                            {campaign.status && (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${
                                  campaign.status === "active"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {campaign.status}
                              </span>
                            )}
                          </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden lg:block rounded-3xl bg-white shadow-sm p-4 sm:p-6 h-full">
                  {selectedCampaign ? (
                    <CampaignDetailPanel
                      campaign={selectedCampaign}
                      onClose={handleCloseCampaignDetail}
                      socialPosts={socialPosts.filter((post) => post.status !== "archived")}
                      socialPostsLoading={socialPostsLoading}
                      socialPostsError={socialPostsError}
                      postSuggestions={postSuggestions}
                      postSuggestionsLoading={postSuggestionsLoading}
                      postSuggestionsError={postSuggestionsError}
                      onGenerateSuggestions={() =>
                        handleGeneratePostSuggestions(selectedCampaign.id)
                      }
                      onSaveSuggestionAsPost={handleSaveSuggestionAsPost}
                      savingSuggestionId={savingSuggestionId}
                      saveSuggestionError={saveSuggestionError}
                      onUpdatePostStatus={handleUpdatePostStatus}
                      updatingPostId={updatingPostId}
                      lastSaveMessage={lastSavedSuggestionMessage}
                      allSocialPosts={socialPosts}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-slate-500">
                        Select a campaign on the left to see more details.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedCampaign && (
                <div className="lg:hidden rounded-3xl bg-white shadow-sm p-4 sm:p-6">
                  <CampaignDetailPanel
                    campaign={selectedCampaign}
                    onClose={handleCloseCampaignDetail}
                    socialPosts={socialPosts.filter((post) => post.status !== "archived")}
                    socialPostsLoading={socialPostsLoading}
                    socialPostsError={socialPostsError}
                    postSuggestions={postSuggestions}
                    postSuggestionsLoading={postSuggestionsLoading}
                    postSuggestionsError={postSuggestionsError}
                    onGenerateSuggestions={() =>
                      handleGeneratePostSuggestions(selectedCampaign.id)
                    }
                    onSaveSuggestionAsPost={handleSaveSuggestionAsPost}
                    savingSuggestionId={savingSuggestionId}
                    saveSuggestionError={saveSuggestionError}
                    onUpdatePostStatus={handleUpdatePostStatus}
                    updatingPostId={updatingPostId}
                    lastSaveMessage={lastSavedSuggestionMessage}
                    allSocialPosts={socialPosts}
                  />
                </div>
              )}
            </div>
          </main>
        )}

        {activeTab === "prospects" && (
          <main className="mt-4">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">
                  Prospects
                </p>
                <h2 className="mt-1 text-xl font-semibold text-emerald-800">
                  All prospects
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  View and filter the prospects imported into this Lead Generation Engine. Use AI enrichment to create a warm call list and later push qualified leads into Lead Desk.
                </p>
              </div>

              <div className="rounded-3xl bg-white shadow-sm p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-gradient-to-b from-[#ffe4d6]/70 via-cardBg to-cardBg shadow-card p-[1.5px]">
                    <div className="rounded-[1rem] bg-cardBg border border-borderSoft px-4 py-3 flex flex-col gap-1.5">
                      <p className="text-[11px] font-medium text-[#ff6a3c] uppercase tracking-wide">
                        Uncontacted
                      </p>
                      <p className="text-2xl font-semibold text-slate-900">{uncontactedCount}</p>
                      <p className="text-[11px] text-textMuted">
                        Prospects you haven’t reached out to yet.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-b from-[#ffe4d6]/70 via-cardBg to-cardBg shadow-card p-[1.5px]">
                    <div className="rounded-[1rem] bg-cardBg border border-borderSoft px-4 py-3 flex flex-col gap-1.5">
                      <p className="text-[11px] font-medium text-[#49a682] uppercase tracking-wide">
                        Qualified
                      </p>
                      <p className="text-2xl font-semibold text-slate-900">{qualifiedCount}</p>
                      <p className="text-[11px] text-textMuted">
                        Prospects marked as a good fit.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-b from-[#ffe4d6]/70 via-cardBg to-cardBg shadow-card p-[1.5px]">
                    <div className="rounded-[1rem] bg-cardBg border border-borderSoft px-4 py-3 flex flex-col gap-1.5">
                      <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">
                        In view
                      </p>
                      <p className="text-2xl font-semibold text-slate-900">{totalInView}</p>
                      <p className="text-[11px] text-textMuted">
                        Prospects matching your current filters.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Prospects
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Total prospects:{" "}
                    <span className="font-semibold text-slate-900">
                      {filteredProspects.length}
                    </span>{" "}
                    · Ordered by AI fit when enrichment exists (use “Best-fit” to see only high-fit leads).
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                      value={selectedSourceId}
                      onChange={(e) =>
                        setSelectedSourceId(e.target.value === "all" ? "all" : e.target.value)
                      }
                    >
                      <option value="all">All sources</option>
                      {sources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm"
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as "all" | "uncontacted" | "contacted" | "qualified" | "bad-fit")
                      }
                    >
                      <option value="all">All statuses</option>
                      <option value="uncontacted">Uncontacted</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="bad-fit">Bad fit</option>
                    </select>

                    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-medium text-slate-700">
                      <button
                        type="button"
                        onClick={() => setFitFilter("all")}
                        className={
                          "rounded-full px-2 py-1 transition " +
                          (fitFilter === "all"
                            ? "bg-[#ff6a3c] text-white"
                            : "text-slate-600 hover:bg-slate-50")
                        }
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFitFilter("best")}
                        className={
                          "rounded-full px-2 py-1 transition " +
                          (fitFilter === "best"
                            ? "bg-[#ff6a3c] text-white"
                            : "text-slate-600 hover:bg-slate-50")
                        }
                      >
                        Best-fit
                      </button>
                    </div>

                  <input
                    type="text"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                    placeholder="Search company, contact, email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <button
                    type="button"
                    className={
                      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium shadow-sm transition " +
                      (showCsvImport
                        ? "bg-[#ff6a3c] text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50")
                    }
                    onClick={() => setShowCsvImport((prev) => !prev)}
                  >
                    {showCsvImport ? "Hide CSV import" : "Add prospects from CSV"}
                  </button>

                  <button
                    type="button"
                    className={
                      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium shadow-sm transition " +
                      (showManualProspectForm
                        ? "bg-[#ff6a3c] text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50")
                    }
                    onClick={() => setShowManualProspectForm((prev) => !prev)}
                  >
                    {showManualProspectForm ? "Hide manual form" : "Add prospect"}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportProspectsCsv}
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Export this view as CSV
                  </button>
                </div>

                {selectedSourceIcpSummary && (
                  <p className="text-[11px] text-slate-500">
                    Source context: {selectedSourceIcpSummary}
                  </p>
                )}

                  {selectedSourceId !== "all" && (
                    <button
                      type="button"
                      onClick={handleRunEnrichment}
                      disabled={enrichmentLoading}
                      className={
                        "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[11px] font-medium shadow-sm transition " +
                        (enrichmentLoading
                          ? "bg-neutral-200 text-neutral-500 cursor-wait"
                          : "bg-[#ff6a3c] text-white hover:bg-[#ff5a28]")
                      }
                    >
                      {enrichmentLoading ? "Enriching…" : "Run AI enrichment"}
                    </button>
                  )}
                </div>

                {showManualProspectForm && (
                  <ProspectManualForm
                    sources={sources}
                    defaultSourceId={selectedSourceId !== "all" ? selectedSourceId : null}
                    onCreate={handleCreateProspect}
                    onClose={() => setShowManualProspectForm(false)}
                  />
                )}

                {showCsvImport && (
                  <ProspectsCsvImport
                    sourceId={selectedSourceId !== "all" ? selectedSourceId : null}
                    sources={sources}
                    onImported={() => {
                      setProspectsReloadToken((prev) => prev + 1);
                    }}
                  />
                )}

                {enrichmentError && (
                  <p className="text-xs text-red-500">
                    {enrichmentError}
                  </p>
                )}

                {readyToCallProspects.length > 0 && (
                  <div className="mt-4 rounded-3xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Ready to call
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {readyToCallProspects.length} enriched, uncontacted prospects from your current view. Start at the top and work your way down.
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {readyToCallProspects.map((prospect) => {
                        const enrichment = enrichmentByProspectId[prospect.id];
                        return (
                          <button
                            key={prospect.id}
                            type="button"
                            onClick={() => setSelectedProspectId(prospect.id)}
                            className="flex-1 min-w-[160px] rounded-2xl bg-white shadow-sm px-3 py-2 text-left hover:shadow-md transition"
                          >
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {prospect.companyName || "Unnamed company"}
                            </p>
                            {prospect.contactName && (
                              <p className="text-[11px] text-slate-600 truncate">
                                {prospect.contactName}
                              </p>
                            )}
                            {enrichment && (
                              <p className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-[2px] text-[11px] font-medium text-amber-700">
                                {(enrichment.fitLabel || "Hot").toLowerCase()} · {enrichment.fitScore ?? 0}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!selectedProspect ? (
                  <div className="mt-4">
                    {prospectsTable}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-4">
                    <div>
                      {prospectsTable}
                    </div>
                    <div className="hidden lg:block">
                      <ProspectDetailPanel
                        prospect={selectedProspect}
                        sourceName={selectedProspectSourceName}
                        enrichment={selectedEnrichment}
                        onClose={handleCloseDetail}
                        onChangeStatus={(newStatus) =>
                          handleProspectStatusChange(selectedProspect.id, newStatus)
                        }
                        updatingStatus={updatingStatus}
                        updateStatusError={updateStatusError}
                        notes={prospectNotes}
                        notesLoading={notesLoading}
                        notesError={notesError}
                        onAddNote={handleAddProspectNote}
                        addingNote={addingNote}
                        addNoteError={addNoteError}
                        onPushToLeadDesk={() => handlePushToLeadDesk(selectedProspect.id)}
                        pushingToLeadDesk={pushingToLeadDesk}
                        pushToLeadDeskError={pushToLeadDeskError}
                        lastPushedLeadDeskId={lastPushedLeadDeskId}
                        onArchive={handleArchiveSelectedProspect}
                      />
                    </div>
                  </div>
                )}

                {selectedProspect && (
                  <div className="mt-4 lg:hidden">
                  <ProspectDetailPanel
                    prospect={selectedProspect}
                    sourceName={selectedProspectSourceName}
                    enrichment={selectedEnrichment}
                    onClose={handleCloseDetail}
                    onChangeStatus={(newStatus) =>
                      handleProspectStatusChange(selectedProspect.id, newStatus)
                    }
                      updatingStatus={updatingStatus}
                      updateStatusError={updateStatusError}
                      notes={prospectNotes}
                      notesLoading={notesLoading}
                      notesError={notesError}
                      onAddNote={handleAddProspectNote}
                      addingNote={addingNote}
                      addNoteError={addNoteError}
                    onPushToLeadDesk={() => handlePushToLeadDesk(selectedProspect.id)}
                    pushingToLeadDesk={pushingToLeadDesk}
                    pushToLeadDeskError={pushToLeadDeskError}
                    lastPushedLeadDeskId={lastPushedLeadDeskId}
                    onArchive={handleArchiveSelectedProspect}
                  />
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {activeTab === "settings" && (
          <main className="mt-4">
            <section className="rounded-3xl bg-white shadow-sm border border-slate-100 px-4 py-4 sm:px-6 sm:py-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-700">
                  Settings
                </p>
                <h2 className="text-xl font-semibold text-emerald-800">Sources & ICP</h2>
                <p className="text-sm text-slate-600">
                  Internal-only: add context per source to guide enrichment (industry, size, role focus, and angle).
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-700">New source name</label>
                  <input
                    type="text"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="e.g. Eco installers – November"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  {createSourceError && (
                    <p className="mt-1 text-xs text-red-600">{createSourceError}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddSource}
                  disabled={creatingSource}
                  className={
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition " +
                    (creatingSource
                      ? "bg-neutral-200 text-neutral-500 cursor-wait"
                      : "bg-[#ff6a3c] text-white hover:bg-[#ff5a28]")
                  }
                >
                  {creatingSource ? "Adding..." : "Add"}
                </button>
              </div>

              {sources.length === 0 ? (
                <p className="text-sm text-slate-500">No sources yet.</p>
              ) : (
                <div className="space-y-4">
                  {sources.map((source) => {
                    const edited = editedSources[source.id] || {};
                    const state = sourceSaveState[source.id] || {
                      saving: false,
                      error: null,
                      success: false,
                    };
                    return (
                      <div
                        key={source.id}
                        className="rounded-3xl bg-white shadow-sm border border-slate-100 p-4 sm:p-6 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{source.name}</p>
                            {source.type && (
                              <p className="text-xs text-slate-500">Type: {source.type}</p>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {buildSourceIcpSummary(source) || "No ICP context yet"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">Target industry</label>
                            <input
                              type="text"
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              value={edited.targetIndustry ?? source.targetIndustry ?? ""}
                              onChange={(e) =>
                                handleSourceFieldChange(source.id, "targetIndustry", e.target.value)
                              }
                              placeholder="e.g. Marketing agencies"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">Company size</label>
                            <input
                              type="text"
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              value={edited.companySize ?? source.companySize ?? ""}
                              onChange={(e) =>
                                handleSourceFieldChange(source.id, "companySize", e.target.value)
                              }
                              placeholder="e.g. 10–50 staff"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">Role focus</label>
                            <input
                              type="text"
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              value={edited.roleFocus ?? source.roleFocus ?? ""}
                              onChange={(e) =>
                                handleSourceFieldChange(source.id, "roleFocus", e.target.value)
                              }
                              placeholder="e.g. Owners / MD / Ops"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">Main angle</label>
                            <input
                              type="text"
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              value={edited.mainAngle ?? source.mainAngle ?? ""}
                              onChange={(e) =>
                                handleSourceFieldChange(source.id, "mainAngle", e.target.value)
                              }
                              placeholder="e.g. Reduce admin time with AI"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          {state.error && (
                            <span className="text-xs text-red-500">{state.error}</span>
                          )}
                          {state.success && !state.error && (
                            <span className="text-xs text-emerald-600">Saved</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSaveSourceIcp(source)}
                            disabled={state.saving}
                            className={
                              "inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition " +
                              (state.saving
                                ? "bg-slate-200 text-slate-500 cursor-wait"
                                : "bg-[#ff6a3c] text-white hover:bg-[#ff5a28]")
                            }
                          >
                            {state.saving ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
