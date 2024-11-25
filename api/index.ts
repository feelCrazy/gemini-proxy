import { google } from "@ai-sdk/google";
import { StreamData, streamText } from "ai";
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { stream } from "hono/streaming";
import { handle } from "hono/vercel";
import { Message } from "../types";

export const config = {
  // runtime: "edge",
  regions: ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"],
};

const app = new Hono().basePath("/api");
app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type"] }));

app.get("/", (c) => {
  return c.json({ message: "Congrats! You've deployed Hono to Vercel" });
});

app.post("/geminiChat", async (c) => {
  const data = new StreamData();
  data.append("initialized call");
  const { messages } = (await c.req.json()) as Message;
  const result = streamText({
    model: google("gemini-1.5-flash"),
    messages,
    onFinish() {
      data.append("call completed ");
      data.close();
    },
  });

  return stream(c, (stream) => stream.pipe(result.toDataStream({ data })));
});

app.get("/version", async (c) => {
  return c.json({
    data: "ok",
  });
});
const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
