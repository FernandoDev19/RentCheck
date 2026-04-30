import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Renter } from "../../../shared/types/renter.type";
import type { Plan } from "../../../shared/types/plan.type";
import { planService } from "../../../services/plan.service";
import type { ListResponse } from "../../../shared/types/list-response.type";
import { renterService } from "../../../services/renter.service";
import { catchError } from "../../../shared/errors/catch-error";
import ViewRenter from "../components/ViewRenter";
import { useNavigate } from "react-router";

const MySwal = withReactContent(Swal);

export const useRenters = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [renters, setRenters] = useState<Renter[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const navigate = useNavigate();
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "createdAt",
    direction: "desc",
  });
  const limit = 10;

  useEffect(() => {
    const fetchPlans = async () => {
      const response = await planService.getPlans();
      setPlans(response);
    };
    fetchPlans();
  }, []);

  const loadRenters = useCallback(async () => {
    try {
      setIsLoading(true);
      const response: ListResponse<Renter> = await renterService.getAll({
        page,
        limit,
        orderBy: orderBy.key,
        orderDir: orderBy.direction,
        search: searchTerm,
      });
      setRenters(response.data);
      setTotalItems(response.total);
      setTotalPages(response.lastPage);
    } catch (error: unknown) {
      await catchError(error, MySwal, "Error al obtener las rentadoras");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, orderBy, searchTerm]);

  useEffect(() => {
    loadRenters();
  }, [loadRenters]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleSortChange = (key: string, direction: string = "desc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  const handleView = async (row: Renter) => {
    MySwal.fire({
      title: "Ver rentadora",
      html: <ViewRenter renterId={row.id} />,
      icon: "info",
      showConfirmButton: false,
      showCloseButton: true,
      width: 560,
      didOpen: () => {
        document
          .getElementById("view-branches")
          ?.addEventListener("click", () => {
            MySwal.close();
            navigate(`/adm/branches/${row.id}`);
          });
      },
    });
  };

  const handleDelete = async (renterId: string) => {
    try {
      const result = await Swal.fire({
        title: "¿Eliminar Rentadora?",
        text: "¿Estás seguro de que quieres eliminar a esta rentadora?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, Eliminar",
        cancelButtonText: "Cancelar",
      });

      if(result.isConfirmed) {
        await renterService.delete(renterId);
        MySwal.fire({
          title: "Eliminado",
          icon: "success",
          text: "Rentadora eliminada correctamente",
          timer: 2000,
          showConfirmButton: false,
        });
        loadRenters();
      };

    } catch (error) {
      await catchError(error, MySwal, "Error al eliminar la rentadora");
    }
  };

  return {
    plans,
    renters,
    isLoading,
    totalItems,
    totalPages,
    page,
    limit,
    setPage,
    handleSortChange,
    handleSearchChange,
    handleView,
    handleDelete,
    loadRenters,
  };
};
