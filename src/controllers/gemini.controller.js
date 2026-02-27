import axios from "axios"

export const generarActa = async (req, res) => {
  const { prompt } = req.body

  try {
    const response = await axios.post(
      process.env.GEMINI_URL,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GEMINI_API_KEY
        }
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error(error.response?.data || error)
    res.status(500).json({ error: "Error generando acta" })
  }
}
