import { useEffect, useState } from "react";
import {
  fetchCampaigns,
  fetchPostSuggestionsForCampaign,
  fetchProspects,
  fetchSocialPosts,
  fetchSources,
} from "./api";
import type {
  Campaign,
  Prospect,
  SocialPost,
  SocialPostSuggestion,
  Source,
} from "./api";

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialSuggestions, setSocialSuggestions] = useState<SocialPostSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [sourcesData, prospectsData, campaignsData, postsData] = await Promise.all([
          fetchSources(),
          fetchProspects(),
          fetchCampaigns(),
          fetchSocialPosts(),
        ]);

        if (!isMounted) return;

        setSources(sourcesData);
        setProspects(prospectsData);
        setCampaigns(campaignsData);
        setSocialPosts(postsData);
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
  }, []);

  const primarySource = sources[0];
  const primaryCampaign = campaigns[0];
  const postsForPrimaryCampaign = primaryCampaign
    ? socialPosts.filter((post) => post.campaignId === primaryCampaign.id)
    : [];
  const campaignsCount = campaigns.length;
  const sourcesCount = sources.length;
  const prospectsCount = prospects.length;

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

  return (
    <div className="min-h-screen bg-[#f5fbff] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
              <span className="text-sm font-semibold text-cyan-600">KA</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium tracking-[0.18em] uppercase text-slate-400">
                Kalyan AI
              </p>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                Lead Generation Engine
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
            >
              <span>All time</span>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-600">
              KA
            </div>
          </div>
        </header>

        <nav className="mt-4 rounded-full bg-white shadow-sm border border-slate-100 px-1 py-1 flex flex-wrap items-center gap-1">
          <button className="rounded-full bg-cyan-500 text-white text-xs font-medium px-3 py-1.5 shadow-sm">
            Dashboard
          </button>
          <button className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
            Campaigns
          </button>
          <button className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
            Prospects
          </button>
          <button className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
            Settings
          </button>
        </nav>

        <main className="mt-4">
          <section className="rounded-3xl bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] border border-slate-100 px-4 py-5 md:px-6 md:py-6 space-y-5 md:space-y-6">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400">
                Overview
              </p>
              <h2 className="text-lg md:text-xl font-semibold tracking-tight">
                Dashboard
              </h2>
              <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
                A clear, AI-supported view of your campaigns, sources, and prospects, plus suggested content to keep your funnel warm.
              </p>
            </div>

            <div className="grid gap-3 md:gap-4 md:grid-cols-3 mt-4">
              <div className="rounded-2xl bg-gradient-to-b from-cyan-100/80 via-white to-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] p-[1.5px]">
                <div className="rounded-[1rem] bg-white border border-slate-100 px-4 py-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                      Active campaigns
                    </p>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-[13px] text-cyan-500">
                      📣
                    </span>
                  </div>
                  <p className="text-2xl font-semibold">{campaignsCount}</p>
                  <p className="text-[11px] text-slate-500">
                    Driving AI-powered outreach.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-b from-cyan-100/80 via-white to-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] p-[1.5px]">
                <div className="rounded-[1rem] bg-white border border-slate-100 px-4 py-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                      Lead sources
                    </p>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-[13px] text-cyan-500">
                      📇
                    </span>
                  </div>
                  <p className="text-2xl font-semibold">{sourcesCount}</p>
                  <p className="text-[11px] text-slate-500">
                    Lists feeding this engine.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-b from-cyan-100/80 via-white to-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] p-[1.5px]">
                <div className="rounded-[1rem] bg-white border border-slate-100 px-4 py-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                      Prospects
                    </p>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-[13px] text-cyan-500">
                      🧲
                    </span>
                  </div>
                  <p className="text-2xl font-semibold">{prospectsCount}</p>
                  <p className="text-[11px] text-slate-500">
                    People we can turn into opportunities.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] md:items-start">
              <div className="space-y-4 md:space-y-5">
                <section className="rounded-2xl bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] border border-cyan-50 px-4 py-4 md:px-5 md:py-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-sm font-semibold text-slate-900">Campaigns</h2>
                    {primaryCampaign && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                        active
                      </span>
                    )}
                  </div>

                  {loading && (
                    <p className="text-xs text-slate-500">Loading campaigns…</p>
                  )}
                  {error && (
                    <p className="text-xs text-red-500">{error}</p>
                  )}

                  {!loading && !error && primaryCampaign && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">{primaryCampaign.name}</p>
                      {primaryCampaign.objective && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {primaryCampaign.objective}
                        </p>
                      )}
                      {primaryCampaign.targetDescription && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Target: {primaryCampaign.targetDescription}
                        </p>
                      )}
                    </div>
                  )}

                  {!loading && !error && !primaryCampaign && (
                    <p className="text-xs text-slate-500">
                      No campaigns yet. We will use this area to plan and track AI-powered lead generation campaigns.
                    </p>
                  )}
                </section>

                <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4 md:px-5 md:py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Social posts</h2>
                      {primaryCampaign && (
                        <p className="text-xs text-slate-500">
                          For campaign: <span className="font-medium text-slate-900">{primaryCampaign.name}</span>
                        </p>
                      )}
                    </div>
                    {primaryCampaign && (
                      <button
                        type="button"
                        onClick={handleGenerateSuggestions}
                        className={
                          "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[11px] font-medium shadow-sm transition " +
                          (suggestionsLoading
                            ? "bg-slate-200 text-slate-500 cursor-wait"
                            : "bg-cyan-500 text-white hover:bg-cyan-600")
                        }
                        disabled={suggestionsLoading}
                      >
                        {suggestionsLoading ? "Generating…" : "Generate AI suggestions"}
                      </button>
                    )}
                  </div>

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
                          className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 hover:border-cyan-100 hover:bg-cyan-50/60 transition"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize">
                              {post.channel || "linkedin"}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-600">
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
                              className="rounded-lg border border-dashed border-cyan-200 bg-white px-3 py-2 hover:border-cyan-400/70 transition"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="capitalize">
                                  {s.channel || "linkedin"}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-600">
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
                      No posts yet for this campaign. Soon we’ll let AI draft and schedule posts from here.
                    </p>
                  )}

                  {!loading && !error && !primaryCampaign && (
                    <p className="mt-1 text-xs text-slate-500">
                      Create a campaign to start planning social posts.
                    </p>
                  )}
                </section>

                <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4 md:px-5 md:py-4">
                  <h2 className="text-sm font-semibold tracking-tight mb-2 text-slate-900">Sources</h2>
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
                    </div>
                  )}
                  {!loading && !error && !primarySource && (
                    <p className="mt-2 text-xs text-slate-500">
                      No sources yet. We’ll add import options later.
                    </p>
                  )}
                </section>

                <section className="rounded-2xl bg-white shadow-sm border border-dashed border-cyan-100 px-4 py-4 md:px-5 md:py-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h2 className="text-sm font-semibold tracking-tight text-slate-900">LinkedIn (coming soon)</h2>
                    <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-600">
                      planned
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Planned LinkedIn automation will capture saved profiles, monitor outreach, and sync replies directly into your prospect list.
                  </p>
                </section>
              </div>

                <section className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4 md:px-5 md:py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-slate-900">Prospects</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Prospects for the selected source will appear here once data is connected.
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
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-white">
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
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {prospects.map((prospect) => (
                          <tr key={prospect.id}>
                            <td className="px-3 py-2 border-t border-slate-100">
                              {prospect.companyName || "-"}
                            </td>
                            <td className="px-3 py-2 border-t border-slate-100">
                              {prospect.contactName
                                ? prospect.role
                                  ? `${prospect.contactName} (${prospect.role})`
                                  : prospect.contactName
                                : "-"}
                            </td>
                            <td className="px-3 py-2 border-t border-slate-100">
                              {(() => {
                                const status = prospect.status || "unknown";
                                let statusClasses =
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
                                if (status === "uncontacted") {
                                  statusClasses += " bg-cyan-50 text-cyan-700";
                                } else if (status === "contacted") {
                                  statusClasses += " bg-sky-50 text-sky-700";
                                } else if (status === "qualified") {
                                  statusClasses += " bg-emerald-50 text-emerald-700";
                                } else {
                                  statusClasses += " bg-slate-100 text-slate-700";
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
                )}
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
