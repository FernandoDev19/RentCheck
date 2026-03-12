import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Customer } from "../../../models/customer.model";
import { useCallback, useEffect, useState } from "react";
import type { ListResponse } from "../../../common/interfaces/list-response.interface";
import { customerService } from "../../../services/customer.service";
import { catchError } from "../../../common/errors/catch-error";
import RentalsByCustomerTable from "../components/RentalsByCustomerTable";
import ViewCustomer from "../components/ViewCustomer";
import { useCreateRental } from "../../rentals/hooks/useCreateRental";

const MySwal = withReactContent(Swal);

export const useCustomer = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "createdAt",
    direction: "desc",
  });
  const limit = 10;

  const loadCustomers = useCallback(async () => {
    const response: ListResponse<Customer> = await customerService.getAll({
      page,
      limit,
      orderBy: orderBy.key,
      orderDir: orderBy.direction,
      search: searchTerm,
    });
    setCustomers(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm]);

  const { handleCreateClick } = useCreateRental();

  useEffect(() => {
    const run = async () => {
      try {
        await loadCustomers();
      } catch (error) {
        await catchError(error, MySwal, "Error al cargar los clientes");
      }
    };
    run();
  }, [loadCustomers]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  const handleViewInfo = (row: Customer) => {
    MySwal.fire({
      title: "Detalle del cliente",
      html: <ViewCustomer row={row} />,
      showConfirmButton: true,
      confirmButtonText: "Crear Renta",
      showCloseButton: true,
      width: 580,
      didOpen: () => {
        document
          .getElementById("btn-ver-rentas")
          ?.addEventListener("click", () => {
            MySwal.close();
            MySwal.fire({
              title: `Historial — ${row.name} ${row.lastName}`,
              html: <RentalsByCustomerTable customerId={row.id} />,
              showConfirmButton: false,
              showCloseButton: true,
              width: 780,
            });
          });
      },
      preConfirm: async () => {
        await handleCreateClick(() => {}, row.identityNumber);
        return true;
      },
    });
  };

  return {
    customers,
    totalItems,
    totalPages,
    handleViewInfo,
    handleSortChange,
    handleSearchChange,
    loadCustomers,
    limit,
    page,
    setPage,
  };
};
