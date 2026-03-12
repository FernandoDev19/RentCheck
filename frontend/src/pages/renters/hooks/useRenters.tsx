import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Renter } from "../../../models/renter.model";
import type { Plan } from "../../../models/plan.model";
import { planService } from "../../../services/plan.service";
import type { ListResponse } from "../../../common/interfaces/list-response.interface";
import { renterService } from "../../../services/renter.service";
import { catchError } from "../../../common/errors/catch-error";
import ViewRenter from "../components/ViewRenter";

const MySwal = withReactContent(Swal);

export const useRenters = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [renters, setRenters] = useState<Renter[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "name",
    direction: "asc",
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

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  const handleView = async (row: Renter) => {
    MySwal.fire({
      title: "Ver rentadora",
      html: <ViewRenter renter={row} />,
      icon: "info",
      showConfirmButton: false,
      showCloseButton: true,
      width: 560,
    });
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
    loadRenters
  };
};
