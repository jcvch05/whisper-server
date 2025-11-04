import express from "express";
import formidable from "formidable";
import fs from "fs";
import https from "https";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 180000, // 3 minutos de espera máxima
});

// Agente HTTPS persistente para Render
const agent = new https.Agent({
  keepAlive: true,
  timeout: 60000,
  rejectUnauthorized: false, // Evita que Render corte la conexión SSL
});

// Retraso con reintento progresivo
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function transcribeWithRetry(filePath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔁 Intento ${attempt} de transcripción...`);

      const response = await client.audio.transcriptions.create(
        {
          file: fs.createReadStream(filePath),
          model: "whisper-1",
          response_format: "json",
        },
        { agent }
      );

      return response;
    } catch (err) {
      console.error(`❌ Error intento ${attempt}:`, err.message || err);
      if (attempt < retries) {
        console.log("⏳ Reintentando en 3 segundos...");
        await wait(3000);
      } else {
        throw err;
      }
    }
  }
}

app.post("/api/transcribe", (req, res) => {
  const form = formidable({ multiples: false, maxFileSize: 50 * 1024 * 1024 }); // hasta 50 MB

  console.log("🎧 Recibiendo archivo...");

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Error procesando archivo:", err);
      return res
        .status(400)
        .json({ success: false, error: "Archivo inválido o demasiado grande" });
    }

    const file = files.file?.[0] || files.file;
    if (!file || !file.filepath) {
      return res
        .status(400)
        .json({ success: false, error: "No se encontró el archivo" });
    }

    console.log(`📄 Archivo recibido: ${file.originalFilename}`);

    try {
      console.log("🎙️ Enviando a Whisper...");
      const result = await transcribeWithRetry(file.filepath, 3);

      console.log("✅ Transcripción completa:", result.text);
      res.status(200).json({ success: true, text: result.text });
    } catch (error) {
      console.error("💀 Error final de transcripción:", error);
      res.status(500).json({
        success: false,
        error: "Error en la transcripción",
        details: error.message || "Error desconocido",
      });
    }
  });
});

// 🔍 Endpoint de diagnóstico
app.get("/api/testOpenAI", async (req, res) => {
  try {
    const models = await client.models.list();
    res.json({
      success: true,
      message: "✅ Conexión estable con OpenAI",
      models_count: models.data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("⚠️ Error en testOpenAI:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🟢 Inicio del servidor
app.listen(port, () => {
  console.log(`🛡️ Whisper Server blindado corriendo en puerto ${port}`);
});