import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import { authService } from "../../../services/auth.service";

type props = {
  className?: string;
}

export default function LogoutButton({ className }: props) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que quieres cerrar sesión?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      await authService.logout();
      navigate("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`py-2 px-5 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-white border border-gray-200 text-neutral-600 text-sm font-medium shadow-sm cursor-pointer transition-all duration-150 ease-in-out ${className || ""}`}
    >
      Cerrar sesión
    </button>
  );
}
