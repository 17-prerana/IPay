import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import api from "../services/api";

function History() {
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get("/transactions/history");
        const history = Array.isArray(res.data)
          ? res.data
          : res.data?.data?.transactions || [];

        setTransactions(history);
        setError("");
      } catch (err) {
        setError(err.response?.data?.msg || "Unable to load transactions");
        console.error(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    const senderEmail = tx.sender?.email?.toLowerCase() || "";

    const receiverEmail = tx.receiver?.email?.toLowerCase() || "";

    const matchesSearch =
      senderEmail.includes(search.toLowerCase()) ||
      receiverEmail.includes(search.toLowerCase());

    if (filter === "sent") {
      return matchesSearch && senderEmail === userEmail?.toLowerCase();
    }

    if (filter === "received") {
      return matchesSearch && receiverEmail === userEmail?.toLowerCase();
    }

    return matchesSearch;
  });

  const filterClass = (value) =>
    `rounded-2xl px-4 py-2 text-sm font-bold transition ${
      filter === value
        ? "bg-violet-600 text-white shadow-lg shadow-violet-100"
        : "bg-white text-slate-600 ring-1 ring-violet-100 hover:bg-violet-50"
    }`;

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#fbfaff,#f5f3ff_55%,#fff)] px-4 py-6 text-slate-950 sm:px-6">
        <section className="mx-auto w-full max-w-6xl">
          <Navbar />

          <div className="rounded-[2rem] border border-violet-100 bg-white p-8 shadow-xl shadow-violet-100/70">
            <Loader />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fbfaff,#f5f3ff_55%,#fff)] px-4 py-6 text-slate-950 sm:px-6">
      <section className="mx-auto w-full max-w-6xl">
        <Navbar />

        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">
              Transaction center
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              Transaction History
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Search payments and filter sent or received transactions.
            </p>
          </div>
          <div className="rounded-full border border-violet-100 bg-white px-5 py-3 text-sm font-bold text-violet-700 shadow-sm">
            {filteredTransactions.length} shown
          </div>
        </div>

        <div className="mb-6 rounded-[2rem] border border-violet-100 bg-white p-5 shadow-xl shadow-violet-100/70">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <input
              className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
              type="text"
              placeholder="Search by email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              <button className={filterClass("all")} onClick={() => setFilter("all")}>
                All
              </button>

              <button className={filterClass("sent")} onClick={() => setFilter("sent")}>
                Sent
              </button>

              <button
                className={filterClass("received")}
                onClick={() => setFilter("received")}
              >
                Received
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-[2rem] border border-red-100 bg-red-50 p-10 text-center shadow-xl shadow-red-100/70">
            <h2 className="text-2xl font-black text-red-700">
              History unavailable
            </h2>
            <p className="mt-2 text-red-600">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-[2rem] border border-violet-100 bg-white p-10 text-center shadow-xl shadow-violet-100/70">
            <h2 className="text-2xl font-black text-slate-950">
              No transactions found
            </h2>
            <p className="mt-2 text-slate-600">
              Your payment activity will appear here after your first transfer.
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-[2rem] border border-violet-100 bg-white p-10 text-center shadow-xl shadow-violet-100/70">
            <h2 className="text-2xl font-black text-slate-950">
              No matching transactions
            </h2>
            <p className="mt-2 text-slate-600">
              Try another email search or switch the transaction filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTransactions.map((tx) => {
              const isSent =
                tx.sender?.email?.toLowerCase() === userEmail?.toLowerCase();
              const senderName = tx.sender?.name || tx.sender?.email || "Unknown sender";
              const receiverName =
                tx.receiver?.name || tx.receiver?.email || "Unknown receiver";
              const senderEmail = tx.sender?.email || "No email";
              const receiverEmail = tx.receiver?.email || "No email";

              return (
                <article
                  className="rounded-[1.75rem] border border-violet-100 bg-white p-6 shadow-lg shadow-violet-100/70"
                  key={tx._id}
                >
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                      <div
                        className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                          isSent
                            ? "bg-violet-50 text-violet-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isSent ? "Sent" : "Received"}
                      </div>

                      <h2 className="text-xl font-black text-slate-950">
                        {senderName} transferred money to {receiverName}
                      </h2>

                      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <p>
                          <span className="font-bold text-slate-950">
                            Sender:
                          </span>{" "}
                          {senderEmail}
                        </p>
                        <p>
                          <span className="font-bold text-slate-950">
                            Receiver:
                          </span>{" "}
                          {receiverEmail}
                        </p>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-violet-50/60 px-5 py-4 text-right">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Amount
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        Rs. {tx.amount}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default History;
