import { useState } from "react";
import type { Source, CreateProspectInput } from "../api";

interface ProspectManualFormProps {
  sources: Source[];
  defaultSourceId: string | null;
  onCreate: (input: CreateProspectInput) => Promise<void>;
  onClose: () => void;
}

function ProspectManualForm({
  sources,
  defaultSourceId,
  onCreate,
  onClose,
}: ProspectManualFormProps) {
  const [sourceId, setSourceId] = useState<string>(defaultSourceId ?? "");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"uncontacted" | "contacted" | "qualified" | "bad-fit">(
    "uncontacted",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !companyName.trim()) {
      setError("Please choose a source and enter a company name.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);

      await onCreate({
        sourceId,
        companyName: companyName.trim(),
        contactName: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        status,
      });

      onClose();
    } catch (err) {
      console.error("Failed to create prospect", err);
      setError("Could not create prospect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-800">Add prospect</h3>
        <button
          type="button"
          className="text-[11px] text-slate-500 hover:text-slate-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <p className="text-[11px] text-slate-500 mb-3">
        Create a single prospect manually. Use this for one-off leads, referrals, or inbound contacts.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Source
            </label>
            <select
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              <option value="">Select a source…</option>
              {sources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Status
            </label>
            <select
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "uncontacted" | "contacted" | "qualified" | "bad-fit",
                )
              }
            >
              <option value="uncontacted">Uncontacted</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="bad-fit">Bad fit</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Company
          </label>
          <input
            type="text"
            className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Contact
            </label>
            <input
              type="text"
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Phone
            </label>
            <input
              type="text"
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 1234 567890"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Website
            </label>
            <input
              type="text"
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="www.example.com"
            />
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-red-500">
            {error}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save prospect"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProspectManualForm;
