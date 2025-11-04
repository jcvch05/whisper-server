import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Necesario para manejar archivos binarios
  },
};

// Inicializa el cliente de OpenAI con la API key del entorno de Vercel
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {
    // 1️⃣ Parsear el archivo de audio enviado en el formulario
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0] || files.file;

    if (!file) {
      return res.status(400).json({ success: false, error: "No se recibió ningún archivo" });
    }

    // 2️⃣ Llamar a la API de OpenAI Whisper
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(file.filepath),
      model: "gpt-4o-mini-transcribe",
    });

    // 3️⃣ Enviar el texto transcrito al cliente
    return res.status(200).json({
      success: true,
      text: transcription.text,
    });

  } catch (error) {
    console.error("❌ Error al procesar:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      details: error.message,
    });
  }
}