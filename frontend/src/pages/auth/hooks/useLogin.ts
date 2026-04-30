import { useState } from "react";
import { loginSchema } from "../schemas/login.schema";
import { authService } from "../../../services/auth.service";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate } from "react-router";
import { catchError } from "../../../shared/errors/catch-error";

const MySwal = withReactContent(Swal);

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email: string; password: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrors({ email: "", password: "" });
    setIsLoading(true);

    try {
      // Validar con Zod
      const result = await loginSchema.safeParseAsync({ email, password });

      if (!result.success) {
        const errorsObj: { email: string, password: string } = { email: "", password: "" };
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof typeof errorsObj;
          errorsObj[field] = issue.message;
        });
        setErrors(errorsObj);
        return;
      }

      await authService.login({ email, password });

      await MySwal.fire({
        title: "¡Bienvenido!",
        text: "Inicio de sesión exitoso",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/");
    } catch (error) {
      await catchError(error, MySwal, "Error de inicio de sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    errors,
    email,
    password,
    handleSubmit,
    setIsLoading,
    setErrors,
    setEmail,
    setPassword,
  };
};
