/**
 * PERSONAL DRIVER MARKETPLACE - FILE-BACKED PERSISTENT STORAGE
 * Saves database state across server restarts and test runs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  USERS,
  DRIVERS,
  DRIVER_DOCUMENTS,
  INITIAL_BOOKINGS,
  REVIEWS,
  SUPPORT_TICKETS,
  OPERATIONAL_CITIES,
  PLATFORM_PRICING_CONFIG,
  PROMO_COUPONS,
  FINANCIAL_TRANSACTIONS,
  ADMIN_AUDIT_LOGS,
  DRIVER_PASSPORTS,
  VEHICLE_HANDOVERS,
  FAMILY_CIRCLES,
  PREFERRED_CHAUFFEURS
} from '../mockDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.join(__dirname, 'persistentData.json');

/**
 * Initializes or loads persisted database store
 */
export class PersistentDataStore {
  constructor() {
    this.state = this.loadOrSeed();
  }

  loadOrSeed() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const loaded = JSON.parse(raw);
        let changed = false;
        if (!loaded.driver_passports) { loaded.driver_passports = [...DRIVER_PASSPORTS]; changed = true; }
        if (!loaded.vehicle_handovers) { loaded.vehicle_handovers = [...VEHICLE_HANDOVERS]; changed = true; }
        if (!loaded.family_circles) { loaded.family_circles = [...FAMILY_CIRCLES]; changed = true; }
        if (!loaded.preferred_chauffeurs) { loaded.preferred_chauffeurs = [...PREFERRED_CHAUFFEURS]; changed = true; }
        if (changed) this.persist(loaded);
        return loaded;
      }
    } catch (err) {
      console.warn('Could not read persistentData.json, seeding baseline store:', err.message);
    }

    const baseline = {
      users: [...USERS],
      drivers: [...DRIVERS],
      driver_documents: [...DRIVER_DOCUMENTS],
      bookings: [...INITIAL_BOOKINGS],
      reviews: [...REVIEWS],
      support_tickets: [...SUPPORT_TICKETS],
      service_areas: [...OPERATIONAL_CITIES],
      pricing_rules: { ...PLATFORM_PRICING_CONFIG },
      promo_coupons: [...PROMO_COUPONS],
      financial_transactions: [...FINANCIAL_TRANSACTIONS],
      admin_audit_logs: [...ADMIN_AUDIT_LOGS],
      driver_passports: [...DRIVER_PASSPORTS],
      vehicle_handovers: [...VEHICLE_HANDOVERS],
      family_circles: [...FAMILY_CIRCLES],
      preferred_chauffeurs: [...PREFERRED_CHAUFFEURS]
    };

    this.persist(baseline);
    return baseline;
  }

  persist(dataToSave = this.state) {
    try {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write persistentData.json:', err.message);
    }
  }

  getTable(tableName) {
    if (!this.state[tableName]) {
      this.state[tableName] = [];
    }
    return this.state[tableName];
  }

  find(tableName, predicate) {
    const table = this.getTable(tableName);
    return table.filter(predicate);
  }

  findOne(tableName, predicate) {
    const table = this.getTable(tableName);
    return table.find(predicate) || null;
  }

  insert(tableName, record) {
    const table = this.getTable(tableName);
    const newRecord = {
      id: record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...record,
      createdAt: record.createdAt || new Date().toISOString()
    };
    table.unshift(newRecord);
    this.persist();
    return newRecord;
  }

  update(tableName, predicate, updates) {
    const table = this.getTable(tableName);
    const index = table.findIndex(predicate);
    if (index === -1) return null;

    table[index] = {
      ...table[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return table[index];
  }

  delete(tableName, predicate) {
    const table = this.getTable(tableName);
    const index = table.findIndex(predicate);
    if (index === -1) return false;

    table.splice(index, 1);
    this.persist();
    return true;
  }
}

export const persistentStorage = new PersistentDataStore();
