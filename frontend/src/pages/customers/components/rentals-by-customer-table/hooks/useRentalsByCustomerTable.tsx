import { useEffect, useState } from "react";
import type { Rental } from "../../../../../models/rental.model";
import { rentalService } from "../../../../../services/rental.service";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { catchError } from "../../../../../common/errors/catch-error";

const MySwal = withReactContent(Swal);

export const useRentalsByCustomerTable = (customerId: string) => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "createdAt",
    direction: "desc",
  });
  const limit = 5;

  useEffect(() => {
    rentalService
      .getAllByCustomer(customerId, {
        page,
        limit,
        orderBy: orderBy.key,
        orderDir: orderBy.direction,
        search: searchTerm,
      })
      .then((res) => {
        setRentals(res.data);
        setTotalPages(res.lastPage);
        setTotalItems(res.total);
      })
      .catch(async (error) => {
        await catchError(error, MySwal, "Error al obtener las rentas");
      });
  }, [customerId, orderBy.key, orderBy.direction, searchTerm, page, limit]);

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
    setPage,
    page,
    limit,
    totalPages,
    totalItems,
    handleSearchChange,
    handleSortChange,
  };
};
