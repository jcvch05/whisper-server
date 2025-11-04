import express from "express";
import formidable from "formidable";
import fs from "fs";
import https from "https";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// 🔐 Cliente OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 120 segundos
});

// 🔁 Reutiliza conexión HTTPS
const agent = new https.Agent({ keepAlive: true });

// 🎧 Endpoint principal
app.post("/api/transcribe", (req, res) => {
  const form = formidable({ multiples: false });

  console.log("🎧 Recibiendo archivo...");

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Error procesando archivo:", err);
      return res.status(400).json({ success: false, error: "Archivo inválido" });
    }

    const file = files.file?.[0] || files.file;
    if (!file || !file.filepath) {
      return res.status(400).json({ success: false, error: "No se encontró el archivo" });
    }

    console.log(`📄 Archivo recibido: ${file.originalFilename}`);

    try {
      console.log("🎙️ Enviando a Whisper...");

      const response = await client.audio.transcriptions.create(
        {
          file: fs.createReadStream(file.filepath),
          model: "whisper-1", // modelo probado y estable en Render
          response_format: "json",
        },
        { agent }
      );

      console.log("✅ Transcripción completa:", response.text);
      res.json({ success: true, text: response.text });
    } catch (error) {
      console.error("❌ Error en la transcripción:", error);
      res.status(500).json({
        success: false,
        error: "Error en la transcripción",
        details: error.message || "Unknown error",
      });
    }
  });
});

// 🧪 Endpoint de prueba
app.get("/api/testOpenAI", async (req, res) => {
  try {
    const models = await client.models.list();
    res.json({
      success: true,
      message: "✅ Conexión exitosa con OpenAI",
      models_count: models.data.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🟢 Whisper Server running on port ${port}`);
});