import { useNavigate } from "react-router";
import ButtonActionDataTable from "../../shared/components/ui/ButtonActionDataTable";

export default function Unauthorized401() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-screen">
      <div>
        <ButtonActionDataTable
          onClick={() => navigate("/login", { replace: true })}
          color="indigo"
        >
          Ir a login
        </ButtonActionDataTable>
        <ButtonActionDataTable
          onClick={() => navigate("/", { replace: true })}
          color="yellow"
        >
          Ir a home
        </ButtonActionDataTable>
      </div>

      <h1 className="text-2xl font-bold text-red-500">401 Unauthorized</h1>
    </div>
  );
}
