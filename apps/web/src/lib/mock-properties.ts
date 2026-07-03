export type MockUnit = {
  id: string;
  unitNumber: string;
  floor: string;
  baseRent: number;
  electricityRate: number;
  status: "VACANT" | "OCCUPIED" | "INACTIVE";
  tenant?: string;
};

export type MockProperty = {
  id: string;
  name: string;
  type: "Apartment" | "House" | "Building" | "PG";
  address: string;
  city: string;
  state: string;
  postalCode: string;
  description: string;
  units: MockUnit[];
};

export const mockProperties: MockProperty[] = [
  {
    id: "lakeview-residency",
    name: "Lakeview Residency",
    type: "Apartment",
    address: "12 Baner Road",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411045",
    description:
      "A quiet apartment property close to offices, schools, and daily conveniences.",
    units: [
      {
        id: "unit-a-101",
        unitNumber: "A-101",
        floor: "1st floor",
        baseRent: 18500,
        electricityRate: 9,
        status: "OCCUPIED",
        tenant: "Neha Shah",
      },
      {
        id: "unit-a-102",
        unitNumber: "A-102",
        floor: "1st floor",
        baseRent: 17500,
        electricityRate: 9,
        status: "VACANT",
      },
      {
        id: "unit-a-201",
        unitNumber: "A-201",
        floor: "2nd floor",
        baseRent: 19000,
        electricityRate: 9,
        status: "OCCUPIED",
        tenant: "Aarav Mehta",
      },
      {
        id: "unit-a-202",
        unitNumber: "A-202",
        floor: "2nd floor",
        baseRent: 19000,
        electricityRate: 9,
        status: "VACANT",
      },
    ],
  },
  {
    id: "green-court",
    name: "Green Court",
    type: "Building",
    address: "48 Wakad High Street",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411057",
    description: "Compact residential units with reliable public transport access.",
    units: [
      {
        id: "unit-b-101",
        unitNumber: "B-101",
        floor: "Ground floor",
        baseRent: 12500,
        electricityRate: 8.5,
        status: "OCCUPIED",
        tenant: "Riya Kapoor",
      },
      {
        id: "unit-b-102",
        unitNumber: "B-102",
        floor: "Ground floor",
        baseRent: 12500,
        electricityRate: 8.5,
        status: "VACANT",
      },
      {
        id: "unit-b-201",
        unitNumber: "B-201",
        floor: "1st floor",
        baseRent: 14000,
        electricityRate: 8.5,
        status: "OCCUPIED",
        tenant: "Kabir Joshi",
      },
    ],
  },
  {
    id: "maple-house",
    name: "Maple House",
    type: "House",
    address: "7 Aundh Annexe",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411007",
    description: "Independent house prepared for a single-family rental.",
    units: [
      {
        id: "unit-house",
        unitNumber: "House",
        floor: "Ground + 1",
        baseRent: 32000,
        electricityRate: 10,
        status: "VACANT",
      },
    ],
  },
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
