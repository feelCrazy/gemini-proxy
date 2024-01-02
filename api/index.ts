import { Hono } from "hono"
import { handle } from "hono/vercel"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai"
import { cors } from "hono/cors"

const API_KEY = process.env.API_KEY || ""
const genAI = new GoogleGenerativeAI(API_KEY)

export const config = {
  runtime: "edge",
  regions: ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"],
}

const app = new Hono()
app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type"] }))
app.get("/", (c) => c.text("Hello, World!"))

app.post("/api/geminiChat", async (c) => {
  const { history, prompt, ...rest } = await c.req.json()
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    ...rest,
  })
  const chat = model.startChat({ history })

  try {
    const res = await chat.sendMessageStream(prompt)
    const stream = GoogleGenerativeAIStream(res)
    return new StreamingTextResponse(stream)
  } catch (error) {
    c.status(400)
    return c.json({ data: String(error) })
  }
})

app.post("/api/geminiChatWithImage", async (c) => {
  const { history, prompt, ...rest } = await c.req.json()
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    ...rest,
  })

  try {
    const res = await model.generateContentStream([prompt])
    const stream = GoogleGenerativeAIStream(res)
    return new StreamingTextResponse(stream)
  } catch (error) {
    c.status(400)
    return c.json({ data: String(error) })
  }
})

export default handle(app)
