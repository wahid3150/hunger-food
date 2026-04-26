import axios from "axios";
import { serverUrl } from "../App";

const PAGE_LIMIT = 50;

export const fetchOwnerItems = async (params = {}) => {
  const firstResponse = await axios.get(`${serverUrl}/api/item/my-items`, {
    params: { ...params, page: 1, limit: PAGE_LIMIT },
    withCredentials: true,
  });

  const firstPageItems = firstResponse.data?.items || [];
  const totalPages = Number(firstResponse.data?.totalPages || 1);

  if (totalPages <= 1) {
    return {
      items: firstPageItems,
      totalItems: Number(firstResponse.data?.totalItems || firstPageItems.length),
    };
  }

  const remainingResponses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      axios.get(`${serverUrl}/api/item/my-items`, {
        params: { ...params, page: index + 2, limit: PAGE_LIMIT },
        withCredentials: true,
      }),
    ),
  );

  const remainingItems = remainingResponses.flatMap((res) => res.data?.items || []);

  return {
    items: [...firstPageItems, ...remainingItems],
    totalItems: Number(firstResponse.data?.totalItems || firstPageItems.length + remainingItems.length),
  };
};
