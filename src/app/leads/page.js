"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FiUsers, FiPlus, FiSearch, FiRefreshCw, FiPhone, FiMail, FiTrash2 } from "react-icons/fi";

const STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Lost" },
];

const statusStyles = {
  NEW: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  CONTACTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  QUALIFIED: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  CONVERTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  LOST: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function LeadsPage() {
  const { status: authStatus } = useSession();
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState("");
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "Manual entry", notes: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const profileRes = await fetch("/api/business-profiles");
      if (!profileRes.ok) throw new Error("Could not load your business profiles.");
      const profileData = await profileRes.json();
      setProfiles(profileData);
      const activeProfile = profileId && profileData.some((p) => p.id === profileId) ? profileId : profileData[0]?.id || "";
      setProfileId(activeProfile);
      if (!activeProfile) {
        setLeads([]);
        return;
      }
      const leadRes = await fetch(`/api/leads?businessProfileId=${encodeURIComponent(activeProfile)}`);
      if (!leadRes.ok) throw new Error("Could not load leads.");
      setLeads(await leadRes.json());
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (authStatus === "authenticated") loadData();
  }, [authStatus, loadData]);

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
    const term = search.toLowerCase().trim();
    const matchesSearch = !term || [lead.name, lead.email, lead.phone, lead.source].some((v) => String(v || "").toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  }), [leads, statusFilter, search]);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === "NEW").length,
    active: leads.filter((l) => ["CONTACTED", "QUALIFIED"].includes(l.status)).length,
    converted: leads.filter((l) => l.status === "CONVERTED").length,
  }), [leads]);

  async function addLead(e) {
    e.preventDefault();
    if (!profileId || !form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, businessProfileId: profileId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save lead.");
      setLeads((prev) => [data, ...prev]);
      setForm({ name: "", email: "", phone: "", source: "Manual entry", notes: "" });
      setShowForm(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, nextStatus) {
    try {
      const res = await fetch("/api/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setLeads((prev) => prev.map((lead) => lead.id === id ? data : lead));
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteLead(id) {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete lead.");
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (authStatus === "loading" || loading) return <main className="min-h-screen bg-bg-page px-6 py-16 text-center text-secondary-text">Loading your lead dashboard…</main>;
  if (authStatus !== "authenticated") return <main className="min-h-screen bg-bg-page px-6 py-16 text-center text-secondary-text">Please sign in to manage leads.</main>;

  return (
    <main className="min-h-screen bg-bg-page px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">LeadFlow AI</p>
            <h1 className="mt-2 text-3xl font-black text-primary-text">Lead Dashboard</h1>
            <p className="mt-1 text-sm text-secondary-text">Keep every opportunity organized and moving toward a sale.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-divider px-4 py-2.5 text-sm font-semibold text-primary-text hover:bg-bg-card"><FiRefreshCw /> Refresh</button>
            <button onClick={() => setShowForm((v) => !v)} disabled={!profileId} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><FiPlus /> Add Lead</button>
          </div>
        </header>

        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

        <section className="rounded-xl border border-divider bg-bg-card p-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-secondary-text">Active Business</label>
          {profiles.length ? <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className="w-full max-w-md rounded-lg border border-divider bg-bg-page px-3 py-2.5 text-sm text-primary-text">{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.businessName}</option>)}</select> : <p className="text-sm text-secondary-text">Create a business profile first to manage its leads.</p>}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total Leads", stats.total, "All opportunities"],
            ["New Leads", stats.new, "Needs first contact"],
            ["Active", stats.active, "Contacted or qualified"],
            ["Converted", stats.converted, "Won customers"],
          ].map(([label, value, sub]) => <div key={label} className="rounded-xl border border-divider bg-bg-card p-5"><p className="text-sm text-secondary-text">{label}</p><p className="mt-2 text-3xl font-black text-primary-text">{value}</p><p className="mt-1 text-xs text-secondary-text">{sub}</p></div>)}
        </section>

        {showForm && <form onSubmit={addLead} className="rounded-xl border border-primary/30 bg-bg-card p-5 space-y-4">
          <h2 className="text-lg font-bold text-primary-text">Add a lead</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-semibold text-secondary-text">Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-divider bg-bg-page px-3 py-2.5 text-sm text-primary-text" placeholder="Customer name" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-secondary-text">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-divider bg-bg-page px-3 py-2.5 text-sm text-primary-text" placeholder="name@email.com" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-secondary-text">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-divider bg-bg-page px-3 py-2.5 text-sm text-primary-text" placeholder="Phone number" /></div>
            <div><label className="mb-1 block text-xs font-semibold text-secondary-text">Lead source</label><select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full rounded-lg border border-divider bg-bg-page px-3 py-2.5 text-sm text-primary-text">{["Manual entry", "Website", "Google", "Facebook", "Instagram", "Referral", "Phone", "Other"].map((source) => <option key={source}>{source}</option>)}</select></div>
          </div>
          <div><label className="mb-1 block text-xs font-semibold text-secondary-text">Notes</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-divider bg-bg-page px-3 py-2.5 text-sm text-primary-text" placeholder="What does this prospect need?" /></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-divider px-4 py-2 text-sm font-semibold text-secondary-text">Cancel</button><button disabled={saving} type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save Lead"}</button></div>
        </form>}

        <section className="rounded-xl border border-divider bg-bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads…" className="w-full rounded-lg border border-divider bg-bg-page py-2.5 pl-9 pr-3 text-sm text-primary-text" /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-divider bg-bg-page px-3 py-2.5 text-sm text-primary-text"><option value="ALL">All statuses</option>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          </div>
          <div className="mt-4 overflow-x-auto">
            {filteredLeads.length ? <table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-divider text-xs uppercase tracking-wider text-secondary-text"><th className="pb-3 pr-4">Lead</th><th className="pb-3 pr-4">Source</th><th className="pb-3 pr-4">Added</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Actions</th></tr></thead><tbody>{filteredLeads.map((lead) => <tr key={lead.id} className="border-b border-divider/60 last:border-0"><td className="py-4 pr-4"><div className="font-semibold text-primary-text">{lead.name}</div>{lead.email && <a href={`mailto:${lead.email}`} className="mt-1 flex items-center gap-1 text-xs text-secondary-text hover:text-primary"><FiMail />{lead.email}</a>}{lead.phone && <a href={`tel:${lead.phone}`} className="mt-1 flex items-center gap-1 text-xs text-secondary-text hover:text-primary"><FiPhone />{lead.phone}</a>}{lead.notes && <p className="mt-1 max-w-xs truncate text-xs text-secondary-text">{lead.notes}</p>}</td><td className="py-4 pr-4 text-secondary-text">{lead.source}</td><td className="py-4 pr-4 text-secondary-text">{new Date(lead.createdAt).toLocaleDateString()}</td><td className="py-4 pr-4"><select value={lead.status} onChange={(e) => updateStatus(lead.id, e.target.value)} className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[lead.status] || ""}`}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></td><td className="py-4 text-right"><button onClick={() => deleteLead(lead.id)} title="Delete lead" className="rounded p-2 text-secondary-text hover:bg-red-500/10 hover:text-red-400"><FiTrash2 /></button></td></tr>)}</tbody></table> : <div className="py-12 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><FiUsers size={22} /></div><h3 className="font-bold text-primary-text">{leads.length ? "No matching leads" : "Your leads will appear here"}</h3><p className="mt-1 text-sm text-secondary-text">{leads.length ? "Try a different search or status filter." : "Add your first lead to start tracking prospects."}</p>{!leads.length && <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"><FiPlus /> Add your first lead</button>}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
