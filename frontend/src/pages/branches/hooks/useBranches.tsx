import { useCallback, useEffect, useState } from "react";
import type { Branch } from "../../../models/branch.model";
import type { ListResponse } from "../../../common/interfaces/list-response.interface";
import { branchService } from "../../../services/branch.service";
import { catchError } from "../../../common/errors/catch-error";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import ViewBranch from "../components/ViewBranch";

const MySwal = withReactContent(Swal);

export const useBranches = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);
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

  const loadBranches = useCallback(async () => {
    try {
      setIsLoading(true);
      const response: ListResponse<Branch> = await branchService.getAll({
        page,
        limit,
        orderBy: orderBy.key,
        orderDir: orderBy.direction,
        search: searchTerm,
      });
      setBranches(response.data);
      setTotalItems(response.total);
      setTotalPages(response.lastPage);
    } catch (error) {
      await catchError(error, MySwal, "Error al cargar las sucursales");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm]);

  useEffect(() => {
    loadBranches();
  }, [page, searchTerm, orderBy, loadBranches]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleView = async (row: Branch) => {
    MySwal.fire({
      title: "Ver rentadora",
      html: <ViewBranch row={row} />,
      icon: "info",
      showConfirmButton: false,
      showCloseButton: true,
      width: 560,
    });
  };

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  return {
    branches,
    isLoading,
    totalItems,
    setPage,
    page,
    limit,
    totalPages,
    searchTerm,
    orderBy,
    handleView,
    handleSearchChange,
    handleSortChange,
    loadBranches
  };
};
