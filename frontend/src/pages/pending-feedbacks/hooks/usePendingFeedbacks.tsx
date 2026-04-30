import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Rental } from "../../../shared/types/rental.type";
import type { ListResponse } from "../../../shared/types/list-response.type";
import { rentalService } from "../../../services/rental.service";
import { catchError } from "../../../shared/errors/catch-error";
const MySwal = withReactContent(Swal);

export const usePendingFeedbacks = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "expectedReturnDate",
    direction: "asc",
  });
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  const loadRentals = useCallback(async () => {
    const response: ListResponse<Rental> =
      await rentalService.getPendingFeedbacks({
        page,
        limit,
        orderBy: orderBy.key,
        orderDir: orderBy.direction,
        search: searchTerm,
      });
    setRentals(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm]);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await loadRentals();
      } catch (error) {
        await catchError(error, MySwal, "Error al cargar Rentas pendientes por feedback");
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [loadRentals]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  return {
    rentals,
    totalItems,
    totalPages,
    page,
    limit,
    setPage,
    handleSearchChange,
    handleSortChange,
    isLoading,
    loadRentals
  };
}
