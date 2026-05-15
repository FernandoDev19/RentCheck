import { useState } from "react";
import { useParams } from "react-router";
import Swal from "sweetalert2";
import { biometryRequestService } from "../../services/biometry-request.service";
import { catchError } from "../../shared/errors/catch-error";

export default function VerifyBiometry() {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSimulate = async (result: "approved" | "rejected") => {
    setIsLoading(true);
    try {
      await biometryRequestService.simulate(token!, result);
      setDone(true);
      Swal.fire({
        title:
          result === "approved"
            ? "✅ Identidad verificada"
            : "❌ Verificación rechazada",
        text:
          result === "approved"
            ? "Tu identidad ha sido verificada exitosamente."
            : "Tu verificación fue rechazada. Contacta a la rentadora.",
        icon: result === "approved" ? "success" : "error",
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (error) {
      await catchError(error, Swal, "Error al verificar la biometría");
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-2xl font-bold text-gray-700">
            ✅ Proceso completado
          </p>
          <p className="text-gray-500 mt-2">Puedes cerrar esta ventana.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
        <div>
          <p className="text-3xl mb-2">🪪</p>
          <h1 className="text-xl font-bold text-gray-800">
            Verificación de identidad
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Simulación — En producción aquí iría el proveedor biométrico.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSimulate("approved")}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white 
              font-semibold transition disabled:opacity-50"
          >
            ✅ Aprobar identidad
          </button>
          <button
            onClick={() => handleSimulate("rejected")}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white 
              font-semibold transition disabled:opacity-50"
          >
            ❌ Rechazar identidad
          </button>
        </div>

        <p className="text-xs text-gray-400">Token: {token}</p>
      </div>
    </div>
  );
}
