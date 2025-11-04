import express from "express";
import formidable from "formidable";
import fs from "fs";
import https from "https";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // 🔧 Puerto dinámico para Render

// Verifica que la API key esté disponible
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ No se encontró OPENAI_API_KEY en .env");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 segundos
});

// Crea agente HTTPS con keep-alive
const agent = new https.Agent({ keepAlive: true });

app.post("/api/transcribe", (req, res) => {
  const form = formidable({ multiples: false });

  console.log("🎧 Recibiendo archivo para transcribir...");

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Error al procesar el archivo:", err);
      return res.status(400).json({ success: false, error: "Archivo inválido" });
    }

    const file = files.file?.[0] || files.file;
    if (!file || !file.filepath) {
      return res.status(400).json({ success: false, error: "No se encontró el archivo" });
    }

    console.log(`📄 Archivo recibido: ${file.originalFilename}`);

    try {
      console.log("🎙️ Enviando archivo a Whisper...");

      const response = await client.audio.transcriptions.create(
        {
          file: fs.createReadStream(file.filepath),
          model: "gpt-4o-mini-transcribe", // o "whisper-1"
          response_format: "json",
        },
        {
          agent, // usa el agente HTTPS con keepAlive
        }
      );

      console.log("✅ Transcripción completa:", response.text);
      res.status(200).json({ success: true, text: response.text });
    } catch (error) {
      console.error("❌ Error en la transcripción:", error);
      res.status(500).json({
        success: false,
        error: "Error en la transcripción",
        details: error.message || error,
      });
    }
  });
});

// 🔧 Escucha en puerto dinámico para Render
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🟢 Whisper Server running on port ${PORT}`);
});