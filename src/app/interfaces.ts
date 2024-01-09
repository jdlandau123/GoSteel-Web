import { Timestamp } from "firebase/firestore";

export interface IItemTemplate {
    id: string;
    category: string;
    pricePerUnit: number;
    unitCount: number;
    hooks: number;
    color: string;
    description: string;
}

export interface IOrder {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateCreated: Timestamp;
    datePaid: Timestamp;
    dateCompleted: Timestamp;
    totalPrice: number;
}

export interface IOrderPanel {
    id: string;
    orderId: string;
    packages: IItemTemplate[];
}
