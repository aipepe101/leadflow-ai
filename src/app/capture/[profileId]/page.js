"use client";

import { useEffect, useState } from "react";

export default function PublicLeadCapturePage({ params }) {
  const [profileId, setProfileId] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", companyWebsite: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.resolve(params).then((value) => {
      setProfileId(value.profileId);
      setLoading(false);
    });
  }, [params]);

  useEffect(() => {
    if (!profileId) return;
    fetch(`/api/business-profiles/public?id=${encodeURIComponent(profileId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("This request form isn't available.");
        return res.json();
      })
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [profileId]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, businessProfileId: profileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Please try again.");
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-950 px-5 py-16 text-center text-slate-300">Loading form…</main>;
  if (!profile) return <main className="min-h-screen bg-slate-950 px-5 py-16 text-center text-slate-300">{error || "This form isn't available."}</main>;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">LeadFlow AI</p>
        <h1 className="mt-3 text-2xl font-bold">{profile.businessName}</h1>
        <p className="mt-2 text-sm text-slate-300">Tell us what you need and we'll get back to you.</p>
        {success ? (
          <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <h2 className="font-semibold text-emerald-300">Thanks! Your request has been sent.</h2>
            <p className="mt-1 text-sm text-slate-300">We'll be in touch as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="name">Your name *</label>
              <input id="name" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-sky-500" placeholder="Full name" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="email">Email</label>
              <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-sky-500" placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="phone">Phone</label>
              <input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-sky-500" placeholder="Your phone number" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="notes">How can we help?</label>
              <textarea id="notes" rows={4} maxLength={2000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-sky-500" placeholder="Describe the service you need (optional)" />
            </div>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="companyWebsite">Leave this field empty</label>
              <input id="companyWebsite" tabIndex={-1} autoComplete="off" value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} />
            </div>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <button disabled={saving} className="w-full rounded-lg bg-sky-500 px-4 py-3 text-sm font-bold text-white hover:bg-sky-400 disabled:opacity-60">{saving ? "Sending…" : "Send request"}</button>
            <p className="text-center text-xs text-slate-500">Please provide an email address or phone number so the business can contact you.</p>
          </form>
        )}
      </div>
    </main>
  );
}
