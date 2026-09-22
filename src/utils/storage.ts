/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSettings, CarePlan } from '../types';

const PLANS_KEY = 'paricharya_prescriptions';
const SETTINGS_KEY = 'paricharya_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'hi',
  textSize: 'normal',
  speechRate: 0.95,
  autoPlayAfterScan: false,
  preferredVoiceName: null,
};

export function loadSavedPlans(): CarePlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load saved plans from localStorage:', e);
    return [];
  }
}

export function savePlan(plan: CarePlan): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadSavedPlans();
    // Prepend or update existing
    const filtered = existing.filter((p) => p.id !== plan.id);
    const updated = [plan, ...filtered];
    // Keep max 20 recent prescriptions
    localStorage.setItem(PLANS_KEY, JSON.stringify(updated.slice(0, 20)));
  } catch (e) {
    console.error('Failed to save plan to localStorage:', e);
  }
}

export function deleteSavedPlan(id: string): CarePlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = loadSavedPlans();
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem(PLANS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete plan from localStorage:', e);
    return [];
  }
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}
