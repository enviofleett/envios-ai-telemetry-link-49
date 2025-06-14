
// Mock hook to simulate fetching merchants
import { useQuery } from "@tanstack/react-query";
import { Merchant } from "@/types/merchant";

const mockMerchants: Merchant[] = [
  { id: "merch_1", name: "Super Electronics" },
  { id: "merch_2", name: "Global Books" },
  { id: "merch_3", name: "Fashion Forward" },
];

const fetchMerchants = async (): Promise<Merchant[]> => {
  // In a real app, this would be an API call to the merchants table
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockMerchants;
};

export function useMerchants() {
  return useQuery<Merchant[], Error>({
    queryKey: ["merchants"],
    queryFn: fetchMerchants,
  });
}
