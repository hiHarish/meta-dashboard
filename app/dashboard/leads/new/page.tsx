"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewLeadPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    campaign: "",
    ad: "",
    form: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create lead",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">
            Add New Lead
          </h1>

          <form
            onSubmit={submit}
            className="mt-6 space-y-4"
          >
            {(
              [
                ["name", "Name"],
                ["phone", "Phone"],
                ["email", "Email"],
                ["campaign", "Campaign"],
                ["ad", "Ad"],
                ["form", "Form"],
              ] as const
            ).map(([field, label]) => (
              <input
                key={field}
                type={field === "email" ? "email" : "text"}
                placeholder={label}
                value={form[field]}
                onChange={(e) =>
                  updateField(field, e.target.value)
                }
                className="w-full rounded-lg border p-3"
                required={
                  field === "name" ||
                  field === "phone"
                }
              />
            ))}

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border px-5 py-3"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Lead"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}