import type { ClientEntity } from '../types';

const CLIENTS_STORAGE_KEY = 'marketing-insights-clients-list';
const ACTIVE_CLIENT_KEY = 'marketing-insights-active-client-id';

export const initialClients: ClientEntity[] = [
  {
    id: 'client-1',
    name: 'Acme Commerce',
    website: 'https://acmecommerce.io',
    propertyId: '384920184',
    status: 'healthy',
    role: 'admin',
    lastSynced: '12m ago',
    monthlySessions: '142,500',
    monthlyConversions: '4,890',
  },
  {
    id: 'client-2',
    name: 'Northwind Health',
    website: 'https://northwindhealth.com',
    propertyId: '293847102',
    status: 'healthy',
    role: 'editor',
    lastSynced: '1h ago',
    monthlySessions: '68,200',
    monthlyConversions: '1,940',
  },
  {
    id: 'client-3',
    name: 'Beacon Financial',
    website: 'https://beaconfin.org',
    propertyId: '495820391',
    status: 'review',
    role: 'viewer',
    lastSynced: '3h ago',
    monthlySessions: '24,100',
    monthlyConversions: '580',
  },
  {
    id: 'client-4',
    name: 'Orbit Learning',
    website: 'https://orbitlearning.edu',
    propertyId: '582019482',
    status: 'attention',
    role: 'viewer',
    lastSynced: '1d ago',
    monthlySessions: '89,400',
    monthlyConversions: '2,150',
  },
];

export function getStoredClients(): ClientEntity[] {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(initialClients));
      return initialClients;
    }
    return JSON.parse(raw) as ClientEntity[];
  } catch {
    return initialClients;
  }
}

export function saveStoredClients(clients: ClientEntity[]): void {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (err) {
    console.error('Failed to save clients:', err);
  }
}

export function getActiveClientId(): string {
  return localStorage.getItem(ACTIVE_CLIENT_KEY) || initialClients[0].id;
}

export function setActiveClientId(id: string): void {
  localStorage.setItem(ACTIVE_CLIENT_KEY, id);
}

export function getActiveClient(): ClientEntity {
  const clients = getStoredClients();
  const activeId = getActiveClientId();
  return clients.find((c) => c.id === activeId) || clients[0] || initialClients[0];
}

