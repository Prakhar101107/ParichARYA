/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MedicineForm = 
  | 'tablet' 
  | 'capsule' 
  | 'syrup' 
  | 'injection' 
  | 'drops' 
  | 'ointment' 
  | 'other';

export type FoodRelation = 
  | 'before_food' 
  | 'after_food' 
  | 'with_food' 
  | 'empty_stomach' 
  | 'bedtime' 
  | 'not_specified';

export interface MedicineConfidence {
  name: number;
  dose: number;
  frequency: number;
}

export interface Medicine {
  id: string;
  drug_name: string;
  form: MedicineForm;
  strength: string;
  frequency_raw: string;
  frequency_plain: string;
  food_relation: FoodRelation;
  duration_days: number | null;
  special_instructions: string | null;
  confidence: MedicineConfidence;
  verified: boolean;
  userEdited?: boolean;
}

export interface SafetyRule {
  id: string;
  trigger_keywords_a: string[];
  trigger_keywords_b: string[];
  type: 'duplicate_therapy' | 'drug_interaction' | 'advisory';
  title_en: string;
  title_hi: string;
  description_en: string;
  description_hi: string;
}

export interface SafetyAlert {
  id: string;
  type: 'duplicate_therapy' | 'drug_interaction' | 'advisory';
  medicines_involved: string[];
  title_en: string;
  title_hi: string;
  description_en: string;
  description_hi: string;
}

export interface MedicineScriptLine {
  drug_name: string;
  hindi_line: string;
  english_line: string;
  schedule_summary: string;
}

export interface CarePlan {
  id: string;
  createdAt: string;
  thumbnailUrl?: string;
  medicines: Medicine[];
  hindi_script: string;
  english_script: string;
  medicine_scripts: MedicineScriptLine[];
  safety_alerts: SafetyAlert[];
  language: 'hi' | 'en' | 'simple_hi';
}

export type AppLanguage = 'hi' | 'en';

export interface AppSettings {
  language: AppLanguage;
  textSize: 'normal' | 'large' | 'xlarge';
  speechRate: number;
  autoPlayAfterScan: boolean;
  preferredVoiceName: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

