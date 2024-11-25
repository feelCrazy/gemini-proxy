import { google } from "@ai-sdk/google";
import { StreamData, streamText } from "ai";
import "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { stream } from "hono/streaming";
import { handle } from "hono/vercel";
import { Message } from "../types";

export const config = {
  runtime: "edge",
  regions: ["cle1", "iad1", "pdx1", "sfo1", "sin1", "syd1", "hnd1", "kix1"],
};

const app = new Hono().basePath("/api");
app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type"] }));

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
app.get("/", async (c) => {
  return c.json({
    data: "ok",
  });
});

// app.post("/geminiChatWithImage", async (c) => {
//   const { prompt, imageBase, ...rest } = (await c.req.json()) as Omit<
//     BodyData,
//     "history"
//   >;

// const result = streamText({
//   model: google("gemini-1.5-flash"),
//   // ...rest,
//   // [prompt,imageBase]
// });
// const model = genAI.getGenerativeModel({
//   model: "gemini-pro-vision",
//   ...rest,
// });

// try {
//   const res = await model.generateContentStream([prompt, ...imageBase]);
//   const stream = GoogleGenerativeAIStream(res);
//   return new StreamingTextResponse(stream);
// } catch (error) {
//   c.status(400);
//   return c.json({ data: String(error) });
// }
// });

export default handle(app);
