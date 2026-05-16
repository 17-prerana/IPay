import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContextValue";

function Navbar() {
  const navigate = useNavigate();

  const { logout } = useContext(AuthContext);

  const linkClass = ({ isActive }) =>
    `rounded-2xl px-4 py-2 text-sm font-bold transition ${
      isActive
        ? "bg-violet-600 text-white shadow-lg shadow-violet-100"
        : "text-slate-600 hover:bg-violet-50 hover:text-violet-900"
    }`;

  const handleLogout = () => {
    logout();

    navigate("/");
  };

  return (
    <nav className="mb-8 rounded-[1.75rem] border border-violet-100 bg-white/90 px-5 py-4 shadow-xl shadow-violet-100/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/ipay-logo.svg"
            alt="iPay Logo"
            className="h-11 w-11 rounded-2xl shadow-md shadow-purple-200"
          />
          <div>
            <p className="text-xl font-black tracking-tight text-slate-950">
              iPay
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Digital banking
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>

          <NavLink to="/transfer" className={linkClass}>
            Transfer
          </NavLink>

          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>

          <button
            className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
