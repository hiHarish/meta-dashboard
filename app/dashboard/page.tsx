"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  campaign: string | null;
  ad: string | null;
  form: string | null;
  status: string;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type LeadForm = {
  name: string;
  phone: string;
  email: string;
  campaign: string;
  ad: string;
  form: string;
  status: string;
};

const statuses = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "converted",
  "not_interested",
  "invalid",
];

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Follow Up",
  converted: "Converted",
  not_interested: "Not Interested",
  invalid: "Invalid",
};

const emptyForm: LeadForm = {
  name: "",
  phone: "",
  email: "",
  campaign: "",
  ad: "",
  form: "",
  status: "new",
};

function formatDate(date: string) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "contacted":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "interested":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "follow_up":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "converted":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "not_interested":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "invalid":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default function DashboardPage() {
  const { data: session, isPending: sessionLoading } =
    authClient.useSession();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  const role =
    (session?.user as { role?: string } | undefined)?.role || "";

  const userName = session?.user?.name || session?.user?.email || "User";

  const canDelete = role === "admin" || role === "manager";

  async function loadLeads(targetPage = page) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(targetPage));
      params.set("limit", "50");

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status) {
        params.set("status", status);
      }

      const response = await fetch(`/api/leads?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load leads");
      }

      const data = await response.json();

      const loadedLeads = Array.isArray(data)
        ? data
        : data.leads || data.data || [];

      setLeads(loadedLeads);

      const total =
        data.total ??
        data.count ??
        data.pagination?.total ??
        loadedLeads.length;

      const calculatedPages =
        data.totalPages ??
        data.pagination?.totalPages ??
        Math.max(1, Math.ceil(Number(total) / 50));

      setTotalLeads(Number(total));
      setTotalPages(Number(calculatedPages) || 1);
    } catch (err) {
      console.error(err);
      setError("Unable to load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionLoading || !session) return;

    loadLeads(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, session, page, status]);

  async function createLead(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          campaign: form.campaign || null,
          ad: form.ad || null,
          form: form.form || null,
          status: form.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to create lead");
      }

      setShowCreate(false);
      setForm(emptyForm);
      setPage(1);

      await loadLeads(1);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to create lead.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateLead(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedLead) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          campaign: form.campaign || null,
          ad: form.ad || null,
          form: form.form || null,
          status: form.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update lead");
      }

      setShowEdit(false);
      setSelectedLead(null);

      await loadLeads(page);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to update lead.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(leadId: number, newStatus: string) {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId
            ? { ...lead, status: newStatus }
            : lead,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update lead status.");
    }
  }

  async function deleteLead(id: number) {
    if (!canDelete) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?",
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lead");
      }

      await loadLeads(page);
    } catch (err) {
      console.error(err);
      setError("Failed to delete lead.");
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setShowCreate(true);
  }

  function openEdit(lead: Lead) {
    setSelectedLead(lead);

    setForm({
      name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      campaign: lead.campaign || "",
      ad: lead.ad || "",
      form: lead.form || "",
      status: lead.status || "new",
    });

    setShowEdit(true);
  }

  function openView(lead: Lead) {
    setSelectedLead(lead);
    setShowView(true);
  }

  function handleSearch() {
    setPage(1);
    loadLeads(1);
  }

  const newCount = leads.filter((lead) => lead.status === "new").length;
  const interestedCount = leads.filter(
    (lead) => lead.status === "interested",
  ).length;
  const convertedCount = leads.filter(
    (lead) => lead.status === "converted",
  ).length;

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center text-slate-600">
        Please login to continue.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex w-[250px] flex-col bg-white border-r border-slate-200">
          <div className="px-6 py-6 border-b border-slate-100">
            <div className="text-2xl font-black tracking-tight text-[#123b7a]">
              NDC
            </div>

            <div className="text-xs text-slate-500 mt-1">
              Meta Leads CRM
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Workspace
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-[#123b7a] font-semibold">
              <span className="text-lg">▦</span>
              Dashboard
            </div>

            {role === "admin" && (
              <a
                href="/users"
                className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-slate-600 hover:bg-slate-50"
              >
                <span className="text-lg">♙</span>
                Users
              </a>
            )}

            <div className="mt-8 px-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Meta Connected
                </div>

                <p className="text-xs text-emerald-600 mt-2 leading-5">
                  Leads are being received automatically.
                </p>
              </div>
            </div>
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-[#123b7a] text-white flex items-center justify-center font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">
                  {userName}
                </div>

                <div className="text-xs text-slate-500 capitalize">
                  {role}
                </div>
              </div>
            </div>

            <button
              onClick={() => authClient.signOut()}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0">
          {/* TOP HEADER */}
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
            <div className="px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Leads Dashboard
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage and track your Meta leads
                </p>
              </div>

              <button
                onClick={openCreate}
                className="shrink-0 rounded-xl bg-[#123b7a] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#0d2f63] shadow-sm"
              >
                + Add Lead
              </button>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-sm text-slate-500">Total Leads</div>
                <div className="text-3xl font-bold mt-2">{totalLeads}</div>
                <div className="text-xs text-slate-400 mt-2">
                  All leads
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-sm text-slate-500">New Leads</div>
                <div className="text-3xl font-bold mt-2 text-blue-700">
                  {newCount}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  On current page
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-sm text-slate-500">
                  Interested
                </div>
                <div className="text-3xl font-bold mt-2 text-amber-600">
                  {interestedCount}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  On current page
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-sm text-slate-500">
                  Converted
                </div>
                <div className="text-3xl font-bold mt-2 text-emerald-600">
                  {convertedCount}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  On current page
                </div>
              </div>
            </div>

            {/* FILTERS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-5">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌕
                  </span>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Search name, phone or email..."
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-blue-400"
                  />
                </div>

                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">All Statuses</option>

                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {statusLabels[item]}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleSearch}
                  className="h-11 rounded-xl bg-slate-900 text-white px-5 text-sm font-semibold hover:bg-slate-800"
                >
                  Search
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">All Leads</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Showing {leads.length} leads
                  </p>
                </div>

                <div className="text-xs text-slate-400">
                  Page {page} of {totalPages}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Lead
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Phone
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Campaign
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Created
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-14 text-center text-sm text-slate-500"
                        >
                          Loading leads...
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-14 text-center"
                        >
                          <div className="text-3xl mb-2">◉</div>
                          <div className="font-semibold text-slate-700">
                            No leads found
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            Try changing your search or filters.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50/80 transition"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 rounded-full bg-blue-50 text-[#123b7a] flex items-center justify-center font-bold">
                                {lead.name
                                  ?.charAt(0)
                                  .toUpperCase() || "?"}
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-slate-800">
                                  {lead.name}
                                </div>

                                <div className="text-xs text-slate-500 truncate max-w-[220px]">
                                  {lead.email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {lead.phone}
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm text-slate-700">
                              {lead.campaign || "-"}
                            </div>

                            {lead.ad && (
                              <div className="text-xs text-slate-400 mt-1">
                                {lead.ad}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                updateStatus(
                                  lead.id,
                                  e.target.value,
                                )
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none ${statusClass(
                                lead.status,
                              )}`}
                            >
                              {statuses.map((item) => (
                                <option key={item} value={item}>
                                  {statusLabels[item]}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(lead.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openView(lead)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                View
                              </button>

                              <button
                                onClick={() => openEdit(lead)}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                Edit
                              </button>

                              {canDelete && (
                                <button
                                  onClick={() =>
                                    deleteLead(lead.id)
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
                  >
                    Previous
                  </button>

                  <div className="px-3 py-2 rounded-lg bg-[#123b7a] text-white text-sm font-semibold">
                    {page}
                  </div>

                  <button
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1),
                      )
                    }
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* VIEW MODAL */}
      {showView && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Lead Details</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Lead #{selectedLead.id}
                </p>
              </div>

              <button
                onClick={() => setShowView(false)}
                className="h-9 w-9 rounded-full hover:bg-slate-100 text-slate-500"
              >
                ×
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="text-xs text-slate-400">Name</div>
                <div className="font-semibold mt-1">
                  {selectedLead.name}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Phone</div>
                <div className="font-semibold mt-1">
                  {selectedLead.phone}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Email</div>
                <div className="font-semibold mt-1 break-all">
                  {selectedLead.email || "-"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Status</div>
                <div className="mt-1">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                      selectedLead.status,
                    )}`}
                  >
                    {statusLabels[selectedLead.status] ||
                      selectedLead.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">
                  Campaign
                </div>
                <div className="font-semibold mt-1">
                  {selectedLead.campaign || "-"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Ad</div>
                <div className="font-semibold mt-1">
                  {selectedLead.ad || "-"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Form</div>
                <div className="font-semibold mt-1">
                  {selectedLead.form || "-"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">
                  Created
                </div>
                <div className="font-semibold mt-1">
                  {formatDate(selectedLead.createdAt)}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowView(false)}
                className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Add Lead</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Create a new lead manually
                </p>
              </div>

              <button
                onClick={() => setShowCreate(false)}
                className="h-9 w-9 rounded-full hover:bg-slate-100 text-slate-500"
              >
                ×
              </button>
            </div>

            <form onSubmit={createLead}>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    setForm({ ...form, name: value })
                  }
                />

                <InputField
                  label="Phone"
                  required
                  value={form.phone}
                  onChange={(value) =>
                    setForm({ ...form, phone: value })
                  }
                />

                <InputField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    setForm({ ...form, email: value })
                  }
                />

                <InputField
                  label="Campaign"
                  value={form.campaign}
                  onChange={(value) =>
                    setForm({ ...form, campaign: value })
                  }
                />

                <InputField
                  label="Ad"
                  value={form.ad}
                  onChange={(value) =>
                    setForm({ ...form, ad: value })
                  }
                />

                <InputField
                  label="Form"
                  value={form.form}
                  onChange={(value) =>
                    setForm({ ...form, form: value })
                  }
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {statusLabels[item]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#123b7a] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Edit Lead</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Update lead information
                </p>
              </div>

              <button
                onClick={() => setShowEdit(false)}
                className="h-9 w-9 rounded-full hover:bg-slate-100 text-slate-500"
              >
                ×
              </button>
            </div>

            <form onSubmit={updateLead}>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    setForm({ ...form, name: value })
                  }
                />

                <InputField
                  label="Phone"
                  required
                  value={form.phone}
                  onChange={(value) =>
                    setForm({ ...form, phone: value })
                  }
                />

                <InputField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    setForm({ ...form, email: value })
                  }
                />

                <InputField
                  label="Campaign"
                  value={form.campaign}
                  onChange={(value) =>
                    setForm({ ...form, campaign: value })
                  }
                />

                <InputField
                  label="Ad"
                  value={form.ad}
                  onChange={(value) =>
                    setForm({ ...form, ad: value })
                  }
                />

                <InputField
                  label="Form"
                  value={form.form}
                  onChange={(value) =>
                    setForm({ ...form, form: value })
                  }
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {statusLabels[item]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#123b7a] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
      />
    </div>
  );
}
