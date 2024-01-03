import { Hono } from "hono"
import { handle } from "hono/vercel"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai"
import { cors } from "hono/cors"
import { BodyData } from "../types"

const API_KEY = process.env.API_KEY || ""
const genAI = new GoogleGenerativeAI(API_KEY)

export const config = {
  runtime: "edge",
  regions: ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"],
}

const app = new Hono().basePath("/api")
app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type"] }))

app.post("/geminiChat", async (c) => {
  const { history, prompt, ...rest } = (await c.req.json()) as Omit<
    BodyData,
    "imageBase"
  >
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

app.post("/geminiChatWithImage", async (c) => {
  const { prompt, imageBase, ...rest } = (await c.req.json()) as Omit<
    BodyData,
    "history"
  >
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    ...rest,
  })

  try {
    const res = await model.generateContentStream([prompt, ...imageBase])
    const stream = GoogleGenerativeAIStream(res)
    return new StreamingTextResponse(stream)
  } catch (error) {
    c.status(400)
    return c.json({ data: String(error) })
  }
})

export default handle(app)
