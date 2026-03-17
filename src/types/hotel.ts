export type Hotel = {
  id?: number;
  region: string;
  branch_name: string;
  address: string;
  rooms: number;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
  memo?: string | null;
};
