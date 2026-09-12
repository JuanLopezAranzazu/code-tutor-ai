import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 text-base font-bold text-slate-100 sm:text-lg"
        >
          <GraduationCap className="shrink-0 text-brand-500" size={22} />
          <span className="truncate">Code Tutor AI</span>
        </Link>

        {user && (
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-400 sm:gap-3">
            <span className="hidden min-w-0 truncate sm:inline">
              {user.name || user.email}
            </span>
            <button
              onClick={handleLogout}
              title="Salir"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-1.5 text-slate-300 hover:bg-slate-800 sm:px-3"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
