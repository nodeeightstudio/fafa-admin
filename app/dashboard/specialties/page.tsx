"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Specialty {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export default function AdminSpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("specialties")
      .select("*")
      .order("name", { ascending: true });

    if (!err && data) {
      setSpecialties(data);
    }
    setLoading(false);
  };

  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");
    setMessage("");

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

    const { error: insertErr } = await supabase.from("specialties").insert({
      name: name.trim(),
      slug,
      description: description.trim() || null,
    });

    if (insertErr) {
      setError(insertErr.message);
    } else {
      setMessage("Specialty added successfully!");
      setName("");
      setDescription("");
      await loadSpecialties();
    }
    setSaving(false);
  };

  const handleDeleteSpecialty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this specialty?")) return;

    const { error: delErr } = await supabase.from("specialties").delete().eq("id", id);
    if (!delErr) {
      await loadSpecialties();
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Counselor Specialties</h1>
        <p className="text-sm text-gray-500">
          Manage specialties offered across FAFA. Added specialties appear dynamically on onboarding forms and filters.
        </p>
      </div>

      {/* Add Specialty Form */}
      <form onSubmit={handleAddSpecialty} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Add New Specialty</h2>
        
        {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
        {message && <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">{message}</div>}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Specialty Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Trauma & Grief Counseling"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of specialty"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-purple-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-purple-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add Specialty"}
        </button>
      </form>

      {/* Specialties Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Specialty Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Slug Identifier</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-400">
                  Loading specialties...
                </td>
              </tr>
            ) : specialties.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-400">
                  No specialties found. Add your first specialty above.
                </td>
              </tr>
            ) : (
              specialties.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-purple-700">{s.slug}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">{s.description || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteSpecialty(s.id)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
