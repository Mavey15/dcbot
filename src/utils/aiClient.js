// Menyimpan riwayat obrolan singkat per channel (maks 10 pesan terakhir)
const channelHistory = new Map();
const MAX_HISTORY = 10;

// Daftar model dengan fallback otomatis jika salah satu sedang sibuk/tidak tersedia
const GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-latest',
];

const SYSTEM_PROMPT =
  'Kamu adalah asisten AI Discord yang ramah, membantu, dan menjawab dalam bahasa yang sama dengan pengguna (utamanya Bahasa Indonesia). Jawab dengan jelas, ringkas, dan sopan.';

async function askGemini(prompt, channelId = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  let history = [];
  if (channelId) {
    history = channelHistory.get(channelId) || [];
  }

  const contents = [
    ...history,
    { role: 'user', parts: [{ text: prompt }] },
  ];

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
          }),
        },
      );

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        lastError = new Error(`[${model}] HTTP_${response.status}: ${errBody.slice(0, 200)}`);
        // Coba model cadangan jika 404, 429, atau 5xx
        if (response.status === 404 || response.status === 429 || response.status >= 500) {
          continue;
        }
        throw lastError;
      }

      const data = await response.json();
      const replyText =
        data?.candidates?.[0]?.content?.parts
          ?.filter((p) => typeof p.text === 'string' && !p.thought)
          .map((p) => p.text)
          .join('') || 'Maaf, saya tidak dapat menghasilkan jawaban saat ini.';

      if (channelId) {
        const updated = [
          ...history,
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'model', parts: [{ text: replyText }] },
        ].slice(-MAX_HISTORY);
        channelHistory.set(channelId, updated);
      }

      return replyText;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Semua model Gemini gagal merespons.');
}

function clearHistory(channelId) {
  channelHistory.delete(channelId);
}

module.exports = {
  askGemini,
  clearHistory,
};
