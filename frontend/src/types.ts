export type UserRole = 'EDITOR' | 'VIEWER';

export interface Unit {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}

export interface UserListEntry {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  createdAt: string;
}

export interface ContainerType {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  _count?: { locations: number };
}

export interface Room {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  _count?: { locations: number };
}

export type ItemCondition = 'NEW' | 'GOOD' | 'WORN' | 'BROKEN';

export interface Location {
  id: string;
  name: string;
  description?: string | null;
  containerTypeId?: string | null;
  containerType?: ContainerType | null;
  roomId: string;
  room?: Pick<Room, 'id' | 'name'>;
  parentId?: string | null;
  parent?: Pick<Location, 'id' | 'name'> | null;
  children?: Location[];
  items?: Item[];
  _count?: { items: number };
}

export interface ItemTag {
  tag: { id: string; name: string };
}

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  minQuantity?: number | null;
  condition?: ItemCondition | null;
  imageUrl?: string | null;
  purchaseUrl?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  warrantyUntil?: string | null;
  serialNumber?: string | null;
  barcode?: string | null;
  locationId: string;
  location?: Location & { room: Pick<Room, 'id' | 'name'> };
  tags?: ItemTag[];
  lendings?: Lending[];
}

export interface Lending {
  id: string;
  itemId: string;
  item?: Pick<Item, 'id' | 'name' | 'imageUrl'> & {
    location: { room: Pick<Room, 'id' | 'name'> };
  };
  lentTo: string;
  lentAt: string;
  returnedAt?: string | null;
  note?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  NEW: 'Neu',
  GOOD: 'Gut',
  WORN: 'Abgenutzt',
  BROKEN: 'Defekt',
};

export const CONDITION_COLORS: Record<ItemCondition, string> = {
  NEW: 'bg-green-100 text-green-800',
  GOOD: 'bg-blue-100 text-blue-800',
  WORN: 'bg-yellow-100 text-yellow-800',
  BROKEN: 'bg-red-100 text-red-800',
};
