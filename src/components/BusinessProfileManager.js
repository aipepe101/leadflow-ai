"use client";

import { useCallback, useEffect, useState } from "react";

const INDUSTRIES = [
  { id: "plumbing", label: "Plumbing" },
  { id: "mobile-detailing", label: "Mobile Detailing" },
];

export default function BusinessProfileManager({ onProfileChange }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    businessName: "", industry: "plumbing", serviceArea: "", services: "", phone: "", website: "", brandVoice: "",
  });

  const loadProfiles = useCallback(async () => {
    try {
      const response = await fetch("/api/business-profiles");
      if (!response.ok) throw new Error("Could not load business profiles.");
      const data = await response.json();
      setProfiles(data);
      setSelectedId((current) => {
        const nextId = current && data.some((profile) => profile.id === current)
          ? current : (data[0]?.id || "");
        onProfileChange?.(data.find((profile) => profile.id === nextId) || null);
        return nextId;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onProfileChange]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const chooseProfile = (id) => {
    setSelectedId(id);
    onProfileChange?.(profiles.find((profile) => profile.id === id) || null);
  };

  const createProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/business-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, services: form.services.split(",").map((service) => service.trim()).filter(Boolean) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create profile.");
      const next = [...profiles, data];
      setProfiles(next);
      setSelectedId(data.id);
      onProfileChange?.(data);
      setShowForm(false);
      setForm({ businessName: "", industry: "plumbing", serviceArea: "", services: "", phone: "", website: "", brandVoice: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selected = profiles.find((profile) => profile.id === selectedId);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Your businesses</p>
          <p className="text-xs text-zinc-500 mt-1">Keep each business's content and details separate.</p>
        </div>
        <button type="button" onClick={() => setShowForm((value) => !value)} className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20">
          {showForm ? "Close" : "+ Add business"}
        </button>
      </div>

      {loading ? <p className="text-xs text-zinc-500">Loading profiles…</p> : (
        <div className="flex flex-wrap gap-2">
          {profiles.map((profile) => (
            <button key={profile.id} type="button" onClick={() => chooseProfile(profile.id)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${selectedId === profile.id ? "border-purple-500/50 bg-purple-500/15 text-purple-200" : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"}`}>
              {profile.businessName} <span className="ml-1 opacity-60">· {INDUSTRIES.find((item) => item.id === profile.industry)?.label || profile.industry}</span>
            </button>
          ))}
          {profiles.length === 0 && <p className="text-xs text-zinc-500">Add your first business to tailor generated posts to its services and customers.</p>}
        </div>
      )}

      {selected && (
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-xs font-semibold text-zinc-200">Generating for: {selected.businessName}</p>
          <p className="mt-1 text-[11px] text-zinc-500">{selected.serviceArea || "Service area not set"}{selected.services?.length ? " · " + selected.services.join(", ") : ""}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={createProfile} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
          <label className="text-xs text-zinc-400 sm:col-span-2">Business name
            <input required maxLength={100} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="e.g. Coastal Plumbing" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
          </label>
          <label className="text-xs text-zinc-400">Industry
            <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white">
              {INDUSTRIES.map((industry) => <option key={industry.id} value={industry.id}>{industry.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-zinc-400">Service area
            <input value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} placeholder="e.g. West Palm Beach" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
          </label>
          <label className="text-xs text-zinc-400 sm:col-span-2">Services (separate with commas)
            <input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="Drain cleaning, leak repairs, water heaters" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
          </label>
          <label className="text-xs text-zinc-400">Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
          </label>
          <label className="text-xs text-zinc-400">Website
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
          </label>
          <label className="text-xs text-zinc-400 sm:col-span-2">Brand voice (optional)
            <input value={form.brandVoice} onChange={(e) => setForm({ ...form, brandVoice: e.target.value })} placeholder="Friendly, reliable, local, and professional" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500" />
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={saving} className="rounded-lg bg-purple-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save business profile"}</button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-xs text-rose-400">{error}</p>}
    </section>
  );
}
