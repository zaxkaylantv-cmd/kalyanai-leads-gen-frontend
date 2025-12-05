import { useEffect, useRef, useState } from "react";
import Papa, { type ParseResult } from "papaparse";
import type { BulkProspectInput, Source } from "../api";
import { bulkImportProspects } from "../api";

function normalizeHeader(name: unknown): string {
  if (typeof name !== "string") return "";
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

function getCompanyFromWebsite(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (!value) return undefined;

  try {
    const url = value.startsWith("http") ? value : `https://${value}`;
    const { hostname } = new URL(url);
    const host = hostname.replace(/^www\./i, "");
    return host || undefined;
  } catch {
    return value;
  }
}

interface ProspectsCsvImportProps {
  sourceId: string | null;
  sources: Source[];
  onImported: () => void;
}

function ProspectsCsvImport({ sourceId, sources, onImported }: ProspectsCsvImportProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [parsedProspects, setParsedProspects] = useState<BulkProspectInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetSourceId, setTargetSourceId] = useState<string | null>(
    sourceId && sourceId !== "all" ? sourceId : null,
  );

  useEffect(() => {
    if (sourceId && sourceId !== "all") {
      setTargetSourceId(sourceId);
    }
  }, [sourceId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setRowCount(null);
    setPreviewRows([]);
    setParsedProspects([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<any>) => {
        console.log("CSV headers example row:", results.data?.[0]);
        const data = results.data as any[];

        const prospects: BulkProspectInput[] = data
          .map((rawRow) => {
            const row: Record<string, any> = rawRow || {};

            const normalized: Record<string, any> = {};
            Object.keys(row).forEach((key) => {
              normalized[normalizeHeader(key)] = row[key];
            });

            const companyNameRaw =
              normalized["company_name"] ?? normalized["company"] ?? normalized["companyname"];
            let companyName = companyNameRaw ? String(companyNameRaw).trim() : "";

            const contactRaw =
              normalized["contact_name"] ??
              normalized["contact"] ??
              normalized["name"] ??
              [normalized["first_name"] ?? "", normalized["last_name"] ?? ""]
                .filter(Boolean)
                .join(" ");
            const contactName = contactRaw ? String(contactRaw).trim() : undefined;

            const emailRaw =
              normalized["email"] ?? normalized["email_address"] ?? normalized["e_mail"];
            const email = emailRaw ? String(emailRaw).trim() : undefined;

            const phoneRaw =
              normalized["phone"] ?? normalized["phone_number"] ?? normalized["telephone"];
            const phone = phoneRaw ? String(phoneRaw).trim() : undefined;

            const websiteRaw =
              normalized["website"] ?? normalized["url"] ?? normalized["domain"];
            const website = websiteRaw ? String(websiteRaw).trim() : undefined;

            if (!companyName) {
              const fromWebsite = getCompanyFromWebsite(website);
              if (fromWebsite) {
                companyName = fromWebsite;
              } else if (contactName) {
                companyName = contactName;
              } else if (email) {
                companyName = email;
              }
            }

            if (!companyName && !contactName && !email && !phone && !website) {
              return null;
            }

            const prospect: BulkProspectInput = {
              companyName: companyName || "Unknown company",
              contactName,
              email,
              phone,
              website,
            };

            return prospect;
          })
          .filter((p): p is BulkProspectInput => p !== null);

        setParsedProspects(prospects);
        setRowCount(prospects.length);

        const preview = data.slice(0, 5).map((rawRow) => {
          const row: Record<string, any> = rawRow || {};
          const normalized: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            normalized[normalizeHeader(key)] = row[key];
          });

          const company =
            normalized["company_name"] ?? normalized["company"] ?? normalized["companyname"] ?? "";
          const contact =
            normalized["contact_name"] ??
            normalized["contact"] ??
            normalized["name"] ??
            [normalized["first_name"] ?? "", normalized["last_name"] ?? ""]
              .filter(Boolean)
              .join(" ");
          const email =
            normalized["email"] ?? normalized["email_address"] ?? normalized["e_mail"] ?? "";
          const phone =
            normalized["phone"] ?? normalized["phone_number"] ?? normalized["telephone"] ?? "";
          const website =
            normalized["website"] ?? normalized["url"] ?? normalized["domain"] ?? "";

          return [company, contact, email, phone, website];
        });
        setPreviewRows(preview);

        if (prospects.length === 0) {
          setError(
            "No usable prospects were found. Check that your CSV at least has a company, contact, email or website column and try again.",
          );
        }
      },
      error: (err: any) => {
        console.error("CSV parse error", err);
        setError("Could not parse CSV file.");
      },
    });
  };

  const handleImport = async () => {
    if (!parsedProspects.length) return;

    if (!targetSourceId) {
      setError("Please choose a source to import into.");
      return;
    }
    try {
      setImporting(true);
      setError(null);
      await bulkImportProspects(targetSourceId, parsedProspects);
      onImported();
    } catch (err) {
      console.error("Bulk import failed", err);
      setError("Bulk import failed. Please check the file and try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3">
      <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-[0.18em]">
        Import CSV
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        Upload a CSV with headers: company_name, contact_name, email, phone, website.
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="text-[11px] font-medium text-slate-600">
          Import into source:
        </label>
        <select
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
          value={targetSourceId || ""}
          onChange={(e) =>
            setTargetSourceId(e.target.value ? e.target.value : null)
          }
        >
          <option value="">Select a source…</option>
          {sources.map((src) => (
            <option key={src.id} value={src.id}>
              {src.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose CSV file
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {fileName && (
          <span className="text-[11px] text-slate-500 truncate">
            {fileName}
          </span>
        )}
      </div>

      {rowCount != null && (
        <p className="mt-2 text-[11px] text-slate-600">
          Parsed {rowCount} prospects from this file.
        </p>
      )}

      {previewRows.length > 0 && (
        <div className="mt-2 rounded-xl bg-white border border-slate-100 overflow-hidden">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-[11px] text-slate-500">
                <th className="px-3 py-1 text-left">Company</th>
                <th className="px-3 py-1 text-left">Contact</th>
                <th className="px-3 py-1 text-left">Email</th>
                <th className="px-3 py-1 text-left">Phone</th>
                <th className="px-3 py-1 text-left">Website</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx} className="text-[11px] text-slate-700">
                  {row.map((cell, i) => (
                    <td key={i} className="px-3 py-1">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[11px] text-red-500">
          {error}
        </p>
      )}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          onClick={handleImport}
          disabled={!parsedProspects.length || !targetSourceId || importing}
        >
          {importing ? "Importing…" : "Import prospects"}
        </button>
      </div>
    </div>
  );
}

export default ProspectsCsvImport;
