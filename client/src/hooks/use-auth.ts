import { useContext } from "react";
import { useAuth as useAuthFromProvider } from "@/components/providers/AuthProvider";

export function useAuth() {
  return useAuthFromProvider();
}
