import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export type Avatar = {
  id: string;
  name: string;
  gender: string;
  ethnicity: string;
  role: string;
  imageUrl: string;
};

type AvatarFilters = {
  gender?: string;
  role?: string;
  [key: string]: string | undefined; // support future filters
};

type UseAvatarsOptions = {
  initialPage?: number;
  initialLimit?: number;
  initialFilters?: AvatarFilters;
};

export const useAvatars = ({
  initialPage = 1,
  initialLimit = 30,
  initialFilters = {},
}: UseAvatarsOptions = {}) => {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [filters, setFilters] = useState<AvatarFilters>(initialFilters);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["/api/avatar", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (value) {
          params.append(key, value);
        }
      });

      const res = await fetch(`/api/avatar/list?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch avatars");
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const avatarData: Avatar[] = data?.data || [];
  const totalPages: number = data?.totalPages || 1;
  const totalCount: number = data?.total || 0;

  return {
    avatarData,
    isLoading,
    isError,
    error,
    page,
    totalPages,
    totalCount,
    setPage,
    filters,
    setFilters,
    refetch,
  };
};
export const useAvatarById = (id?: string) => {
  return useQuery({
    queryKey: ["avatar", id],
    queryFn: async () => {
      if (!id) throw new Error("Avatar ID is required");

      const res = await fetch(`/api/avatar/get-avatar/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch avatar: ${res.statusText}`);

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error");

      return data.data?.[0]; // the avatar object
    },
    enabled: !!id, 
    });
};