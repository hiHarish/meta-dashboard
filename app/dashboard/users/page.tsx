"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"manager" | "telecaller">("telecaller");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadUsers() {
    const { data, error } = await authClient.admin.listUsers({
      query: {
        limit: 100,
      },
    });

    if (error) {
      setError(error.message || "Failed to load users");
      return;
    }

    setUsers(data?.users || []);
  }

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, []);

  async function createUser() {
    setError("");

    if (!name || !email || password.length < 8) {
      setError("Enter name, valid email and password of at least 8 characters.");
      return;
    }

    setCreating(true);

    const { error } = await authClient.admin.createUser({
      name,
      email,
      password,
      role,
    });

    if (error) {
      setError(error.message || "Failed to create user");
      setCreating(false);
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("telecaller");

    await loadUsers();
    setCreating(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="mt-1 text-gray-600">
              Create and manage NDC dashboard users
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white"
          >
            Dashboard
          </a>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Create User</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              className="rounded-lg border p-3"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="rounded-lg border p-3"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="rounded-lg border p-3"
              type="password"
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <select
              className="rounded-lg border p-3"
              value={role}
              onChange={(e) =>
  setRole(e.target.value as "manager" | "telecaller")
}
            >
              <option value="telecaller">Telecaller</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={createUser}
            disabled={creating}
            className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create User"}
          </button>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Users</h2>

          {loading ? (
            <p className="mt-4 text-gray-500">Loading...</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-3">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3 capitalize">
                        {user.role || "user"}
                      </td>
                      <td className="p-3">
                        {user.banned ? "Banned" : "Active"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}