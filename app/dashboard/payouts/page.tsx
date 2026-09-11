"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payout_requests")
      .select("*, counsellors(name, email, phone)")
      .order("created_at", { ascending: false });

    setPayouts(data || []);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: "paid" | "rejected") => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("payout_requests")
      .update({
        status,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      await loadPayouts();
    }
    setUpdatingId(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Counselor Payout Requests</h1>
        <p className="text-sm text-gray-500">
          Review pending cashout requests and mark them as paid after manual bank/MoMo transfer.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Counselor</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Account Details</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-xs text-gray-400">
                  Loading payout requests...
                </td>
              </tr>
            ) : payouts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-xs text-gray-400">
                  No payout requests found.
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {p.counsellors?.name || "Counselor"}
                    <span className="block text-xs font-normal text-gray-400">{p.counsellors?.email}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">GHS {Number(p.amount).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                      {p.settlement_type?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    <p className="font-bold">{p.account_details?.account_name}</p>
                    <p>{p.account_details?.provider} - {p.account_details?.account_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        p.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : p.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {p.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(p.id, "paid")}
                          disabled={updatingId === p.id}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(p.id, "rejected")}
                          disabled={updatingId === p.id}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
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
