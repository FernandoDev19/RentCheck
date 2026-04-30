import { useContext } from "react";
import { LoadingContext } from "../constants/loading-context";

export const useLoading = () => useContext(LoadingContext);