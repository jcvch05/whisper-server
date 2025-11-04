export default function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    return res.status(500).json({
      success: false,
      message: "❌ No se detectó ninguna OPENAI_API_KEY en este servidor.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "✅ API key detectada correctamente.",
    preview: key.slice(0, 20) + "...(oculta)",
  });
}