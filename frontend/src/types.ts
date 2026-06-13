export type UserRole = 'EDITOR' | 'VIEWER';

export interface Unit {
  id: string;
  key: string;
  name: string;
  translations?: Record<string, string> | null;
}

export interface Tag {
  id: string;
  key: string;
  name: string;
  translations?: Record<string, string> | null;
  _count?: { items: number };
  createdAt?: string;
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
  key?: string | null;
  name: string;
  translations?: Record<string, string> | null;
  icon?: string | null;
  color?: string | null;
  _count?: { locations: number };
}

export interface Room {
  id: string;
  key?: string | null;
  name: string;
  translations?: Record<string, string> | null;
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
  room?: Pick<Room, 'id' | 'key' | 'name'>;
  parentId?: string | null;
  parent?: Pick<Location, 'id' | 'name'> | null;
  children?: Location[];
  instances?: Instance[];
  _count?: { items?: number; instances?: number };
}

export interface ProductTag {
  tag: Pick<Tag, 'id' | 'key' | 'name'>;
}

export interface ProductDocument {
  id: string;
  productId: string;
  originalName: string;
  url: string;
  mimeType?: string | null;
  size?: number | null;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  barcode?: string | null;
  purchaseUrl?: string | null;
  minQuantity?: number | null;
  tags?: ProductTag[];
  documents?: ProductDocument[];
  instances?: Instance[];
  _count?: { instances: number };
}

export interface InstanceDocument {
  id: string;
  instanceId: string;
  originalName: string;
  url: string;
  mimeType?: string | null;
  size?: number | null;
  createdAt: string;
}

export interface Instance {
  id: string;
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'imageUrl' | 'description' | 'barcode' | 'minQuantity' | 'tags'>;
  quantity: number;
  unit?: string | null;
  condition?: ItemCondition | null;
  serialNumber?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  warrantyUntil?: string | null;
  expiryDate?: string | null;
  expiryWarningDays?: number | null;
  locationId?: string | null;
  location?: (Location & { room: Pick<Room, 'id' | 'key' | 'name'> }) | null;
  assignedUserId?: string | null;
  assignedUser?: Pick<User, 'id' | 'name' | 'email'> | null;
  documents?: InstanceDocument[];
  lendings?: Lending[];
  _count?: { lendings: number };
}

export interface Lending {
  id: string;
  instanceId: string;
  instance?: {
    id: string;
    product: Pick<Product, 'id' | 'name' | 'imageUrl'>;
    location: { room: Pick<Room, 'id' | 'key' | 'name'> } | null;
  };
  lentTo: string;
  lentAt: string;
  returnedAt?: string | null;
  note?: string | null;
}

export interface InstanceOverview {
  id: string;
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'imageUrl' | 'description' | 'barcode' | 'minQuantity' | 'tags'>;
  quantity: number;
  unit?: string | null;
  condition?: ItemCondition | null;
  locationId?: string | null;
  location: {
    id: string;
    name: string;
    room: Pick<Room, 'id' | 'key' | 'name'>;
    parent: Pick<Location, 'id' | 'name'> | null;
  } | null;
  _count: { lendings: number };
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
