import { useState } from "react";
import api from "../../core/api/api";
import Swal from "sweetalert2";
import { getUser } from "../dashboard/helpers/user.helper";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "profile" | "security";

interface ProfileForm { name: string; email: string; }
interface PasswordForm { currentPassword: string; newPassword: string; confirmPassword: string; }
interface FieldError { [key: string]: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputBase =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 " +
  "focus:border-indigo-400 transition disabled:opacity-50 disabled:cursor-not-allowed";

const errInput = "border-red-400 bg-red-50/40 focus:ring-red-400/30 focus:border-red-400";

function FieldGroup({
  label, id, type = "text", value, onChange, error, disabled, placeholder,
  hint,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; error?: string; disabled?: boolean;
  placeholder?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`${inputBase} ${error ? errInput : ""} ${isPassword ? "pr-12" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition text-xs font-semibold"
          >
            {show ? "Ocultar" : "Ver"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SaveButton({ loading, label = "Guardar cambios" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700
        active:scale-95 text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Guardando…
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const user = getUser();
  const [form, setForm] = useState<ProfileForm>({ name: user.name ?? "", email: user.email ?? "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});

  const validate = (): boolean => {
    const errs: FieldError = {};
    if (!form.name.trim() || form.name.trim().length < 3)
      errs.name = "El nombre debe tener al menos 3 caracteres";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Ingresa un correo válido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.put("/auth/profile", { name: form.name, email: form.email });
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: form.name, email: form.email }));
      Swal.fire({ title: "¡Listo!", text: "Perfil actualizado correctamente", icon: "success", timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Error al actualizar el perfil";
      Swal.fire({ title: "Error", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const initials = (form.name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
          flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">{form.name || "Sin nombre"}</p>
          <p className="text-xs text-slate-400">{form.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold capitalize">
            {user.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup
          label="Nombre completo"
          id="settings-name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          error={errors.name}
          placeholder="Tu nombre"
        />
        <FieldGroup
          label="Correo electrónico"
          id="settings-email"
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          error={errors.email}
          placeholder="tu@correo.com"
          hint="Úsalo para iniciar sesión"
        />
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton loading={loading} />
      </div>
    </form>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});

  const validate = (): boolean => {
    const errs: FieldError = {};
    if (!form.currentPassword) errs.currentPassword = "Ingresa tu contraseña actual";
    if (form.newPassword.length < 8) errs.newPassword = "La nueva contraseña debe tener al menos 8 caracteres";
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = "Las contraseñas no coinciden";
    if (form.newPassword === form.currentPassword && form.currentPassword)
      errs.newPassword = "La nueva contraseña debe ser diferente a la actual";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const strength = (p: string): { label: string; color: string; width: string } => {
    if (!p) return { label: "", color: "bg-slate-200", width: "0%" };
    const checks = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)];
    const score = checks.filter(Boolean).length;
    if (score <= 1) return { label: "Débil", color: "bg-red-400", width: "25%" };
    if (score === 2) return { label: "Regular", color: "bg-amber-400", width: "50%" };
    if (score === 3) return { label: "Buena", color: "bg-emerald-400", width: "75%" };
    return { label: "Fuerte", color: "bg-emerald-500", width: "100%" };
  };

  const pw = strength(form.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      Swal.fire({ title: "¡Contraseña actualizada!", text: "Tu contraseña fue cambiada correctamente", icon: "success", timer: 2000, showConfirmButton: false });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Error al cambiar la contraseña";
      Swal.fire({ title: "Error", text: Array.isArray(msg) ? msg.join(", ") : msg, icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info box */}
      <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
        <span className="text-amber-500 mt-0.5">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Cambia tu contraseña regularmente</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Usa al menos 8 caracteres, una mayúscula, un número y un símbolo especial.
          </p>
        </div>
      </div>

      <FieldGroup
        label="Contraseña actual"
        id="settings-current-pw"
        type="password"
        value={form.currentPassword}
        onChange={(v) => setForm((f) => ({ ...f, currentPassword: v }))}
        error={errors.currentPassword}
        placeholder="••••••••"
      />

      <div className="space-y-3">
        <FieldGroup
          label="Nueva contraseña"
          id="settings-new-pw"
          type="password"
          value={form.newPassword}
          onChange={(v) => setForm((f) => ({ ...f, newPassword: v }))}
          error={errors.newPassword}
          placeholder="••••••••"
        />
        {/* Strength bar */}
        {form.newPassword && (
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pw.color}`}
                style={{ width: pw.width }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Seguridad: <span className="font-semibold">{pw.label}</span>
            </p>
          </div>
        )}
      </div>

      <FieldGroup
        label="Confirmar nueva contraseña"
        id="settings-confirm-pw"
        type="password"
        value={form.confirmPassword}
        onChange={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
        error={errors.confirmPassword}
        placeholder="••••••••"
      />

      <div className="flex justify-end pt-2">
        <SaveButton loading={loading} label="Cambiar contraseña" />
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "profile",  label: "Perfil",    icon: "👤" },
    { id: "security", label: "Seguridad", icon: "🔒" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          Cuenta
        </p>
        <h1
          style={{ fontFamily: "'Syne', sans-serif" }}
          className="text-3xl font-black text-slate-900"
        >
          Configuración
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Administra tu información personal y seguridad
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all
                border-b-2 -mb-px
                ${tab === t.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {tab === "profile"  && <ProfileTab />}
          {tab === "security" && <SecurityTab />}
        </div>
      </div>

      {/* Danger zone – only shown on profile tab */}
      {tab === "profile" && (
        <div className="mt-6 p-5 rounded-2xl border border-red-100 bg-red-50/50">
          <p className="text-sm font-semibold text-red-700 mb-1">Zona peligrosa</p>
          <p className="text-xs text-red-500 mb-3">
            Cerrar sesión en todos los dispositivos. Esta acción invalidará tu sesión actual.
          </p>
          <button
            onClick={() => {
              Swal.fire({
                title: "¿Cerrar todas las sesiones?",
                text: "Deberás iniciar sesión de nuevo en todos tus dispositivos.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#dc2626",
                confirmButtonText: "Sí, cerrar sesiones",
                cancelButtonText: "Cancelar",
              });
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600
              border border-red-200 bg-white hover:bg-red-50 transition active:scale-95"
          >
            Cerrar todas las sesiones
          </button>
        </div>
      )}
    </div>
  );
}