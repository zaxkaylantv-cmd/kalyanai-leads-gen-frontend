import type { Campaign as ApiCampaign, SocialPost } from "../api";

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
}

export function CampaignDetailPanel({
  campaign,
  onClose,
  socialPosts,
  socialPostsLoading,
  socialPostsError,
}: CampaignDetailPanelProps) {
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

  const statusClasses =
    "inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-medium " +
    (status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "paused" || status === "draft"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600");

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString() : null;

  return (
    <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-4 sm:p-6 max-h-[420px] overflow-y-auto">
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
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Social posts</h3>

        {socialPostsLoading && (
          <p className="text-xs text-slate-500 mb-2">Loading posts…</p>
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

        {socialPosts && socialPosts.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {socialPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-medium text-slate-700">
                    {post.channel || "Post"}
                  </span>
                  {post.status && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-[2px] text-[11px] font-medium text-emerald-700">
                      {post.status}
                    </span>
                  )}
                </div>
                {post.createdAt && (
                  <p className="text-[11px] text-slate-500 mb-1">
                    {post.createdAt}
                  </p>
                )}
                <p className="text-xs text-slate-800 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
