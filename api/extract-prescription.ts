import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' },
  },
});

const GEMINI_CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg', promptHint } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 data is required' });
    }

    // Strip base64 prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();

    const systemInstruction = `You are a specialized Clinical Document Transcriptionist and Latin Shorthand Normalizer.
Your sole function is administrative document transcription: converting handwritten physical doctor prescriptions into structured text records for human verification.

CRITICAL POLICY & OPERATIONAL RULES:
1. STRICT ADMINISTRATIVE SCOPE: You are an administrative OCR transcriber. You do NOT provide medical advice, diagnosis, or clinical evaluation. Do not judge or alter medications.
2. LATIN SHORTHAND EXPANSION: Transcribe handwritten abbreviations into standardized terminology:
   - OD: Once daily (सुबह या निश्चित समय 1-0-0)
   - BD / BID: Twice daily (सुबह और रात 1-0-1)
   - TDS / TID: Three times daily (सुबह, दोपहर, रात 1-1-1)
   - QID: Four times daily
   - BBF / AC: Before breakfast / Before food (खाली पेट)
   - PC / AF: After food / Post meal (खाने के बाद)
   - HS: At bedtime (रात को सोते समय)
   - SOS / PRN: As needed (जरूरत पड़ने पर, जैसे बुखार या तेज दर्द के लिए)
   - Tab / Cap / Syp / Inj / Oint / Drops: Tablet / Capsule / Syrup / Injection / Ointment / Drops
   - x 3d, x 5d, x 7d, x 1m: duration in days or months
3. HONEST CONFIDENCE SCORING:
   - Provide a calibrated confidence score between 0.00 and 1.00 for each field:
     * confidence_name: confidence in reading the brand or generic drug name accurately
     * confidence_dose: confidence in form and strength (e.g. 500mg, 40mg, 10ml)
     * confidence_frequency: confidence in timing, frequency, and before/after food instructions
   - If handwriting is smudged, hurried, or ambiguous, assign confidence < 0.70 so the human user will be prompted to verify it.
   - If a field is illegible or unwritten, set it to "Not specified" or null. NEVER invent or hallucinate drug names.
4. HINDI INSTRUCTIONS (Devanagari):
   - Provide a clear, respectful, 1-sentence patient direction in conversational Hindi Devanagari (e.g., "यह गोली दिन में दो बार खाने के बाद लें।").`;

    const contents = [
      {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      },
      {
        text: `Transcribe all prescribed medications from this medical document photograph into structured data. Grade visual confidence accurately.${
          promptHint ? ` Additional note from user: ${promptHint}` : ''
        }`,
      },
    ];

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    let lastError: any = null;
    let responseText: string | null = null;

    for (const model of GEMINI_CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            temperature: 0.1,
            systemInstruction,
            responseMimeType: 'application/json',
            safetySettings,
            responseSchema: {
              type: Type.OBJECT,
              description: 'Prescription document extraction result',
              properties: {
                medications: {
                  type: Type.ARRAY,
                  description: 'List of all medications transcribed from the doctor prescription',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      drug_name: {
                        type: Type.STRING,
                        description: 'Brand or generic medicine name (e.g., Azithro, Pan-D, Calpol, Telma)',
                      },
                      strength: {
                        type: Type.STRING,
                        description: 'Strength with units (e.g., 500mg, 40mg, 10ml) or standard',
                      },
                      frequency: {
                        type: Type.STRING,
                        description: 'Frequency instruction (e.g., Once daily, Twice daily, TDS, SOS)',
                      },
                      food_timing: {
                        type: Type.STRING,
                        description: 'One of: before_food, after_food, empty_stomach, with_food, bedtime',
                      },
                      duration: {
                        type: Type.STRING,
                        description: 'Duration (e.g., 3 days, 5 days, 1 month) or Not specified',
                      },
                      instructions_hindi: {
                        type: Type.STRING,
                        description: 'Plain Hindi spoken instruction in Devanagari script for the patient',
                      },
                      confidence: {
                        type: Type.NUMBER,
                        description: 'Confidence score between 0.0 and 1.0',
                      },
                    },
                    required: [
                      'drug_name',
                      'strength',
                      'frequency',
                      'food_timing',
                      'duration',
                      'instructions_hindi',
                      'confidence',
                    ],
                  },
                },
              },
              required: ['medications'],
            },
          },
        });

        const candidate = response.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
          console.warn(`Model ${model} candidate was blocked by SAFETY.`);
          continue;
        }

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} error:`, err.message || err);
        if (err.status === 503 || err.message?.includes('503')) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    if (!responseText) {
      throw lastError || new Error('All vision candidate models failed to decipher prescription.');
    }

    // Strip markdown code fences (```json ... ```) before parsing JSON
    const sanitized = responseText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(sanitized);
    } catch (parseErr) {
      console.warn('JSON parsing error, attempting recovery:', parseErr);
      parsedResult = {};
    }

    const rawMeds: any[] = Array.isArray(parsedResult.medications)
      ? parsedResult.medications
      : Array.isArray(parsedResult)
      ? parsedResult
      : [];

    const medicines = rawMeds.map((item: any, idx: number) => {
      const rawFood = (item.food_timing || item.food_relation || 'not_specified').toLowerCase();
      const foodNorm = [
        'before_food',
        'after_food',
        'with_food',
        'empty_stomach',
        'bedtime',
      ].includes(rawFood)
        ? rawFood
        : 'not_specified';

      const conf = typeof item.confidence === 'number'
        ? Math.max(0, Math.min(1, item.confidence))
        : 0.85;

      const durationNum = item.duration
        ? parseInt(String(item.duration).replace(/\D+/g, ''), 10) || null
        : null;

      return {
        id: `med_${Date.now()}_${idx}`,
        drug_name: item.drug_name || 'Unidentified Medicine',
        form: 'tablet',
        strength: item.strength && item.strength !== 'Not specified' ? item.strength : '',
        frequency_raw: item.frequency || 'OD',
        frequency_plain: item.frequency || 'Once daily',
        food_relation: foodNorm,
        duration_days: durationNum,
        special_instructions: item.instructions_hindi || null,
        confidence: {
          name: conf,
          dose: conf,
          frequency: conf,
        },
        verified: false,
      };
    });

    return res.status(200).json({
      medications: rawMeds,
      medicines,
    });
  } catch (error: any) {
    console.error('Prescription extraction error:', error);
    return res.status(422).json({
      error:
        'पर्चे की फोटो से दवाइयां स्पष्ट रूप से नहीं पहचानी जा सकीं। कृपया पर्याप्त रोशनी में सीधी फोटो खींचें, या मैन्युअल रूप से दवाई का नाम दर्ज करें। (Could not read medicines from this photo. Please ensure clear lighting and focus, or enter medicines manually).',
      details: error.message,
    });
  }
}
