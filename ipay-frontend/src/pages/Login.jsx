import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Alert from "../components/Alert";
import { AuthContext } from "../context/AuthContextValue";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [resetForm, setResetForm] = useState({
    email: "",
    otp: "",
    password: "",
  });

  const [resetMode, setResetMode] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleResetChange = (e) => {
    setResetForm({
      ...resetForm,
      [e.target.name]:
        e.target.name === "otp"
          ? e.target.value.replace(/\D/g, "")
          : e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", formData);

      login(res.data.token);

      localStorage.setItem("userEmail", res.data.user.email);

      setMessage("Login successful");

      console.log(res.data);

      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Login failed");

      console.error(err.response?.data || err.message);
    }
  };

  const handleRequestResetOtp = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/password/request-reset", {
        email: resetForm.email,
      });

      setResetOtpSent(true);
      setMessage(res.data?.msg || "Password reset OTP sent to your email");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Unable to send reset OTP");
      console.error(err.response?.data || err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/password/reset", resetForm);

      setFormData({
        email: resetForm.email,
        password: "",
      });
      setResetForm({
        email: "",
        otp: "",
        password: "",
      });
      setResetMode(false);
      setResetOtpSent(false);
      setMessage(res.data?.msg || "Password reset successful");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Password reset failed");
      console.error(err.response?.data || err.message);
    }
  };

  const openResetMode = () => {
    setResetForm({
      email: formData.email,
      otp: "",
      password: "",
    });
    setResetMode(true);
    setResetOtpSent(false);
    setMessage("");
  };

  const closeResetMode = () => {
    setResetMode(false);
    setResetOtpSent(false);
    setMessage("");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ddd6fe,transparent_34%),linear-gradient(135deg,#faf7ff,#f5f3ff_48%,#fdfcff)] px-5 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex rounded-full border border-violet-100 bg-white/80 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm">
              Trusted digital wallet
            </div>
            <h1 className="mt-8 text-6xl font-bold tracking-tight text-slate-950">
              Pay, track, and manage money with IPay.
            </h1>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {["Fast transfers", "Balance view", "Payment history"].map(
                (item) => (
                  <div
                    className="rounded-2xl border border-violet-100 bg-white/85 p-5 shadow-sm"
                    key={item}
                  >
                    <div className="mb-4 h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-400" />
                    <p className="text-sm font-bold text-slate-900">{item}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg rounded-[2rem] border border-violet-100 bg-white/90 p-8 shadow-2xl shadow-violet-100/70 backdrop-blur sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">
              IPay secure access
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              {resetMode ? "Reset password" : "Welcome back"}
            </h1>
            <p className="mt-3 text-slate-600">
              {resetMode
                ? resetOtpSent
                  ? "Enter the OTP and choose a new password."
                  : "We will send a reset OTP to your registered email."
                : "Login to view your wallet, send money, and track payments."}
            </p>
          </div>

          {resetMode ? (
            <form
              className="space-y-5"
              onSubmit={resetOtpSent ? handleResetPassword : handleRequestResetOtp}
            >
              <input
                className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                type="email"
                name="email"
                placeholder="Registered email address"
                value={resetForm.email}
                onChange={handleResetChange}
                required
              />

              {resetOtpSent && (
                <>
                  <input
                    className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-center text-2xl font-black tracking-[0.4em] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    type="text"
                    name="otp"
                    inputMode="numeric"
                    maxLength="6"
                    placeholder="000000"
                    value={resetForm.otp}
                    onChange={handleResetChange}
                    required
                  />

                  <input
                    className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    type="password"
                    name="password"
                    placeholder="New password"
                    value={resetForm.password}
                    onChange={handleResetChange}
                    required
                  />
                </>
              )}

              <button
                className="w-full rounded-2xl bg-violet-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                type="submit"
              >
                {resetOtpSent ? "Reset password" : "Send reset OTP"}
              </button>

              <button
                className="w-full rounded-2xl border border-violet-100 bg-white px-5 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
                onClick={closeResetMode}
                type="button"
              >
                Back to login
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
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

              <div className="text-right">
                <button
                  className="text-sm font-bold text-violet-600 transition hover:text-violet-800"
                  onClick={openResetMode}
                  type="button"
                >
                  Forgot password?
                </button>
              </div>

              <button
                className="w-full rounded-2xl bg-violet-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                type="submit"
              >
                Login
              </button>
            </form>
          )}

          <Alert message={message} />

          <p className="mt-7 text-center text-sm text-slate-600">
            {resetMode ? (
              "Remembered your password?"
            ) : (
              <>
                New to IPay?{" "}
                <Link className="font-bold text-violet-600 hover:text-violet-700" to="/signup">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </section>
      </div>
    </main>
  );
}

export default Login;
