import { ai, MODEL, executeGeminiWithRetry } from '../lib/gemini.js';
import { aiInsightsSchema } from '../validators/assistant.schema.js';
import { logger } from '../lib/logger.js';

export async function generateShopkeeperInsights(analytics) {
  const defaultInsights = [
    {
      title: 'Promote Peak Service',
      detail: analytics.topServices?.[0]
        ? `Your most booked service is "${analytics.topServices[0].name}". Highlight it on your profile cover.`
        : 'Highlight your top services to attract more customer bookings.',
      action: 'Feature on Profile',
      priority: 'high',
    },
    {
      title: 'Optimize Slow Slots',
      detail: 'Consider offering a 10% discount during morning or early afternoon hours to increase footfall.',
      action: 'Set Off-Peak Offer',
      priority: 'medium',
    },
    {
      title: 'Minimize No-Shows',
      detail: `Your current no-show rate is ${analytics.kpis?.noShowRate ?? 0}%. Enable automated SMS/email reminders to cut missed bookings.`,
      action: 'Check Notifications',
      priority: 'low',
    },
  ];

  try {
    const prompt = `You are a business analyst for a small local shop. Using ONLY the JSON metrics below, return JSON with 3 concise, actionable insights for the shopkeeper (e.g., slow hours to discount, top service to promote, no-show risk). Do not invent numbers.
METRICS: ${JSON.stringify(analytics)}

Return valid JSON with key "insights" containing an array of 3 objects with keys: title, detail, action, priority ("high", "medium", or "low").`;

    const response = await executeGeminiWithRetry(() =>
      ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      })
    );

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text);
      const validated = aiInsightsSchema.safeParse(parsed);
      if (validated.success && validated.data.insights.length >= 3) {
        return validated.data.insights.slice(0, 3);
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to generate AI insights, returning deterministic fallback');
  }

  return defaultInsights;
}

