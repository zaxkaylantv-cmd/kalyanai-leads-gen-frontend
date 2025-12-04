import { useState } from "react";
import type {
  Prospect,
  ProspectEnrichmentPreview,
  ProspectStatus,
  ProspectNote,
} from "../api";

interface ProspectDetailPanelProps {
  prospect: Prospect;
  enrichment?: ProspectEnrichmentPreview;
  onClose: () => void;
  onChangeStatus: (newStatus: ProspectStatus) => void;
  updatingStatus?: boolean;
  updateStatusError?: string | null;
  notes: ProspectNote[];
  notesLoading?: boolean;
  notesError?: string | null;
  onAddNote: (content: string) => void;
  addingNote?: boolean;
  addNoteError?: string | null;
  onPushToLeadDesk: () => void;
  pushingToLeadDesk?: boolean;
  pushToLeadDeskError?: string | null;
  lastPushedLeadDeskId?: string | null;
}

export function ProspectDetailPanel({
  prospect,
  enrichment,
  onClose,
  onChangeStatus,
  updatingStatus,
  updateStatusError,
  notes,
  notesLoading,
  notesError,
  onAddNote,
  addingNote,
  addNoteError,
  onPushToLeadDesk,
  pushingToLeadDesk,
  pushToLeadDeskError,
  lastPushedLeadDeskId,
}: ProspectDetailPanelProps) {
  const [noteDraft, setNoteDraft] = useState("");
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

  const companyName = prospect.companyName || "this company";
  const contactName = prospect.contactName || "there";
  const primaryPain = enrichment?.primaryPain;
  const summary = enrichment?.summary;
  const fitLabelScore = enrichment ? `${enrichment.fitLabel} · ${enrichment.fitScore}` : null;

  const callScriptLines = [
    `Hi ${contactName}, it’s Kalyan AI.`,
    `I’m reaching out because it looks like ${companyName} may be ${primaryPain || "juggling too many manual processes"}.`,
    `Kalyan AI offers bespoke hosted AI software to automate processes and streamline operations, saving time and money, improving customer experience and increasing profit without taking on new staff.`,
    summary ? `From what we see: ${summary}` : `We can start small with a simple workflow to free time and keep leads warm.`,
    `I’d love to learn how you’re handling this today and see if a lightweight approach would help.`,
  ];

  const emailSubject = primaryPain
    ? `Idea to help ${companyName} with ${primaryPain}`
    : `Quick idea for ${companyName}`;

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 px-4 py-4 md:px-5 md:py-5 overflow-y-auto max-h-[70vh]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[#49a682]">
            {prospect.companyName || prospect.contactName || "Prospect"}
          </h3>
          <p className="text-sm text-slate-600">
            {prospect.contactName || "No contact"} {prospect.role ? `(${prospect.role})` : ""}
          </p>
          {prospect.email && (
            <p className="text-xs text-slate-500">{prospect.email}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-700 rounded-full border border-slate-200 px-2 py-1"
        >
          Close
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <span className={statusClasses}>{status}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="text-xs rounded-full border px-3 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={prospect.status}
              onChange={(e) => onChangeStatus(e.target.value as ProspectStatus)}
              disabled={updatingStatus}
            >
              <option value="uncontacted">Uncontacted</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="bad-fit">Bad fit</option>
            </select>
          </div>
          <button
            type="button"
            onClick={onPushToLeadDesk}
            disabled={pushingToLeadDesk}
            className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {pushingToLeadDesk ? "Sending…" : "Send to Lead Desk"}
          </button>
        </div>
        {updatingStatus && (
          <p className="text-xs text-slate-500">Updating status…</p>
        )}
        {updateStatusError && (
          <p className="text-xs text-red-500">{updateStatusError}</p>
        )}
        {pushToLeadDeskError && (
          <p className="text-xs text-red-500">{pushToLeadDeskError}</p>
        )}
        {lastPushedLeadDeskId && !pushToLeadDeskError && (
          <p className="text-xs text-emerald-600">
            Sent to Lead Desk (id: {lastPushedLeadDeskId}).
          </p>
        )}
      </div>

      {enrichment ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            {fitLabelScore && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {fitLabelScore}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Primary pain
            </p>
            <p className="text-sm text-slate-700">{enrichment.primaryPain}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              AI summary
            </p>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {enrichment.summary}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No AI enrichment yet for this prospect.
        </p>
      )}

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[#49a682]">Call script</h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Use this as a starting point for your next call.
          </p>
          <div className="mt-2 space-y-1 text-sm text-slate-700 leading-relaxed">
            {callScriptLines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[#49a682]">Email draft</h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Copy, tweak, and send to this prospect.
          </p>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <p className="font-semibold">Subject: {emailSubject}</p>
            <div className="space-y-2">
              <p>Hi {contactName},</p>
              <p>
                We’ve been looking at how {companyName} runs outreach and operations. It seems like{" "}
                {primaryPain || "there’s room to streamline the manual steps and follow-ups"}.
              </p>
              <p>
                Kalyan AI offers bespoke hosted AI software to automate processes and streamline operations, saving time and money, improving customer experience and increasing profit without taking on new staff. Would you be open to a quick 15–20 minute chat to see if this could help?
              </p>
              <p>Best regards,<br />Kalyan AI</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Notes</h3>

          {notesLoading && (
            <p className="text-xs text-slate-500 mb-2">Loading notes…</p>
          )}
          {notesError && (
            <p className="text-xs text-red-500 mb-2">{notesError}</p>
          )}

          <div className="mb-3">
            <textarea
              className="w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              rows={3}
              placeholder="Log what happened on the call or any next steps…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              disabled={addingNote}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              {addNoteError && (
                <span className="text-xs text-red-500">{addNoteError}</span>
              )}
              <button
                type="button"
                className="ml-auto inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
                onClick={() => {
                  if (!noteDraft.trim() || addingNote) return;
                  onAddNote(noteDraft);
                  setNoteDraft("");
                }}
                disabled={addingNote || !noteDraft.trim()}
              >
                {addingNote ? "Saving…" : "Add note"}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notes.length === 0 && !notesLoading && (
              <p className="text-xs text-slate-500">No notes yet for this prospect.</p>
            )}
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                {note.createdAt && (
                  <p className="text-[11px] text-slate-500 mb-1">
                    {note.createdAt}
                  </p>
                )}
                <p className="text-xs text-slate-800 whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
