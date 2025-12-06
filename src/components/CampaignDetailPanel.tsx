import { useState } from "react";
import type {
  Campaign as ApiCampaign,
  SocialPost,
  SocialPostSuggestion,
  SocialPostStatus,
} from "../api";

export type Campaign = ApiCampaign & {
  name?: string | null;
  status?: string | null;
  objective?: string | null;
  targetAudience?: string | null;
  targetDescription?: string | null;
  notes?: string | null;
  description?: string | null;
  createdAt?: string | null;
  [key: string]: any;
};

interface CampaignDetailPanelProps {
  campaign: Campaign;
  onClose: () => void;
  socialPosts?: SocialPost[];
  socialPostsLoading?: boolean;
  socialPostsError?: string | null;
  postSuggestions?: SocialPostSuggestion[];
  postSuggestionsLoading?: boolean;
  postSuggestionsError?: string | null;
  onGenerateSuggestions?: () => void;
  onSaveSuggestionAsPost?: (suggestion: SocialPostSuggestion) => void;
  savingSuggestionId?: string | null;
  saveSuggestionError?: string | null;
  onUpdatePostStatus?: (postId: string | number, status: SocialPostStatus) => void;
  updatingPostId?: string | number | null;
  lastSaveMessage?: string | null;
  allSocialPosts?: SocialPost[];
}

export function CampaignDetailPanel({
  campaign,
  onClose,
  socialPosts,
  socialPostsLoading,
  socialPostsError,
  postSuggestions,
  postSuggestionsLoading,
  postSuggestionsError,
  onGenerateSuggestions,
  onSaveSuggestionAsPost,
  savingSuggestionId,
  saveSuggestionError,
  onUpdatePostStatus,
  updatingPostId,
  lastSaveMessage,
  allSocialPosts,
}: CampaignDetailPanelProps) {
  const [copiedPostId, setCopiedPostId] = useState<string | number | null>(null);
  const [aiSuggestionsCollapsed, setAiSuggestionsCollapsed] = useState(false);
  const [postChannelFilter, setPostChannelFilter] = useState<"all" | "linkedin" | "twitter" | "facebook" | "instagram">("all");
  const [postStatusFilter, setPostStatusFilter] = useState<"all" | "draft" | "sent">("all");
  const postsForSummary = allSocialPosts ?? socialPosts ?? [];
  const draftCount = postsForSummary.filter(
    (post) => (post.status || "").toLowerCase() === "draft",
  ).length;
  const sentPosts = postsForSummary.filter(
    (post) => (post.status || "").toLowerCase() === "sent",
  );
  const archivedCount = postsForSummary.filter(
    (post) => (post.status || "").toLowerCase() === "archived",
  ).length;
  const sentTimestamps = sentPosts
    .map((post) => {
      const raw = (post as any).sentAt || post.createdAt;
      const time = raw ? new Date(raw).getTime() : NaN;
      return Number.isNaN(time) ? null : time;
    })
    .filter((time): time is number => time != null);
  const lastSentLabel =
    sentTimestamps.length > 0
      ? new Date(Math.max(...sentTimestamps)).toLocaleDateString()
      : "never";
  const filteredSocialPosts =
    socialPosts?.filter((post) => {
      if (!post) return false;

      if (postChannelFilter !== "all") {
        const channel = (post.channel || "").toLowerCase();
        if (channel !== postChannelFilter) return false;
      }

      if (postStatusFilter !== "all") {
        const status = (post.status || "").toLowerCase();
        if (postStatusFilter === "draft" && status !== "draft" && status !== "scheduled") {
          return false;
        }
        if (postStatusFilter === "sent" && status !== "sent") {
          return false;
        }
      }

      return true;
    }) || [];
  const displayedSocialPosts =
    postStatusFilter === "sent"
      ? [...filteredSocialPosts].sort((a, b) => {
          const aTime = a.sentAt ? Date.parse(a.sentAt) : 0;
          const bTime = b.sentAt ? Date.parse(b.sentAt) : 0;
          return bTime - aTime;
        })
      : filteredSocialPosts;
  const name = campaign.name || campaign.title || "Untitled campaign";
  const status = (campaign.status || campaign.state || "").toLowerCase();
  const createdAt = campaign.createdAt || campaign.startDate;
  const objective = campaign.objective || campaign.goal || campaign.description;
  const target =
    campaign.targetAudience ||
    campaign.targetDescription ||
    campaign.target ||
    campaign.audience;
  const notes = campaign.notes || campaign.description;

  const copyPostContent = async (postId: string | number, content: string) => {
    if (!content) return;
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(content);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand("copy");
        } finally {
          document.body.removeChild(textarea);
        }
      }

      setCopiedPostId(postId);
      window.setTimeout(() => {
        setCopiedPostId((current) => (current === postId ? null : current));
      }, 1500);
    } catch (e) {
      console.error("Failed to copy post content", e);
    }
  };

  const handleGenerateSuggestionsClick = () => {
    setAiSuggestionsCollapsed(false);
    if (onGenerateSuggestions) {
      onGenerateSuggestions();
    }
  };

  const statusClasses =
    "inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-medium " +
    (status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "paused" || status === "draft"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600");

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString() : null;

  return (
    <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Campaign
          </p>
          <h3 className="mt-1 text-lg font-semibold text-emerald-800 truncate">
            {name}
          </h3>
          {formattedDate && (
            <p className="mt-1 text-[11px] text-slate-500">
              Created {formattedDate}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {status && (
          <span className={statusClasses}>{status}</span>
        )}
        {campaign.endDate && (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-[3px] text-[11px] font-medium text-slate-600">
            Ends {new Date(campaign.endDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {objective && (
        <div className="mt-4 space-y-1">
          <p className="text-xs font-semibold text-slate-700">Objective</p>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {objective}
          </p>
        </div>
      )}

      {target && (
        <div className="mt-4 space-y-1">
          <p className="text-xs font-semibold text-slate-700">Target audience</p>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {target}
          </p>
        </div>
      )}

      {notes && (
        <div className="mt-4 space-y-1">
          <p className="text-xs font-semibold text-slate-700">Notes</p>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {notes}
          </p>
        </div>
      )}

      {!objective && !target && !notes && (
        <p className="mt-4 text-sm text-slate-500">
          No additional details provided for this campaign yet.
        </p>
      )}

      <div className="mt-6 border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-800">Social posts</h3>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <select
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={postChannelFilter}
              onChange={(e) =>
                setPostChannelFilter(
                  e.target.value as "all" | "linkedin" | "twitter" | "facebook" | "instagram",
                )
              }
            >
              <option value="all">All channels</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter / X</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>

            <select
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={postStatusFilter}
              onChange={(e) =>
                setPostStatusFilter(e.target.value as "all" | "draft" | "sent")
              }
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-2">
          {draftCount} drafts · {sentPosts.length} sent · {archivedCount} archived · last sent: {lastSentLabel}
        </p>

        {socialPostsLoading && (
          <p className="text-xs text-slate-500 mb-2">Loading posts...</p>
        )}
        {socialPostsError && (
          <p className="text-xs text-red-500 mb-2">{socialPostsError}</p>
        )}

        {!socialPostsLoading &&
          !socialPostsError &&
          (socialPosts?.length ?? 0) === 0 && (
            <p className="text-xs text-slate-500">
              No social posts yet for this campaign.
            </p>
          )}

        {filteredSocialPosts.length === 0 &&
          !socialPostsLoading &&
          !socialPostsError &&
          (socialPosts?.length ?? 0) > 0 && (
            <p className="text-xs text-slate-500">
              No posts match the current filters.
            </p>
          )}

        {displayedSocialPosts.length > 0 && (
          <div className="space-y-2">
            {displayedSocialPosts.map((post) => {
              const isUpdating = updatingPostId != null && updatingPostId === post.id;
              const isSent = post.status === "sent";
              const isArchived = post.status === "archived";
              const sentDateLabel = post.sentAt
                ? new Date(post.sentAt).toLocaleDateString()
                : null;

              return (
                <div
                  key={post.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-medium text-slate-700">
                      {post.channel || "Post"}
                    </span>
                    <div className="flex items-center gap-2">
                      {post.status && (
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium " +
                            (post.status === "sent"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600")
                          }
                        >
                          {post.status}
                        </span>
                      )}
                      {post.status === "sent" && (
                        <span className="text-[11px] text-slate-500">
                          {sentDateLabel ? `sent · ${sentDateLabel}` : "sent"}
                        </span>
                      )}
                    </div>
                  </div>
                  {post.createdAt && (
                    <p className="text-[11px] text-slate-500 mb-1">
                      {post.createdAt}
                    </p>
                  )}
                  <p className="text-xs text-slate-800 whitespace-pre-wrap mb-2">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <div className="ml-auto flex items-center gap-2">
                      {copiedPostId === post.id && (
                        <span className="text-[11px] text-emerald-600">Copied</span>
                      )}
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        onClick={() => copyPostContent(post.id, post.content)}
                      >
                        Copy
                      </button>

                      {onUpdatePostStatus && !isArchived && (
                        <>
                          {!isSent && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                              onClick={() => onUpdatePostStatus(post.id, "sent")}
                              disabled={isUpdating}
                            >
                              {isUpdating ? "Marking..." : "Mark as sent"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                            onClick={() => onUpdatePostStatus(post.id, "archived")}
                            disabled={isUpdating}
                          >
                            {isUpdating && isSent ? "Archiving..." : "Archive"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 border-t pt-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-800">
            AI suggestions
          </h3>
          {onGenerateSuggestions && (
            <button
              type="button"
              onClick={handleGenerateSuggestionsClick}
              disabled={postSuggestionsLoading}
              className="inline-flex items-center rounded-full bg-amber-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-amber-600 disabled:opacity-60"
            >
              {postSuggestionsLoading ? "Generating..." : "Generate suggestions"}
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mb-1">
          Save the posts you like into the Social posts list above.
        </p>
        {lastSaveMessage && (
          <p className="text-[11px] text-emerald-600 mb-1">
            {lastSaveMessage}
          </p>
        )}

        {postSuggestionsError && (
          <p className="text-xs text-red-500 mb-2">{postSuggestionsError}</p>
        )}

        {!postSuggestionsLoading &&
          !postSuggestionsError &&
          ((postSuggestions?.length ?? 0) === 0) &&
          ((socialPosts?.length ?? 0) === 0) && (
            <p className="text-xs text-slate-500">
              No AI suggestions yet. Click "Generate suggestions" to draft posts based on this campaign.
            </p>
          )}

        {postSuggestionsLoading && (
          <p className="text-xs text-slate-500 mb-2">
            Generating AI suggestions...
          </p>
        )}

        {!aiSuggestionsCollapsed &&
          postSuggestions &&
          postSuggestions.length > 0 && (
          <div className="mt-2 space-y-2">
            {postSuggestions.map((suggestion, index) => {
              const suggestionKey = suggestion.id ?? suggestion.channel ?? `suggestion-${index}`;
              const isSaving =
                savingSuggestionId != null &&
                savingSuggestionId === suggestionKey;

              return (
                <div
                  key={suggestion.id || `${suggestion.channel || "suggestion"}-${index}`}
                  className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-medium text-slate-700">
                      {suggestion.channel || "Suggested post"}
                    </span>
                    {suggestion.tone && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-[2px] text-[11px] font-medium text-amber-700">
                        {suggestion.tone}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap mb-2">
                    {suggestion.content}
                  </p>

                  {suggestion.imageIdea && (
                    <p className="text-[11px] text-slate-600 mb-2">
                      <span className="font-medium text-slate-700">Visual idea: </span>
                      {suggestion.imageIdea}
                    </p>
                  )}

                  {onSaveSuggestionAsPost && (
                    <div className="flex items-center justify-between gap-2">
                      {saveSuggestionError && (
                        <span className="text-[11px] text-red-500">
                          {saveSuggestionError}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onSaveSuggestionAsPost(suggestion)}
                        disabled={isSaving}
                        className="ml-auto inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save as post"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {aiSuggestionsCollapsed &&
          postSuggestions &&
          postSuggestions.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              Suggestions hidden. Click "Generate suggestions" to expand again.
            </p>
          )}

        {!aiSuggestionsCollapsed &&
          postSuggestions &&
          postSuggestions.length > 0 && (
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setAiSuggestionsCollapsed(true)}
              >
                Close suggestions
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
