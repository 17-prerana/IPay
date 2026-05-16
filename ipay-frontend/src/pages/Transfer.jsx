import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "../components/Alert";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Transfer() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    receiverEmail: "",
    amount: "",
  });

  const [message, setMessage] = useState("");
  const [dailyLimit, setDailyLimit] = useState(null);
  const [fraudRisk, setFraudRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationModal, setVerificationModal] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState(null);

  // Fetch daily transaction summary
  useEffect(() => {
    const fetchDailyLimit = async () => {
      try {
        const res = await api.get("/transactions/daily-summary");
        setDailyLimit(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch daily limit:", err);
        setLoading(false);
      }
    };

    fetchDailyLimit();
  }, []);

  // Analyze fraud risk when amount changes
  useEffect(() => {
    const analyzeFraud = async () => {
      if (formData.amount && Number(formData.amount) > 0) {
        try {
          const res = await api.post("/transactions/analyze-risk", {
            amount: Number(formData.amount)
          });
          setFraudRisk(res.data);
        } catch (err) {
          console.error("Failed to analyze fraud risk:", err);
        }
      } else {
        setFraudRisk(null);
      }
    };

    const timer = setTimeout(analyzeFraud, 500);
    return () => clearTimeout(timer);
  }, [formData.amount]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dailyLimit) return;

    const transferAmount = Number(formData.amount);

    // Check if transfer requires verification (> 50% of daily limit or high fraud risk)
    if (transferAmount >= dailyLimit.largeTransactionThreshold || (fraudRisk?.riskLevel === "HIGH")) {
      setPendingTransfer(transferAmount);
      setVerificationModal(true);
      return;
    }

    await executeTransfer();
  };

  const executeTransfer = async () => {
    try {
      const res = await api.post("/transactions/transfer", formData);

      setMessage(res.data?.data?.msg || res.data?.msg || "Transfer successful");

      setFormData({
        receiverEmail: "",
        amount: "",
      });

      setVerificationModal(false);
      setPendingTransfer(null);
      setFraudRisk(null);

      // Refresh daily limit
      const limitRes = await api.get("/transactions/daily-summary");
      setDailyLimit(limitRes.data);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.msg || "Transfer failed");
      setVerificationModal(false);
      setPendingTransfer(null);
      console.error(err.response?.data || err.message);
    }
  };

  const handleConfirmTransfer = () => {
    executeTransfer();
  };

  const handleCancelTransfer = () => {
    setVerificationModal(false);
    setPendingTransfer(null);
  };

  const getSpendingPercentage = () => {
    if (!dailyLimit) return 0;
    return (dailyLimit.spent / dailyLimit.dailyLimit) * 100;
  };

  const isNearLimit = dailyLimit && getSpendingPercentage() >= 80;
  const isLimitReached = dailyLimit && dailyLimit.limitReached;

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "HIGH":
        return { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", icon: "🚨" };
      case "MEDIUM":
        return { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", icon: "⚠️" };
      default:
        return { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", icon: "✅" };
    }
  };

  const getRiskFactorIcon = (type) => {
    const icons = {
      HIGH_AMOUNT: "💰",
      ELEVATED_AMOUNT: "📈",
      MIDNIGHT_TRANSACTION: "🌙",
      REPEATED_FAILURES: "❌",
      MULTIPLE_FAILURES: "⚠️",
      RAPID_TRANSACTIONS: "⚡",
      LARGE_BALANCE_TRANSFER: "🔓"
    };
    return icons[type] || "•";
  };

  return (
    <main className="min-h-screen bg-[#F5F3FF] px-4 py-6 text-slate-950 sm:px-6">
      <section className="mx-auto w-full max-w-6xl">
        <Navbar />

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
          {/* Left Column: Info Box + Fraud Detection */}
          <div className="space-y-6 flex flex-col">
            <aside className="rounded-[1.75rem] bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#6D28D9] p-8 text-white shadow-2xl shadow-purple-400/40 transition hover:shadow-purple-400/60">
              <p className="text-sm font-bold uppercase tracking-wide text-purple-100">
                Secure transfer
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight leading-tight">
                Send money with confidence.
              </h1>
              <p className="mt-6 leading-7 text-purple-50">
                Enter the receiver email, add the amount, and IPay will process
                your wallet-to-wallet transaction securely.
              </p>

              <div className="mt-8 grid gap-4">
                {["Verified account route", "Instant balance update"].map(
                  (item) => (
                    <div className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 p-4 text-sm font-bold text-purple-50 transition hover:bg-white/25" key={item}>
                      ✓ {item}
                    </div>
                  ),
                )}
              </div>
            </aside>

            {/* Fraud Risk Detection Card */}
            {fraudRisk && (
              <div className={`rounded-[1.75rem] border-2 p-6 transition ${getRiskColor(fraudRisk.riskLevel).bg} ${getRiskColor(fraudRisk.riskLevel).border}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{getRiskColor(fraudRisk.riskLevel).icon}</span>
                  <div>
                    <h3 className={`text-lg font-black ${getRiskColor(fraudRisk.riskLevel).text}`}>
                      {fraudRisk.riskLevel === "HIGH" ? "Suspicious Activity Detected" : fraudRisk.riskLevel === "MEDIUM" ? "Potential Risk Detected" : "Transaction Looks Normal"}
                    </h3>
                    <p className={`text-xs font-semibold ${getRiskColor(fraudRisk.riskLevel).text}`}>
                      Risk Score: {fraudRisk.riskScore}/100
                    </p>
                  </div>
                </div>

                {fraudRisk.riskFactors.length > 0 && (
                  <div className="space-y-2">
                    <p className={`text-xs font-bold uppercase tracking-wide ${getRiskColor(fraudRisk.riskLevel).text} mb-3`}>
                      Risk Factors ({fraudRisk.riskFactors.length})
                    </p>
                    {fraudRisk.riskFactors.map((factor, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 rounded-lg p-3 ${
                          factor.severity === "high"
                            ? "bg-red-100 border-l-4 border-red-500"
                            : "bg-yellow-100 border-l-4 border-yellow-500"
                        }`}
                      >
                        <span className="text-lg mt-0.5">{getRiskFactorIcon(factor.type)}</span>
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${factor.severity === "high" ? "text-red-700" : "text-yellow-700"}`}>
                            {factor.type.replace(/_/g, " ")}
                          </p>
                          <p className={`text-xs ${factor.severity === "high" ? "text-red-600" : "text-yellow-600"}`}>
                            {factor.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {fraudRisk.riskLevel === "HIGH" && (
                  <div className="mt-4 rounded-lg bg-red-100 border-l-4 border-red-500 p-3">
                    <p className="text-xs font-bold text-red-700">⚠️ Additional Verification Required</p>
                    <p className="text-xs text-red-600 mt-1">You'll need to confirm this transaction before it's processed.</p>
                  </div>
                )}

                {fraudRisk.riskLevel === "MEDIUM" && (
                  <div className="mt-4 rounded-lg bg-yellow-100 border-l-4 border-yellow-500 p-3">
                    <p className="text-xs font-bold text-yellow-700">ℹ️ Please Review Carefully</p>
                    <p className="text-xs text-yellow-600 mt-1">Make sure you recognize these indicators before proceeding.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Transfer Form (Taller) */}
          <section>
            {/* Transfer Form Card */}
            <div className="rounded-[1.75rem] border-2 border-purple-200 bg-white p-10 shadow-2xl shadow-purple-200/50 transition hover:shadow-purple-300/60 min-h-[820px] flex flex-col">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-wide text-[#6D28D9]">
                  New payment
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Transfer details
                </h2>
                <p className="mt-3 text-slate-600 font-medium">
                  Send funds securely to another IPay user.
                </p>
              </div>

              <Alert message={message} />

              {/* Daily Limit Indicator */}
              {!loading && dailyLimit && (
                <div className={`mb-6 rounded-xl p-4 transition ${isLimitReached ? 'bg-red-50 border-2 border-red-300' : isNearLimit ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-[#EDE9FE] border-2 border-purple-200'}`}>
                  <div className="flex justify-between mb-3">
                    <span className={`text-sm font-bold ${isLimitReached ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-[#6D28D9]'}`}>
                      Daily Limit: Rs. {dailyLimit.dailyLimit.toLocaleString()}
                    </span>
                    <span className={`text-sm font-bold ${isLimitReached ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-slate-600'}`}>
                      {dailyLimit.spent.toLocaleString()} / {dailyLimit.remaining.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isLimitReached ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9]'}`}
                      style={{ width: `${Math.min(getSpendingPercentage(), 100)}%` }}
                    ></div>
                  </div>

                  {isLimitReached && (
                    <p className="text-xs font-semibold text-red-600 mt-2">
                      ⚠ Daily limit reached. Try again tomorrow.
                    </p>
                  )}

                  {isNearLimit && !isLimitReached && (
                    <p className="text-xs font-semibold text-yellow-600 mt-2">
                      ⚠ You're approaching your daily limit. Only Rs. {dailyLimit.remaining.toLocaleString()} remaining.
                    </p>
                  )}
                </div>
              )}

              <form className="mt-10 space-y-7 flex-grow flex flex-col" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Receiver Email
                </label>
                <input
                  className="w-full rounded-xl border-2 border-purple-200 bg-[#EDE9FE] px-5 py-3 text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100"
                  type="email"
                  name="receiverEmail"
                  placeholder="Enter receiver's email"
                  value={formData.receiverEmail}
                  onChange={handleChange}
                  required
                  disabled={isLimitReached}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Amount (Rs.)
                </label>
                <input
                  className="w-full rounded-xl border-2 border-purple-200 bg-[#EDE9FE] px-5 py-3 text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-[#7C3AED] focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:opacity-50"
                  type="number"
                  name="amount"
                  placeholder="Enter amount"
                  min="1"
                  step="1"
                  max={dailyLimit?.remaining || undefined}
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  disabled={isLimitReached}
                />
                {formData.amount && dailyLimit && (
                  <p className="text-xs text-slate-600 mt-2">
                    Remaining today: Rs. {Math.max(0, dailyLimit.remaining - Number(formData.amount)).toLocaleString()}
                  </p>
                )}
              </div>

              <button
                className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-5 py-3 text-base font-bold text-white shadow-lg shadow-purple-300/50 transition hover:shadow-purple-400/70 hover:from-[#6D28D9] hover:to-[#5B21B6] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                type="submit"
                disabled={isLimitReached}
              >
                {isLimitReached ? "Daily limit reached" : "Send money"}
              </button>
            </form>
            </div>
          </section>
        </div>
      </section>

      {/* Verification Modal */}
      {verificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full border-2 border-purple-200">
            <div className="mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${fraudRisk?.riskLevel === "HIGH" ? "bg-red-100" : "bg-yellow-100"}`}>
                <span className="text-2xl">{fraudRisk?.riskLevel === "HIGH" ? "🚨" : "⚠️"}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-950">Confirm Transfer</h3>
              <p className="mt-2 text-slate-600 font-medium">
                {fraudRisk?.riskLevel === "HIGH"
                  ? "Suspicious activity detected. Please verify this large or unusual transaction."
                  : "This is a large transaction. Please review and confirm."}
              </p>
            </div>

            <div className="bg-[#EDE9FE] rounded-xl p-4 mb-6 border-2 border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-700">To</span>
                <span className="text-sm font-bold text-slate-950">{formData.receiverEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Amount</span>
                <span className="text-lg font-black text-[#6D28D9]">Rs. {pendingTransfer?.toLocaleString()}</span>
              </div>
            </div>

            {fraudRisk?.riskLevel === "HIGH" && fraudRisk?.riskFactors.length > 0 && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-300 p-3">
                <p className="text-xs font-bold text-red-700 mb-2">Risk Indicators:</p>
                <ul className="space-y-1">
                  {fraudRisk.riskFactors.slice(0, 3).map((factor, idx) => (
                    <li key={idx} className="text-xs text-red-600">
                      • {factor.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleCancelTransfer}
                className="flex-1 rounded-xl border-2 border-purple-200 bg-white px-4 py-3 text-sm font-bold text-[#6D28D9] transition hover:bg-[#F5F3FF]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransfer}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-300/50 transition hover:shadow-purple-400/70 active:scale-95"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Transfer;
