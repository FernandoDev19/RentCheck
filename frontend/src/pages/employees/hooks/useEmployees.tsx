import { useCallback, useEffect, useState } from "react";
import type { Employee } from "../../../shared/types/employee.type";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import type { ListResponse } from "../../../shared/types/list-response.type";
import { employeeService } from "../../../services/employee.service";
import { catchError } from "../../../shared/errors/catch-error";
import { createEmployeeSchema } from "../schemas/create-employee.schema";

const MySwal = withReactContent(Swal);

export const useEmployees = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "createdAt",
    direction: "desc",
  });
  const limit = 10;

  const loadEmployees = useCallback(async () => {
    const response: ListResponse<Employee> = await employeeService.getAll({
      page,
      limit,
      orderBy: orderBy.key,
      orderDir: orderBy.direction,
      search: searchTerm,
    });
    setEmployees(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm]);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await loadEmployees();
      } catch (error) {
        await catchError(error, MySwal, "Error al cargar los empleados");
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [loadEmployees]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  const handleDelete = async (employeeId: string) => {
      try {
        const result = await Swal.fire({
          title: "¿Eliminar Empleado?",
          text: "¿Estás seguro de que quieres eliminar a este Empleado?",
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Sí, Eliminar",
          cancelButtonText: "Cancelar",
        });
  
        if (result.isConfirmed) {
          await employeeService.delete(employeeId);
          MySwal.fire({
            title: "Eliminado",
            icon: "success",
            text: "Empleado eliminado correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
          loadEmployees();
        }
      } catch (error) {
        await catchError(error, MySwal, "Error al eliminar la rentadora");
      }
    };

  return {
    isLoading,
    employees,
    totalItems,
    totalPages,
    page,
    limit,
    createEmployeeSchema,
    setPage,
    handleSearchChange,
    handleSortChange,
    loadEmployees,
    handleDelete
  };
};
