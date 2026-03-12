import Label from "../../common/components/ui/Label";
import Input from "../../common/components/ui/Input";
import ButtonCallUp from "../../common/components/ui/ButtonCallUp";
import { useLogin } from "./hooks/useLogin";

export default function Login() {
  const {
    isLoading,
    errors,
    email,
    password,
    handleSubmit,
    setEmail,
    setPassword,
  } = useLogin();

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
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors?.email ? "bg-red-400/20 border border-red-600" : ""}
                placeholder="correo@ejemplo.com"
              />
              {errors?.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors?.password ? "bg-red-400/20 border border-red-600" : ""}
                placeholder="•••••••••"
              />
              {errors?.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <ButtonCallUp
              isLoading={isLoading}
              children="Iniciar Sesión"
              type="submit"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
