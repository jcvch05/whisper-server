import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ⚙️ Endpoint de prueba: verifica conexión con OpenAI
router.get("/testOpenAI", async (req, res) => {
  try {
    console.log("🧠 Probando conexión con OpenAI...");

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.models.list();

    console.log("✅ Conexión exitosa. Modelos disponibles:", response.data.length);
    res.json({
      success: true,
      message: "✅ Conexión exitosa con OpenAI",
      models_count: response.data.length,
    });
  } catch (error) {
    console.error("❌ Error de conexión con OpenAI:", error);
    res.status(500).json({
      success: false,
      error: "Error al conectar con OpenAI",
      details: error.message || error,
    });
  }
});

export default router;