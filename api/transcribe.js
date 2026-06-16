// Vercel serverless function: proxies short audio clips to OpenAI's Whisper API
// for transcription. Keeps OPENAI_API_KEY server-side only — the browser never sees it.
//
// Request:  POST raw audio bytes, Content-Type: application/octet-stream
//           optional query param ?ext=webm|mp4|wav (defaults to webm)
// Response: { text: "transcribed words" }

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB — plenty for a short voice-count clip
const ALLOWED_EXT = { webm: 'audio/webm', mp4: 'audio/mp4', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg' };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
    return;
  }

  try {
    const audioBuffer = Buffer.isBuffer(req.body) ? req.body : await readRawBody(req);
    if (!audioBuffer || audioBuffer.length === 0) {
      res.status(400).json({ error: 'No audio data received.' });
      return;
    }
    if (audioBuffer.length > MAX_AUDIO_BYTES) {
      res.status(413).json({ error: 'Audio clip too large.' });
      return;
    }

    const ext = ALLOWED_EXT[(req.query.ext || 'webm').toLowerCase()] ? req.query.ext.toLowerCase() : 'webm';
    const mimeType = ALLOWED_EXT[ext];

    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: mimeType }), `audio.${ext}`);
    form.append('model', 'whisper-1');

    const openaiResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });

    const data = await openaiResp.json();
    if (!openaiResp.ok) {
      res.status(502).json({ error: data?.error?.message || 'Transcription failed.' });
      return;
    }

    res.status(200).json({ text: data.text || '' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
};
