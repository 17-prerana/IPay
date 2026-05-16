import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Alert from "../components/Alert";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContextValue";
import api from "../services/api";

const bankOptions = [
  "HDFC Bank",
  "ICICI Bank",
  "SBI",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "PNB",
  "Other",
];

function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [showBalance, setShowBalance] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    gender: "Prefer not to say",
    accountType: "Savings",
    bankName: "HDFC Bank",
    accountNumber: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");

        setUser(res.data);
        setEditForm({
          name: res.data.name || "",
          gender: res.data.gender || "Prefer not to say",
          accountType: res.data.accountType || "Savings",
          bankName: res.data.bankName || "HDFC Bank",
          accountNumber: res.data.accountNumber || "",
        });
        localStorage.setItem("userEmail", res.data.email);
      } catch (err) {
        console.error(err.response?.data || err.message);
      }
    };

    fetchUser();
  }, []);

  const handleShowBalance = () => {
    const allowed = window.confirm("Show your dashboard balance?");

    if (allowed) {
      setShowBalance(true);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]:
        e.target.name === "accountNumber"
          ? e.target.value.replace(/\D/g, "")
          : e.target.value,
    });
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: user.name || "",
      gender: user.gender || "Prefer not to say",
      accountType: user.accountType || "Savings",
      bankName: user.bankName || "HDFC Bank",
      accountNumber: user.accountNumber || "",
    });
    setIsEditing(false);
    setProfileMessage("");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");

    try {
      const res = await api.put("/auth/me", editForm);

      setUser(res.data.user);
      setIsEditing(false);
      setProfileMessage(res.data.msg || "Profile updated successfully");
    } catch (err) {
      setProfileMessage(err.response?.data?.msg || "Profile update failed");
      console.error(err.response?.data || err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your iPay account permanently? This will also remove your transaction history."
    );

    if (!confirmed) return;

    setDeletingAccount(true);
    setProfileMessage("");

    try {
      await api.delete("/auth/me");
      logout();
      navigate("/");
    } catch (err) {
      setProfileMessage(err.response?.data?.msg || "Account deletion failed");
      setDeletingAccount(false);
      console.error(err.response?.data || err.message);
    }
  };

  const formattedDateOfBirth = user?.dateOfBirth
    ? new Date(user.dateOfBirth).toLocaleDateString()
    : "Not added";

  const maskedAccountNumber = user?.accountNumber
    ? `${"*".repeat(Math.max(user.accountNumber.length - 4, 0))}${user.accountNumber.slice(-4)}`
    : "Not added";

  return (
    <main className="min-h-screen bg-[#F5F3FF] px-4 py-6 text-slate-950 sm:px-6">
      <section className="mx-auto w-full max-w-6xl">
        <Navbar />

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Overview
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Dashboard
          </h1>
        </div>

        {user ? (
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[1.75rem] border border-purple-200 bg-white p-7 shadow-lg shadow-purple-200/50">
              <p className="text-sm font-bold uppercase tracking-wide text-[#6D28D9]">
                Balance
              </p>
              <p className="mt-5 text-5xl font-black tracking-tight text-slate-950">
                {showBalance ? `Rs. ${user.balance}` : "Rs. XXXX"}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {showBalance ? "Available balance" : "Hidden for privacy"}
              </p>

              <button
                className="mt-8 rounded-2xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9]"
                onClick={handleShowBalance}
                type="button"
              >
                {showBalance ? "Balance visible" : "Show balance"}
              </button>
            </div>

            <div className="rounded-[1.75rem] border border-purple-200 bg-white p-7 shadow-lg shadow-purple-200/50">
              <div className="flex flex-col justify-between gap-4 border-b border-purple-100 pb-6 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-[#6D28D9]">
                    Profile
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {user.name}
                  </h2>
                </div>
                <div className="rounded-full bg-[#EDE9FE] px-4 py-2 text-sm font-bold text-[#6D28D9]">
                  {user.accountType || "Savings"} account
                </div>
              </div>

              <Alert message={profileMessage} />

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#EDE9FE] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Email
                  </p>
                  <p className="mt-2 break-all font-bold text-slate-900">
                    {user.email}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#EDE9FE] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Date of birth
                  </p>
                  <p className="mt-2 font-bold text-slate-900">
                    {formattedDateOfBirth}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#EDE9FE] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Gender
                  </p>
                  <p className="mt-2 font-bold text-slate-900">
                    {user.gender || "Prefer not to say"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#EDE9FE] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Type of account
                  </p>
                  <p className="mt-2 font-bold text-slate-900">
                    {user.accountType || "Savings"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#EDE9FE] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Bank name
                  </p>
                  <p className="mt-2 font-bold text-slate-900">
                    {user.bankName || "Not added"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#EDE9FE] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Account number
                  </p>
                  <p className="mt-2 font-bold tracking-widest text-slate-900">
                    {maskedAccountNumber}
                  </p>
                </div>
              </div>

              {isEditing ? (
                <form className="mt-6 border-t border-purple-100 pt-6" onSubmit={handleUpdateProfile}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="w-full rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-3 font-semibold text-slate-950 outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100"
                      name="name"
                      placeholder="Full name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      required
                    />

                    <select
                      className="w-full rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-3 font-semibold text-slate-950 outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100"
                      name="gender"
                      value={editForm.gender}
                      onChange={handleEditChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>

                    <select
                      className="w-full rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-3 font-semibold text-slate-950 outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100"
                      name="accountType"
                      value={editForm.accountType}
                      onChange={handleEditChange}
                    >
                      <option value="Savings">Savings account</option>
                      <option value="Current">Current account</option>
                      <option value="Student">Student account</option>
                    </select>

                    <select
                      className="w-full rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-3 font-semibold text-slate-950 outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100"
                      name="bankName"
                      value={editForm.bankName}
                      onChange={handleEditChange}
                    >
                      {bankOptions.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>

                    <input
                      className="w-full rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-3 font-semibold text-slate-950 outline-none transition focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:col-span-2"
                      name="accountNumber"
                      placeholder="Account number"
                      inputMode="numeric"
                      minLength="9"
                      maxLength="18"
                      value={editForm.accountNumber}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      className="rounded-2xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={savingProfile}
                      type="submit"
                    >
                      {savingProfile ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      className="rounded-2xl border border-purple-100 bg-white px-5 py-3 text-sm font-bold text-[#6D28D9] transition hover:bg-purple-50"
                      onClick={handleCancelEdit}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="mt-6 rounded-2xl border border-purple-100 bg-white px-5 py-3 text-sm font-bold text-[#6D28D9] transition hover:bg-purple-50"
                  onClick={() => setIsEditing(true)}
                  type="button"
                >
                  Edit profile
                </button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:col-span-2">
              <Link
                className="rounded-[1.75rem] border border-purple-200 bg-white p-6 shadow-lg shadow-purple-200/50 transition hover:-translate-y-1 hover:shadow-purple-300/70"
                to="/transfer"
              >
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Action
                </p>
                <h3 className="mt-3 text-xl font-black text-[#6D28D9]">
                  Send money
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Start a new transfer to another iPay account.
                </p>
              </Link>

              <Link
                className="rounded-[1.75rem] border border-purple-200 bg-white p-6 shadow-lg shadow-purple-200/50 transition hover:-translate-y-1 hover:shadow-purple-300/70"
                to="/history"
              >
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Records
                </p>
                <h3 className="mt-3 text-xl font-black text-[#6D28D9]">
                  Transaction History
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Review sent and received payment activity.
                </p>
              </Link>
            </div>

            <div className="rounded-[1.75rem] border border-red-100 bg-white p-6 shadow-lg shadow-red-100/60 lg:col-span-2">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-red-500">
                    Account control
                  </p>
                  <h3 className="mt-2 text-xl font-black text-slate-950">
                    Delete Account
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Permanently remove your profile and transaction records from iPay.
                  </p>
                </div>
                <button
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deletingAccount}
                  onClick={handleDeleteAccount}
                  type="button"
                >
                  {deletingAccount ? "Deleting..." : "Delete account"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-purple-200 bg-white p-8 shadow-lg shadow-purple-200/50">
            <Loader />
          </div>
        )}
      </section>
    </main>
  );
}

export default Dashboard;
