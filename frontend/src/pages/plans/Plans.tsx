import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Edit, Plus, Trash2 } from "lucide-react";
import PageHeader from "../../shared/components/PageHeader";
import ButtonActionDataTable from "../../shared/components/ui/ButtonActionDataTable";
import { catchError } from "../../shared/errors/catch-error";
import {
  planService,
  type CreatePlanPayload,
} from "../../services/plan.service";
import type { Plan } from "../../shared/types/plan.type";

const MySwal = withReactContent(Swal);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BoolBadge = ({ value }: { value: boolean }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
      value ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
    }`}
  >
    {value ? "Sí" : "No"}
  </span>
);

// ─── Plan form HTML (used in both create and edit) ────────────────────────────

function planFormHtml(defaults?: Partial<Plan & { max_vehicles: number }>) {
  const v = (key: string, fallback: any) =>
    defaults?.[key as keyof typeof defaults] ?? fallback;

  return `
    <div style="text-align:left; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div style="grid-column:span 2">
        <label style="font-size:12px;font-weight:600;color:#374151">Nombre del plan*</label>
        <input id="p-name" class="swal2-input" style="margin:4px 0 0;width:100%;box-sizing:border-box"
          placeholder="Ej. Básico" value="${v("name", "")}" />
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:#374151">Precio (COP)</label>
        <input id="p-price" type="number" min="0" class="swal2-input" style="margin:4px 0 0;width:100%;box-sizing:border-box"
          placeholder="0" value="${v("price", 0)}" />
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:#374151">Máx. usuarios</label>
        <input id="p-max-users" type="number" min="1" class="swal2-input" style="margin:4px 0 0;width:100%;box-sizing:border-box"
          placeholder="5" value="${v("max_users", 1)}" />
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:#374151">Máx. sedes</label>
        <input id="p-max-branches" type="number" min="1" class="swal2-input" style="margin:4px 0 0;width:100%;box-sizing:border-box"
          placeholder="1" value="${v("max_branches", 1)}" />
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:#374151">Máx. vehículos</label>
        <input id="p-max-vehicles" type="number" min="1" class="swal2-input" style="margin:4px 0 0;width:100%;box-sizing:border-box"
          placeholder="5" value="${v("max_vehicles", 5)}" />
      </div>
      <div style="grid-column:span 2;display:flex;flex-direction:column;gap:8px;padding:12px;background:#f8fafc;border-radius:8px;margin-top:4px">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;margin:0 0 4px">Características</p>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="p-reports" ${v("advanced_reports_enabled", false) ? "checked" : ""} />
          Reportes avanzados
        </label>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="p-alerts" ${v("email_alerts_enabled", false) ? "checked" : ""} />
          Alertas por email
        </label>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="p-support" ${v("priority_support", false) ? "checked" : ""} />
          Soporte prioritario
        </label>
      </div>
    </div>
  `;
}

function getFormValues(): CreatePlanPayload | null {
  const name = (document.getElementById("p-name") as HTMLInputElement).value.trim();
  if (!name) return null;
  return {
    name,
    price: parseFloat((document.getElementById("p-price") as HTMLInputElement).value) || 0,
    max_users: parseInt((document.getElementById("p-max-users") as HTMLInputElement).value) || 1,
    max_branches: parseInt((document.getElementById("p-max-branches") as HTMLInputElement).value) || 1,
    max_vehicles: parseInt((document.getElementById("p-max-vehicles") as HTMLInputElement).value) || 5,
    advanced_reports_enabled: (document.getElementById("p-reports") as HTMLInputElement).checked,
    email_alerts_enabled: (document.getElementById("p-alerts") as HTMLInputElement).checked,
    priority_support: (document.getElementById("p-support") as HTMLInputElement).checked,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await planService.getPlans();
      setPlans(data);
    } catch (error) {
      await catchError(error, MySwal, "Error al cargar los planes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // ── Create ──
  const handleCreate = async () => {
    const { isConfirmed, value } = await MySwal.fire({
      title: "Crear nuevo plan",
      html: planFormHtml(),
      width: 540,
      showCancelButton: true,
      confirmButtonText: "Crear plan",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4f46e5",
      focusConfirm: false,
      preConfirm: () => {
        const vals = getFormValues();
        if (!vals?.name) {
          Swal.showValidationMessage("El nombre del plan es obligatorio");
          return false;
        }
        return vals;
      },
    });

    if (!isConfirmed || !value) return;
    try {
      await planService.create(value);
      MySwal.fire({ title: "✅ Plan creado", icon: "success", timer: 2000, showConfirmButton: false });
      loadPlans();
    } catch (error) {
      await catchError(error, MySwal, "Error al crear el plan");
    }
  };

  // ── Edit ──
  const handleEdit = async (plan: Plan) => {
    const { isConfirmed, value } = await MySwal.fire({
      title: `Editar — ${plan.name}`,
      html: planFormHtml(plan as any),
      width: 540,
      showCancelButton: true,
      confirmButtonText: "Guardar cambios",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4f46e5",
      focusConfirm: false,
      preConfirm: () => {
        const vals = getFormValues();
        if (!vals?.name) {
          Swal.showValidationMessage("El nombre del plan es obligatorio");
          return false;
        }
        return vals;
      },
    });

    if (!isConfirmed || !value) return;
    try {
      await planService.update(plan.id, value);
      MySwal.fire({ title: "✅ Plan actualizado", icon: "success", timer: 2000, showConfirmButton: false });
      loadPlans();
    } catch (error) {
      await catchError(error, MySwal, "Error al editar el plan");
    }
  };

  // ── Delete ──
  const handleDelete = async (plan: Plan) => {
    const { isConfirmed } = await MySwal.fire({
      title: `¿Eliminar "${plan.name}"?`,
      text: "Los renters con este plan perderán su plan asignado.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!isConfirmed) return;
    try {
      await planService.remove(plan.id);
      MySwal.fire({ title: "Eliminado", icon: "success", timer: 2000, showConfirmButton: false });
      loadPlans();
    } catch (error) {
      await catchError(error, MySwal, "Error al eliminar el plan");
    }
  };

  // ── View detail ──
  const handleView = (plan: Plan) => {
    const p = plan as any;
    MySwal.fire({
      title: plan.name,
      html: `
        <div style="text-align:left;font-size:13px;line-height:2">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin-bottom:16px">
            <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Precio</span>
              <p style="margin:0;font-weight:700;color:#059669">$${Number(plan.price).toLocaleString("es-CO")} COP</p>
            </div>
            <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">ID</span>
              <p style="margin:0;font-family:monospace">${plan.id}</p>
            </div>
            <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Máx. usuarios</span>
              <p style="margin:0;font-weight:600">${plan.max_users}</p>
            </div>
            <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Máx. sedes</span>
              <p style="margin:0;font-weight:600">${plan.max_branches}</p>
            </div>
            <div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Máx. vehículos</span>
              <p style="margin:0;font-weight:600">${p.max_vehicles ?? "—"}</p>
            </div>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0"/>
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin:0 0 8px">Características</p>
          <div style="display:flex;flex-direction:column;gap:6px">
            <span>${plan.advanced_reports_enabled ? "✅" : "❌"} Reportes avanzados</span>
            <span>${plan.email_alerts_enabled ? "✅" : "❌"} Alertas por email</span>
            <span>${plan.priority_support ? "✅" : "❌"} Soporte prioritario</span>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      width: 420,
    });
  };

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Sistema"
        title="Planes de suscripción"
        description="Gestiona los planes disponibles para las rentadoras"
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus size={16} />
            Nuevo plan
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">No hay planes registrados</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {plans.map((plan) => {
            const p = plan as any;
            return (
              <div
                key={plan.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all"
              >
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">
                        {plan.name}
                      </h3>
                      <p className="text-2xl font-black text-indigo-600 mt-1">
                        ${Number(plan.price).toLocaleString("es-CO")}
                        <span className="text-sm font-normal text-slate-400 ml-1">COP</span>
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg">
                      ID {plan.id}
                    </span>
                  </div>
                </div>

                {/* Limits */}
                <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-slate-100">
                  {[
                    { label: "Usuarios", value: plan.max_users },
                    { label: "Sedes", value: plan.max_branches },
                    { label: "Vehículos", value: p.max_vehicles ?? "∞" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-xl font-black text-slate-700">{value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="px-5 py-3 flex flex-col gap-1.5 border-b border-slate-100">
                  {[
                    { label: "Reportes avanzados", value: plan.advanced_reports_enabled },
                    { label: "Alertas por email", value: plan.email_alerts_enabled },
                    { label: "Soporte prioritario", value: plan.priority_support },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm text-slate-600">
                      <span>{label}</span>
                      <BoolBadge value={value} />
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 flex items-center gap-2 bg-slate-50">
                  <button
                    onClick={() => handleView(plan)}
                    className="flex-1 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-white transition"
                  >
                    Ver detalle
                  </button>
                  <ButtonActionDataTable onClick={() => handleEdit(plan)} color="indigo">
                    <Edit size={14} />
                  </ButtonActionDataTable>
                  <ButtonActionDataTable onClick={() => handleDelete(plan)} color="red">
                    <Trash2 size={14} />
                  </ButtonActionDataTable>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}