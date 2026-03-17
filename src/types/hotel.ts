export interface Hotel {
  id?: string;
  region: string;
  branch_name: string;
  address: string;
  rooms: number;
  latitude: number | null;
  longitude: number | null;
}
