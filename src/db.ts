import Dexie, { type EntityTable } from 'dexie';

export interface Store {
  id?: number;
  name: string;
  lat: number;
  lng: number;
  whatsapp?: string;
  region?: string;
  visit_count: number;
  created_at: string;
}

export interface Visit {
  id?: number;
  store_id: number;
  visited_at: string;
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  created_at: string;
}

const db = new Dexie('RouteMapDB') as Dexie & {
  stores: EntityTable<Store, 'id'>;
  visits: EntityTable<Visit, 'id'>;
  users: EntityTable<User, 'id'>;
};

// Version 4: added users table
db.version(4).stores({
  stores: '++id, name, lat, lng, region, visit_count, created_at',
  visits: '++id, store_id, visited_at',
  users: '++id, username, role'
});

// Version 3: added region field
db.version(3).stores({
  stores: '++id, name, lat, lng, region, visit_count, created_at',
  visits: '++id, store_id, visited_at'
});

db.version(2).stores({
  stores: '++id, name, lat, lng, visit_count, created_at',
  visits: '++id, store_id, visited_at'
});

db.version(1).stores({
  stores: '++id, name, lat, lng, visit_count, created_at',
  visits: '++id, store_id, visited_at'
});

export { db };
