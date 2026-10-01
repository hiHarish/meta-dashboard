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
  return new Date(date).toLocaleString();
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

  const role = session?.user.role as Role | undefined;

  const canManageLeads =
    role === "admin" ||
    role === "manager";

  const canAssign =
    role === "admin" ||
    role === "manager";

  async function loadLeads() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      params.set("page", "1");
      params.set("limit", "50");

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
      const response = await fetch("/api/users", {
        cache: "no-store",
      });

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
      loadLeads();
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
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create lead",
        );
      }

      setModal(null);
      setForm(emptyForm);

      await loadLeads();
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

    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updates: Record<string, unknown> = {
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
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update lead",
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
            "Content-Type": "application/json",
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

      await loadLeads();
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
          data.error || "Failed to delete lead",
        );
      }

      setLeads((current) =>
        current.filter((lead) => lead.id !== id),
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

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              NDC Leads Dashboard
            </h1>

            <p className="mt-1 text-gray-600">
              Welcome, {session.user.name} ·{" "}
              <span className="font-semibold capitalize">
                {role}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {role === "admin" && (
              <Link
                href="/dashboard/users"
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
              >
                Users
              </Link>
            )}

            <button
              onClick={openCreate}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              + Add Lead
            </button>

            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* STATISTICS */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Visible Leads
            </p>

            <p className="mt-2 text-3xl font-bold">
              {leads.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              New Leads
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                leads.filter(
                  (lead) =>
                    lead.status === "new",
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Converted
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                leads.filter(
                  (lead) =>
                    lead.status ===
                    "converted",
                ).length
              }
            </p>
          </div>

        </div>

        {/* SEARCH / FILTER */}
        <div className="mt-8 rounded-xl bg-white p-5 shadow">
          <div className="flex flex-col gap-3 md:flex-row">

            <input
              className="flex-1 rounded-lg border p-3 outline-none focus:border-black"
              placeholder="Search name, phone, email or campaign..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadLeads();
                }
              }}
            />

            <select
              className="rounded-lg border p-3"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
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
              onClick={loadLeads}
              className="rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Search
            </button>

            <button
              onClick={() => {
                setSearch("");
                setStatus("");
              }}
              className="rounded-lg border px-5 py-3 font-semibold hover:bg-gray-50"
            >
              Reset
            </button>

            <button
              onClick={loadLeads}
              className="rounded-lg border px-5 py-3 font-semibold hover:bg-gray-50"
            >
              Refresh
            </button>

          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-red-50 p-4 text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* TABLE */}
        <div className="mt-6 overflow-hidden rounded-xl bg-white shadow">

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No leads found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4">
                      Lead
                    </th>

                    <th className="p-4">
                      Phone
                    </th>

                    <th className="p-4">
                      Campaign
                    </th>

                    <th className="p-4">
                      Status
                    </th>

                    {(role === "admin" ||
                      role === "manager") && (
                      <th className="p-4">
                        Assigned To
                      </th>
                    )}

                    <th className="p-4">
                      Created
                    </th>

                    <th className="p-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-t hover:bg-gray-50"
                    >

                      {/* LEAD */}
                      <td className="p-4">
                        <button
                          onClick={() =>
                            openView(lead)
                          }
                          className="text-left"
                        >
                          <div className="font-semibold text-blue-600 hover:underline">
                            {lead.name}
                          </div>

                          {lead.email && (
                            <div className="text-sm text-gray-500">
                              {lead.email}
                            </div>
                          )}
                        </button>
                      </td>

                      {/* PHONE */}
                      <td className="p-4">
                        <a
                          href={`tel:${lead.phone}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {lead.phone}
                        </a>
                      </td>

                      {/* CAMPAIGN */}
                      <td className="p-4">
                        {lead.campaign || "-"}
                      </td>

                      {/* STATUS */}
                      <td className="p-4">
                        <select
                          className="rounded border p-2 text-sm"
                          value={lead.status}
                          onChange={(e) =>
                            updateLead(
                              lead.id,
                              {
                                status:
                                  e.target.value,
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

                      {/* ASSIGNMENT */}
                      {(role === "admin" ||
                        role === "manager") && (
                        <td className="p-4">

                          <select
                            className="rounded border p-2 text-sm"
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

                        </td>
                      )}

                      {/* CREATED */}
                      <td className="p-4 text-sm text-gray-500">
                        {formatDate(
                          lead.createdAt,
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4">
                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              openView(lead)
                            }
                            className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              openEdit(lead)
                            }
                            className="rounded bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
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
                              className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
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

        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b p-6">

              <div>
                <h2 className="text-2xl font-bold">
                  {modal === "create" &&
                    "Add New Lead"}

                  {modal === "edit" &&
                    "Edit Lead"}

                  {modal === "view" &&
                    "Lead Details"}
                </h2>

                {selectedLead && (
                  <p className="mt-1 text-sm text-gray-500">
                    Lead #{selectedLead.id}
                  </p>
                )}
              </div>

              <button
                onClick={closeModal}
                className="text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>

            </div>

            {/* VIEW */}
            {modal === "view" &&
              selectedLead && (
                <div className="space-y-5 p-6">

                  <div className="grid gap-4 md:grid-cols-2">

                    <div>
                      <p className="text-sm text-gray-500">
                        Name
                      </p>

                      <p className="mt-1 font-semibold">
                        {selectedLead.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Phone
                      </p>

                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="mt-1 block font-semibold text-blue-600"
                      >
                        {selectedLead.phone}
                      </a>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Email
                      </p>

                      <p className="mt-1">
                        {selectedLead.email ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Campaign
                      </p>

                      <p className="mt-1">
                        {selectedLead.campaign ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Ad
                      </p>

                      <p className="mt-1">
                        {selectedLead.ad || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Form
                      </p>

                      <p className="mt-1">
                        {selectedLead.form ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Status
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatStatus(
                          selectedLead.status,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Created
                      </p>

                      <p className="mt-1">
                        {formatDate(
                          selectedLead.createdAt,
                        )}
                      </p>
                    </div>

                  </div>

                  {selectedLead.metaLeadId && (
                    <div>
                      <p className="text-sm text-gray-500">
                        Meta Lead ID
                      </p>

                      <p className="mt-1 break-all text-sm">
                        {
                          selectedLead.metaLeadId
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">

                    <button
                      onClick={() =>
                        openEdit(
                          selectedLead,
                        )
                      }
                      className="rounded-lg bg-gray-800 px-5 py-3 font-semibold text-white"
                    >
                      Edit
                    </button>

                    {canManageLeads && (
                      <button
                        onClick={() =>
                          deleteLead(
                            selectedLead.id,
                          )
                        }
                        disabled={deleting}
                        className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
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
              <div className="space-y-5 p-6">

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Name *
                    </label>

                    <input
                      className="w-full rounded-lg border p-3"
                      value={form.name}
                      onChange={(e) =>
                        updateForm(
                          "name",
                          e.target.value,
                        )
                      }
                      placeholder="Patient name"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Phone *
                    </label>

                    <input
                      className="w-full rounded-lg border p-3"
                      value={form.phone}
                      onChange={(e) =>
                        updateForm(
                          "phone",
                          e.target.value,
                        )
                      }
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Email
                    </label>

                    <input
                      type="email"
                      className="w-full rounded-lg border p-3"
                      value={form.email}
                      onChange={(e) =>
                        updateForm(
                          "email",
                          e.target.value,
                        )
                      }
                      placeholder="Email address"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Campaign
                    </label>

                    <input
                      className="w-full rounded-lg border p-3"
                      value={form.campaign}
                      onChange={(e) =>
                        updateForm(
                          "campaign",
                          e.target.value,
                        )
                      }
                      placeholder="Campaign"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Ad
                    </label>

                    <input
                      className="w-full rounded-lg border p-3"
                      value={form.ad}
                      onChange={(e) =>
                        updateForm(
                          "ad",
                          e.target.value,
                        )
                      }
                      placeholder="Ad name"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Form
                    </label>

                    <input
                      className="w-full rounded-lg border p-3"
                      value={form.form}
                      onChange={(e) =>
                        updateForm(
                          "form",
                          e.target.value,
                        )
                      }
                      placeholder="Lead form"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Status
                    </label>

                    <select
                      className="w-full rounded-lg border p-3"
                      value={form.status}
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
                      <label className="mb-1 block text-sm font-medium">
                        Assign To
                      </label>

                      <select
                        className="w-full rounded-lg border p-3"
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
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t pt-5">

                  <button
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border px-5 py-3 font-semibold"
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
                    className="rounded-lg bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
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
