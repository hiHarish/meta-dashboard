"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type Role = "admin" | "manager" | "telecaller";

type Lead = {
  id: number;
  metaLeadId: string | null;
  name: string;
  phone: string;
  email: string | null;
  campaign: string | null;
  ad: string | null;
  form: string | null;
  status: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

type Telecaller = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type LeadForm = {
  name: string;
  phone: string;
  email: string;
  campaign: string;
  ad: string;
  form: string;
  status: string;
  assignedTo: string;
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

const emptyForm: LeadForm = {
  name: "",
  phone: "",
  email: "",
  campaign: "",
  ad: "",
  form: "",
  status: "new",
  assignedTo: "",
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClasses(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-50 text-blue-700 ring-blue-600/10";

    case "contacted":
      return "bg-slate-100 text-slate-700 ring-slate-500/10";

    case "interested":
      return "bg-violet-50 text-violet-700 ring-violet-600/10";

    case "follow_up":
      return "bg-amber-50 text-amber-700 ring-amber-600/10";

    case "converted":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";

    case "not_interested":
      return "bg-rose-50 text-rose-700 ring-rose-600/10";

    case "invalid":
      return "bg-gray-100 text-gray-600 ring-gray-500/10";

    default:
      return "bg-gray-100 text-gray-700 ring-gray-500/10";
  }
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [telecallers, setTelecallers] = useState<
    Telecaller[]
  >([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<
    "create" | "view" | "edit" | null
  >(null);

  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const [form, setForm] =
    useState<LeadForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  const limit = 50;

  const role = session?.user.role as Role | undefined;

  const canManageLeads =
    role === "admin" ||
    role === "manager";

  const canAssign =
    role === "admin" ||
    role === "manager";

  async function loadLeads(
    requestedPage = page,
  ) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      params.set("page", String(requestedPage));
      params.set("limit", String(limit));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status) {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/leads?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load leads",
        );
      }

      setLeads(data.leads || []);

      const total =
        Number(data.total) ||
        Number(data.count) ||
        (data.leads || []).length;

      setTotalLeads(total);

      const calculatedPages =
        Number(data.totalPages) ||
        Math.max(1, Math.ceil(total / limit));

      setTotalPages(calculatedPages);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load leads",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTelecallers() {
    if (!canAssign) {
      return;
    }

    try {
      const response = await fetch(
        "/api/users",
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setTelecallers(data || []);
    } catch {
      setTelecallers([]);
    }
  }

  useEffect(() => {
    if (session) {
      loadLeads(1);
      loadTelecallers();
    }
  }, [session, search, status]);

  function openCreate() {
    setSelectedLead(null);
    setForm(emptyForm);
    setModal("create");
  }

  function openView(lead: Lead) {
    setSelectedLead(lead);
    setModal("view");
  }

  function openEdit(lead: Lead) {
    setSelectedLead(lead);

    setForm({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || "",
      campaign: lead.campaign || "",
      ad: lead.ad || "",
      form: lead.form || "",
      status: lead.status,
      assignedTo: lead.assignedTo || "",
    });

    setModal("edit");
  }

  function closeModal() {
    if (saving || deleting) {
      return;
    }

    setModal(null);
    setSelectedLead(null);
    setForm(emptyForm);
  }

  function updateForm(
    field: keyof LeadForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createLead() {
    if (
      !form.name.trim() ||
      !form.phone.trim()
    ) {
      setError(
        "Name and phone are required.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/leads",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            email: form.email,
            campaign: form.campaign,
            ad: form.ad,
            form: form.form,
            status: form.status,
            assignedTo:
              form.assignedTo || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create lead",
        );
      }

      setModal(null);
      setForm(emptyForm);

      await loadLeads(1);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create lead",
      );
    } finally {
      setSaving(false);
    }
  }

  async function editLead() {
    if (!selectedLead) {
      return;
    }

    if (
      !form.name.trim() ||
      !form.phone.trim()
    ) {
      setError(
        "Name and phone are required.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updates: Record<
        string,
        unknown
      > = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        campaign: form.campaign,
        ad: form.ad,
        form: form.form,
        status: form.status,
      };

      if (canAssign) {
        updates.assignedTo =
          form.assignedTo || null;
      }

      const response = await fetch(
        `/api/leads/${selectedLead.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(updates),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update lead",
        );
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === selectedLead.id
            ? { ...lead, ...data }
            : lead,
        ),
      );

      setSelectedLead(data);
      setModal("view");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update lead",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateLead(
    id: number,
    updates: Record<string, unknown>,
  ) {
    try {
      const response = await fetch(
        `/api/leads/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(updates),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Update failed",
        );
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === id
            ? { ...lead, ...data }
            : lead,
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Update failed",
      );

      await loadLeads(page);
    }
  }

  async function deleteLead(id: number) {
    if (!canManageLeads) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this lead?",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/leads/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete lead",
        );
      }

      setLeads((current) =>
        current.filter(
          (lead) => lead.id !== id,
        ),
      );

      setTotalLeads((current) =>
        Math.max(0, current - 1),
      );

      closeModal();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete lead",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function logout() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  function handleSearch() {
    setPage(1);
    loadLeads(1);
  }

  function handleReset() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  function goToPage(nextPage: number) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) {
      return;
    }

    setPage(nextPage);
    loadLeads(nextPage);
  }

  const newCount = leads.filter(
    (lead) => lead.status === "new",
  ).length;

  const convertedCount = leads.filter(
    (lead) =>
      lead.status === "converted",
  ).length;

  const interestedCount = leads.filter(
    (lead) =>
      lead.status === "interested",
  ).length;

  const firstResult =
    totalLeads === 0
      ? 0
      : (page - 1) * limit + 1;

  const lastResult =
    Math.min(page * limit, totalLeads);

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">

        <div className="flex h-20 items-center border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
              N
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                NDC
              </p>

              <p className="text-xs text-slate-500">
                Leads CRM
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">

          <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">

            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-700"
            >
              <span className="text-lg">▦</span>
              Dashboard
            </Link>

            {role === "admin" && (
              <Link
                href="/dashboard/users"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="text-lg">♙</span>
                Users
              </Link>
            )}

          </div>

          <p className="mt-8 px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            System
          </p>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">
              Meta Integration
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs text-slate-500">
                Connected
              </span>
            </div>
          </div>

        </nav>

        <div className="border-t border-slate-100 p-4">

          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {session.user.name
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {session.user.name}
              </p>

              <p className="truncate text-xs capitalize text-slate-500">
                {role}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            Sign out
          </button>

        </div>
      </aside>

      {/* MAIN */}
      <div className="lg:pl-64">

        {/* TOP BAR */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-4 md:px-8">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Overview
              </p>

              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
                Leads Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">

              {role === "admin" && (
                <Link
                  href="/dashboard/users"
                  className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:block"
                >
                  Manage Users
                </Link>
              )}

              <button
                onClick={openCreate}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                + Add Lead
              </button>

            </div>

          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-4 md:p-8">

          {/* WELCOME */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Good to see you,{" "}
              {session.user.name?.split(" ")[0]}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Here is what is happening with your leads today.
            </p>
          </div>

          {/* KPI CARDS */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Leads
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {totalLeads}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    Across all pages
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                  ◉
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    New Leads
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {newCount}
                  </p>

                  <p className="mt-2 text-xs text-blue-600">
                    Needs attention
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                  +
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Interested
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {interestedCount}
                  </p>

                  <p className="mt-2 text-xs text-violet-600">
                    High potential
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600">
                  ★
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Converted
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {convertedCount}
                  </p>

                  <p className="mt-2 text-xs text-emerald-600">
                    Successfully converted
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                  ✓
                </div>
              </div>
            </div>

          </div>

          {/* SEARCH */}
          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">

            <div className="flex flex-col gap-3 xl:flex-row">

              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>

                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Search name, phone, email or campaign..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>

              <select
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">
                  All statuses
                </option>

                {statuses.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {formatStatus(item)}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSearch}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>

              <button
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>

              <button
                onClick={() =>
                  loadLeads(page)
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                ↻ Refresh
              </button>

            </div>

          </div>

          {/* ERROR */}
          {error && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>

              <button
                onClick={() => setError("")}
                className="ml-4 text-lg font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* TABLE */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="font-bold text-slate-900">
                  Lead Management
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {totalLeads > 0
                    ? `Showing ${firstResult}-${lastResult} of ${totalLeads} leads`
                    : "No leads available"}
                </p>
              </div>

              <div className="text-xs font-medium text-slate-400">
                Page {page} of {totalPages}
              </div>

            </div>

            {loading ? (
              <div className="p-16 text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <p className="text-sm font-medium text-slate-500">
                  Loading leads...
                </p>
              </div>
            ) : leads.length === 0 ? (
              <div className="p-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
                  ◉
                </div>

                <h3 className="mt-4 font-semibold text-slate-800">
                  No leads found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or filters.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1150px] text-left">

                  <thead className="border-b border-slate-100 bg-slate-50/80">
                    <tr>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Lead
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Phone
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Campaign
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      {canAssign && (
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Assigned To
                        </th>
                      )}

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Created
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="group transition hover:bg-blue-50/30"
                      >

                        <td className="px-5 py-4">
                          <button
                            onClick={() =>
                              openView(lead)
                            }
                            className="text-left"
                          >
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                                {lead.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 group-hover:text-blue-700">
                                  {lead.name}
                                </p>

                                {lead.email && (
                                  <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">
                                    {lead.email}
                                  </p>
                                )}
                              </div>

                            </div>
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <a
                            href={`tel:${lead.phone}`}
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {lead.phone}
                          </a>
                        </td>

                        <td className="max-w-[220px] px-5 py-4">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {lead.campaign ||
                              "—"}
                          </p>

                          {lead.ad && (
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {lead.ad}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">

                          <select
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 outline-none ${getStatusClasses(
                              lead.status,
                            )}`}
                            value={
                              lead.status
                            }
                            onChange={(e) =>
                              updateLead(
                                lead.id,
                                {
                                  status:
                                    e.target
                                      .value,
                                },
                              )
                            }
                          >
                            {statuses.map(
                              (item) => (
                                <option
                                  key={item}
                                  value={item}
                                >
                                  {formatStatus(
                                    item,
                                  )}
                                </option>
                              ),
                            )}
                          </select>

                        </td>

                        {canAssign && (
                          <td className="px-5 py-4">

                            <select
                              className="max-w-[170px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                              value={
                                lead.assignedTo ||
                                ""
                              }
                              onChange={(e) =>
                                updateLead(
                                  lead.id,
                                  {
                                    assignedTo:
                                      e.target
                                        .value ||
                                      null,
                                  },
                                )
                              }
                            >

                              <option value="">
                                Unassigned
                              </option>

                              {telecallers.map(
                                (
                                  telecaller,
                                ) => (
                                  <option
                                    key={
                                      telecaller.id
                                    }
                                    value={
                                      telecaller.id
                                    }
                                  >
                                    {
                                      telecaller.name
                                    }
                                  </option>
                                ),
                              )}

                            </select>

                          </td>
                        )}

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {formatDate(
                            lead.createdAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                openView(
                                  lead,
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                              View
                            </button>

                            <button
                              onClick={() =>
                                openEdit(
                                  lead,
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            {canManageLeads && (
                              <button
                                onClick={() =>
                                  deleteLead(
                                    lead.id,
                                  )
                                }
                                className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                Delete
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            )}

            {/* PAGINATION */}
            {!loading &&
              leads.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                  <p className="text-xs font-medium text-slate-500">
                    Showing{" "}
                    <span className="font-bold text-slate-700">
                      {firstResult}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-slate-700">
                      {lastResult}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-700">
                      {totalLeads}
                    </span>
                  </p>

                  <div className="flex items-center gap-1">

                    <button
                      onClick={() =>
                        goToPage(page - 1)
                      }
                      disabled={page === 1}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ←
                    </button>

                    {Array.from(
                      {
                        length: Math.min(
                          totalPages,
                          5,
                        ),
                      },
                      (_, index) => {
                        let pageNumber =
                          index + 1;

                        if (
                          totalPages > 5
                        ) {
                          if (
                            page <= 3
                          ) {
                            pageNumber =
                              index + 1;
                          } else if (
                            page >=
                            totalPages - 2
                          ) {
                            pageNumber =
                              totalPages -
                              4 +
                              index;
                          } else {
                            pageNumber =
                              page -
                              2 +
                              index;
                          }
                        }

                        return (
                          <button
                            key={
                              pageNumber
                            }
                            onClick={() =>
                              goToPage(
                                pageNumber,
                              )
                            }
                            className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                              pageNumber ===
                              page
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {
                              pageNumber
                            }
                          </button>
                        );
                      },
                    )}

                    <button
                      onClick={() =>
                        goToPage(page + 1)
                      }
                      disabled={
                        page === totalPages
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      →
                    </button>

                  </div>

                </div>
              )}

          </div>

        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Lead Management
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {modal === "create" &&
                    "Add New Lead"}

                  {modal === "edit" &&
                    "Edit Lead"}

                  {modal === "view" &&
                    "Lead Details"}
                </h2>

                {selectedLead && (
                  <p className="mt-1 text-xs text-slate-500">
                    Lead #{selectedLead.id}
                  </p>
                )}
              </div>

              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>

            </div>

            {/* VIEW */}
            {modal === "view" &&
              selectedLead && (
                <div className="p-6">

                  <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                      {selectedLead.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">
                        {selectedLead.name}
                      </h3>

                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="mt-1 block text-sm font-medium text-blue-600"
                      >
                        {selectedLead.phone}
                      </a>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getStatusClasses(
                        selectedLead.status,
                      )}`}
                    >
                      {formatStatus(
                        selectedLead.status,
                      )}
                    </span>

                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">

                    {[
                      [
                        "Email",
                        selectedLead.email ||
                          "—",
                      ],
                      [
                        "Campaign",
                        selectedLead.campaign ||
                          "—",
                      ],
                      [
                        "Ad",
                        selectedLead.ad ||
                          "—",
                      ],
                      [
                        "Form",
                        selectedLead.form ||
                          "—",
                      ],
                      [
                        "Assigned To",
                        telecallers.find(
                          (user) =>
                            user.id ===
                            selectedLead.assignedTo,
                        )?.name ||
                          (selectedLead.assignedTo
                            ? selectedLead.assignedTo
                            : "Unassigned"),
                      ],
                      [
                        "Created",
                        formatDate(
                          selectedLead.createdAt,
                        ),
                      ],
                      [
                        "Last Updated",
                        formatDate(
                          selectedLead.updatedAt,
                        ),
                      ],
                    ].map(
                      ([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            {label}
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                            {value}
                          </p>
                        </div>
                      ),
                    )}

                  </div>

                  {selectedLead.metaLeadId && (
                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Meta Lead ID
                      </p>

                      <p className="mt-2 break-all text-xs font-medium text-slate-600">
                        {
                          selectedLead.metaLeadId
                        }
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                    <button
                      onClick={closeModal}
                      className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Close
                    </button>

                    <button
                      onClick={() =>
                        openEdit(
                          selectedLead,
                        )
                      }
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      Edit Lead
                    </button>

                    {canManageLeads && (
                      <button
                        onClick={() =>
                          deleteLead(
                            selectedLead.id,
                          )
                        }
                        disabled={deleting}
                        className="rounded-xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        {deleting
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    )}

                  </div>

                </div>
              )}

            {/* CREATE / EDIT */}
            {(modal === "create" ||
              modal === "edit") && (
              <div className="p-6">

                <div className="grid gap-5 sm:grid-cols-2">

                  {[
                    {
                      field: "name" as const,
                      label: "Patient Name",
                      placeholder:
                        "Enter patient name",
                      required: true,
                    },
                    {
                      field: "phone" as const,
                      label: "Phone Number",
                      placeholder:
                        "Enter phone number",
                      required: true,
                    },
                    {
                      field: "email" as const,
                      label: "Email Address",
                      placeholder:
                        "Enter email address",
                    },
                    {
                      field: "campaign" as const,
                      label: "Campaign",
                      placeholder:
                        "Campaign name",
                    },
                    {
                      field: "ad" as const,
                      label: "Ad",
                      placeholder:
                        "Ad name",
                    },
                    {
                      field: "form" as const,
                      label: "Lead Form",
                      placeholder:
                        "Form name",
                    },
                  ].map((item) => (
                    <div key={item.field}>

                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        {item.label}
                        {item.required && (
                          <span className="ml-1 text-red-500">
                            *
                          </span>
                        )}
                      </label>

                      <input
                        type={
                          item.field ===
                          "email"
                            ? "email"
                            : "text"
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        value={
                          form[item.field]
                        }
                        onChange={(e) =>
                          updateForm(
                            item.field,
                            e.target.value,
                          )
                        }
                        placeholder={
                          item.placeholder
                        }
                      />

                    </div>
                  ))}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Status
                    </label>

                    <select
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      value={
                        form.status
                      }
                      onChange={(e) =>
                        updateForm(
                          "status",
                          e.target.value,
                        )
                      }
                    >
                      {statuses.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {formatStatus(
                              item,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  {canAssign && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Assign To
                      </label>

                      <select
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        value={
                          form.assignedTo
                        }
                        onChange={(e) =>
                          updateForm(
                            "assignedTo",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">
                          Unassigned
                        </option>

                        {telecallers.map(
                          (telecaller) => (
                            <option
                              key={
                                telecaller.id
                              }
                              value={
                                telecaller.id
                              }
                            >
                              {
                                telecaller.name
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  )}

                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                  <button
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={
                      modal === "create"
                        ? createLead
                        : editLead
                    }
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : modal === "create"
                        ? "Create Lead"
                        : "Save Changes"}
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </main>
  );
}
