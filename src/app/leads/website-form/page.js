"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

export default function WebsiteFormPage() {
  const { status } = useSession();
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/business-profiles")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load business profiles.");
        return res.json();
      })
      .then((data) => {
        setProfiles(data);
        setProfileId(data[0]?.id || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  const link = useMemo(() => profileId && typeof window !== "undefined" ? `${window.location.origin}/capture/${profileId}` : "", [profileId]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError("Couldn't copy automatically. Select and copy the link shown below.");
    }
  }

  if (status === "loading" || loading) return <main className="min-h-screen bg-bg-page px-6 py-16 text-center text-secondary-text">Loading website form settings…</main>;
  if (status !== "authenticated") return <main className="min-h-screen bg-bg-page px-6 py-16 text-center text-secondary-text">Please sign in first.</main>;

  return (
    <main className="min-h-screen bg-bg-page px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">LeadFlow AI</p>
          <h1 className="mt-2 text-3xl font-black text-primary-text">Website Lead Form</h1>
          <p className="mt-2 text-sm text-secondary-text">Share this link with visitors or add it to your business website. Submissions go directly to the selected business's Leads dashboard.</p>
        </div>
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
        <section className="rounded-xl border border-divider bg-bg-card p-5 space-y-4">
          <label className="block text-sm font-semibold text-primary-text" htmlFor="profile">Choose a business</label>
          <select id="profile" value={profileId} onChange={(e) => { setProfileId(e.target.value); setCopied(false); }} className="w-full rounded-lg border border-divider bg-bg-page px-3 py-3 text-sm text-primary-text">
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.businessName}</option>)}
          </select>
          {link ? <div className="space-y-2">
            <label className="block text-sm font-semibold text-primary-text">Your public form link</label>
            <input readOnly value={link} onFocus={(e) => e.target.select()} className="w-full rounded-lg border border-divider bg-bg-page px-3 py-3 text-sm text-primary-text" />
            <div className="flex flex-wrap gap-2">
              <button onClick={copyLink} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white">{copied ? "Copied!" : "Copy link"}</button>
              <a href={link} target="_blank" rel="noreferrer" className="rounded-lg border border-divider px-4 py-2.5 text-sm font-semibold text-primary-text">Preview form</a>
            </div>
          </div> : <p className="text-sm text-secondary-text">Create a business profile before creating a website form.</p>}
        </section>
        <p className="text-xs text-secondary-text">This first version collects a name, email, phone number, and service request. A submission is saved with the source “Website.”</p>
      </div>
    </main>
  );
}
