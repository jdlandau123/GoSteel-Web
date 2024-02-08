import { Timestamp } from "firebase/firestore";

export interface IShow {
  id: string;
  name: string;
  startDate: Timestamp;
}

// unitCount should always be 144 per panel
// 24 hooks per stand
// 6 items per hook

export interface IItem {
  id: string;
  name: string;
  pricePerUnit: number;
}

export interface IItemTemplate {
  id: string;
  item: IItem;
  category: string;
  unitCount: 144 | 72; // 144 for full panel, 72 for half
  color: string;
  description: string;
}

export interface IOrder {
  id: string;
  customerId: string;
  showId: string;
  dateCreated: Timestamp;
  datePaid: Timestamp;
  dateShipped: Timestamp;
  totalPrice: number;
  notes: string;
  standColor: string;
  hasInvoice: boolean;
}

export interface IOrderPanel {
  id: string;
  orderId: string;
  packages: IItemTemplate[];
}

export interface ICustomer {
  id: string;
  firstName: string;
  lastName:string;
  email: string;
  phone: string;
  workPhone: string;
  companyName: string;
  businessType: string;
}

export interface IAddress {
  id: string;
  customerId: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: number;
  type: 'shipping' | 'billing';
}

