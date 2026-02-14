/**
 * Photo record from the database
 */
export interface Photo {
  id: string;
  url: string;
  storage_path: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
}
