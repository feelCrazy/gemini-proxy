import { google } from "@ai-sdk/google"
import { createDataStreamResponse, streamText } from "ai"
import "dotenv/config"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { Message } from "../types"

const app = new Hono().basePath("/api")

app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type"] }))

app.get("/", (c) => {
  return c.json({ message: "Congrats! You've deployed Hono to VPS" })
})

app.post("/geminiChat", async (c) => {
  const { messages } = (await c.req.json()) as Message

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData("init")
      const result = streamText({
        model: google("gemini-2.0-flash-exp"),
        messages,
        onFinish() {
          dataStream.writeData("call completed")
        },
      })
      result.mergeIntoDataStream(dataStream)
    },
    onError: (error) => {
      return error instanceof Error ? error.message : String(error)
    },
  })
})

app.get("/version", async (c) => {
  return c.json({
    data: "ok",
  })
})
export default app
