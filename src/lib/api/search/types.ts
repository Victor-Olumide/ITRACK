export interface GlobalSearchTicket {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: string;
  category: { name: string };
}

export interface GlobalSearchDevice {
  id: string;
  assetTag: string;
  make: string;
  model: string;
  serialNumber: string;
  type: string;
}

export interface GlobalSearchPerson {
  id: string;
  fullName: string;
  email: string;
  staffId: string;
  role: string;
  department: { name: string };
}

export interface GlobalSearchResponse {
  query: string;
  tickets: GlobalSearchTicket[];
  devices: GlobalSearchDevice[];
  people: GlobalSearchPerson[];
}
