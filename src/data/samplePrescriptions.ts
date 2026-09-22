/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SamplePrescription {
  id: string;
  doctor: string;
  specialty: string;
  clinic: string;
  patient: string;
  ageGender: string;
  date: string;
  notes: string;
  handwrittenLines: string[];
  rawTextPrompt: string;
}

export const SAMPLE_PRESCRIPTIONS: SamplePrescription[] = [
  {
    id: 'sample-fever-cold',
    doctor: 'Dr. Ramesh K. Verma, MBBS, MD (Gen Med)',
    specialty: 'Senior Consultant Physician',
    clinic: 'Aarogya Clinic, Civil Lines, Bhopal',
    patient: 'Shri Ramswaroop Patel',
    ageGender: '58 Yrs / Male',
    date: '22/09/2026',
    notes: 'Viral URTI with high fever & dry cough',
    handwrittenLines: [
      '1. Tab. Azithro 500 mg — 1 OD (1 hr BBF) x 3 days',
      '2. Tab. Calpol 650 mg — 1 TDS / SOS x 5 days (PC)',
      '3. Tab. Pan-D 40 — 1 OD (Empty stomach BBF) x 7 days',
      '4. Tab. Montair-LC — 1 tab HS x 5 days',
      '5. Syp. Ascoril-D — 10 ml TDS x 5 days'
    ],
    rawTextPrompt: 'Dr. R. K. Verma, Civil Lines Bhopal. Patient Ramswaroop Patel 58/M. Date: 22/09/2026. Rx: 1. Tab. Azithro 500 OD x 3d (BBF), 2. Tab. Calpol 650 TDS PC SOS x 5d, 3. Tab. Pan-D 40 1 tab OD BBF x 7d, 4. Tab. Montair-LC 1 HS x 5d, 5. Syp. Ascoril-D 10ml TDS x 5d.'
  },
  {
    id: 'sample-acidity-gas',
    doctor: 'Dr. Sunita Deshmukh, MBBS, DNB (Fam Med)',
    specialty: 'Family Medicine & Gastroenterology',
    clinic: 'Shree Sanjeevani Polyclinic, Nagpur',
    patient: 'Smt. Kamla Devi',
    ageGender: '62 Yrs / Female',
    date: '21/09/2026',
    notes: 'Epigastric burning, GERD & stomach cramps',
    handwrittenLines: [
      '1. Tab. Pan-D 40 mg — 1 tab OD BBF x 14 days',
      '2. Tab. Omez 20 mg — 1 tab OD x 7 days',
      '3. Tab. Drotin-M — 1 tab BD (After food) x 3 days',
      '4. Syp. Mucaine Gel — 2 tsp TDS (15 mins before meals)'
    ],
    rawTextPrompt: 'Dr Sunita Deshmukh, Nagpur. Pt Kamla Devi 62/F. Rx: 1. Tab Pan-D 40 1 OD BBF x 14d, 2. Tab Omez 20 1 OD x 7d, 3. Tab Drotin-M 1 BD PC x 3d, 4. Syp Mucaine Gel 2 tsp TDS AC.'
  },
  {
    id: 'sample-hypertension-jointpain',
    doctor: 'Dr. Anand Iyer, MBBS, MS (Ortho)',
    specialty: 'Orthopedic & Joint Care Clinic',
    clinic: 'Sai Seva Hospital, Indore',
    patient: 'Shri Jagdish Prasad',
    ageGender: '67 Yrs / Male',
    date: '20/09/2026',
    notes: 'Knee Osteoarthritis + HTN follow-up',
    handwrittenLines: [
      '1. Tab. Telma 40 mg — 1 OD (Morning after b/fast)',
      '2. Tab. Ecosprin 75 mg — 1 OD (Night after dinner)',
      '3. Tab. Voveran-SR 75 mg — 1 BD (PC) x 5 days',
      '4. Tab. Shelcal 500 mg — 1 OD (Afternoon lunch)'
    ],
    rawTextPrompt: 'Dr Anand Iyer, Indore. Pt Jagdish Prasad 67/M. Rx: 1. Tab Telma 40 1 OD (Morn PC), 2. Tab Ecosprin 75 1 OD (Night PC), 3. Tab Voveran-SR 75 1 BD PC x 5d, 4. Tab Shelcal 500 1 OD (Noon PC).'
  }
];
