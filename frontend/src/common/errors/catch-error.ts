import axios from "axios";
import type Swal from "sweetalert2";

export async function catchError(error: any, swal: typeof Swal, message: string = "Error") {
  console.error("Error capturado:", error);

  // 2. Errores de Axios (Respuesta del Back)
  if (axios.isAxiosError(error)) {
    const backendMessage = error.response?.data?.message || "Error de conexión";
    const finalMessage = Array.isArray(backendMessage)
      ? backendMessage[0]
      : backendMessage;

    await swal.fire({
      title: message,
      text: finalMessage, // Aquí saldrá tu "Password is wrong"
      icon: "error",
      showConfirmButton: true,
    });
    return;
  } else {
    // 3. Cualquier otra vaina rara
    await swal.fire({
      title: message,
      text: error.message || "Ocurrió un error inesperado",
      icon: "error",
      showConfirmButton: true,
    });
  }
}
