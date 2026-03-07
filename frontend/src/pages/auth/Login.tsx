import { useState } from "react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import * as z from "zod";
import { authService } from "../../services/auth.service";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrors({ email: "", password: "" });
    setIsLoading(true);

    try {
      // Validar con Zod
      await loginSchema.parseAsync({ email, password });

      await authService.login({ email, password });

      await Swal.fire({
        title: "¡Bienvenido!",
        text: "Inicio de sesión exitoso",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error capturado:", error);

      // 1. Errores de Zod (Validación Front)
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        const field = firstError.path[0] as "email" | "password";
        setErrors((prev) => ({ ...prev, [field]: firstError.message }));
        return;
      }

      // 2. Errores de Axios (Respuesta del Back)
      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message || "Error de conexión";
        const finalMessage = Array.isArray(backendMessage)
          ? backendMessage[0]
          : backendMessage;

        await Swal.fire({
          title: "Credenciales incorrectas",
          text: finalMessage, // Aquí saldrá tu "Password is wrong"
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      } else {
        // 3. Cualquier otra vaina rara
        await Swal.fire({
          title: "Error",
          text: error.message || "Ocurrió un error inesperado",
          icon: "error",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">RentCheck</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="correo@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="•••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
