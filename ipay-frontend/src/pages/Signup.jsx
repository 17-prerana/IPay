import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Alert from "../components/Alert";
import { AuthContext } from "../context/AuthContextValue";
import api from "../services/api";

function Signup() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const maxDateOfBirth = new Date();
  maxDateOfBirth.setFullYear(maxDateOfBirth.getFullYear() - 18);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    accountType: "Savings",
    bankName: "HDFC Bank",
    accountNumber: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRequestOtp = async () => {
    const res = await api.post("/auth/signup/request-otp", formData);

    setOtpSent(true);
    setMessage(res.data?.msg || "OTP sent to your email");
  };

  const handleVerifyOtp = async () => {
    const res = await api.post("/auth/signup/verify", {
      email: formData.email,
      otp,
    });

    login(res.data.token);
    localStorage.setItem("userEmail", res.data.user.email);
    setMessage("Signup successful");
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (otpSent) {
        await handleVerifyOtp();
      } else {
        await handleRequestOtp();
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || "Signup failed");

      console.error(err.response?.data || err.message);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ddd6fe,transparent_34%),linear-gradient(135deg,#faf7ff,#f5f3ff_50%,#fdfcff)] px-5 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl rounded-[2rem] border border-violet-100 bg-white/80 p-8 shadow-xl shadow-violet-100/70 backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-wide text-violet-700">
              Start with iPay
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              WELCOME TO IPAY
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Create an account, verify your email, and keep payment activity
              organized in one calm dashboard.
            </p>

            <div className="mt-8 rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] p-8 text-white shadow-2xl shadow-purple-400/50">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-wider text-purple-200 mb-4">
                  Quick start
                </p>
                <p className="text-lg leading-8 font-medium text-purple-50">
                  Create an account, verify your email, and keep payment activity organized in one calm dashboard.
                </p>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["Fast & Secure", "Privacy First", "Easy to Use"].map((item) => (
                  <div
                    className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 p-4 text-center text-sm font-bold text-purple-50 transition hover:bg-white/25"
                    key={item}
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg rounded-[2rem] border border-violet-100 bg-white/90 p-8 shadow-2xl shadow-violet-100/70 backdrop-blur sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">
              Create account
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              {otpSent ? "Verify OTP" : "Join iPay"}
            </h1>
            <p className="mt-3 text-slate-600">
              {otpSent
                ? `Enter the 6-digit code sent to ${formData.email}.`
                : "Set up your secure profile and start managing payments."}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!otpSent ? (
              <>
                <input
                  className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    type="date"
                    name="dateOfBirth"
                    max={maxDateOfBirth.toISOString().split("T")[0]}
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />

                  <select
                    className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <select
                  className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                >
                  <option value="Savings">Savings account</option>
                  <option value="Current">Current account</option>
                  <option value="Student">Student account</option>
                </select>

                <select
                  className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="SBI">SBI</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="PNB">PNB</option>
                  <option value="Other">Other</option>
                </select>

                <div className="relative">
                  <input
                    className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 pr-14 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    type={showAccountNumber ? "text" : "password"}
                    name="accountNumber"
                    placeholder="Account number"
                    inputMode="numeric"
                    minLength="9"
                    maxLength="18"
                    value={formData.accountNumber}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value.replace(/\D/g, ""),
                      });
                    }}
                  />
                  <button
                    aria-label={showAccountNumber ? "Hide account number" : "Show account number"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-violet-700 transition hover:bg-violet-100"
                    onClick={() => setShowAccountNumber((current) => !current)}
                    type="button"
                  >
                    {showAccountNumber ? (
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.94 17.94A10.9 10.9 0 0 1 12 20C7 20 2.73 16.89 1 12a18.45 18.45 0 0 1 5.06-6.06" />
                        <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                        <path d="M9.9 4.24A10.88 10.88 0 0 1 12 4c5 0 9.27 3.11 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="m1 1 22 22" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <input
                  className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />

                <input
                  className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </>
            ) : (
              <input
                className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-center text-2xl font-black tracking-[0.4em] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            )}

            <button
              className="w-full rounded-2xl bg-violet-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
              type="submit"
            >
              {otpSent ? "Verify and create account" : "Send OTP"}
            </button>
          </form>

          {otpSent && (
            <button
              className="mt-4 w-full rounded-2xl border border-violet-100 bg-white px-5 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
              onClick={() => {
                setOtp("");
                setOtpSent(false);
                setMessage("");
              }}
              type="button"
            >
              Change details
            </button>
          )}

          <Alert message={message} />

          <p className="mt-7 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-bold text-violet-600 hover:text-violet-700" to="/">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default Signup;
