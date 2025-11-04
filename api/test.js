export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: "✅ La API key de OpenAI fue detectada correctamente.",
    keySample: process.env.OPENAI_API_KEY
      ? process.env.OPENAI_API_KEY.slice(0, 15) + "..."
      : "No se encontró la API key"
  });
}