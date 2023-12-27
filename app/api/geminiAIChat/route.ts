import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai"
import { BodyData } from "@/types"

const API_KEY = process.env.API_KEY || ""
const genAI = new GoogleGenerativeAI(API_KEY)

export const runtime = "edge"
export const preferredRegion = [
  "cle1",
  "iad1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
  "hnd1",
  "kix1",
]

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function POST(request: Request) {
  const { history, prompt, ...rest } = (await request.json()) as BodyData

  if (!prompt) {
    return NextResponse.json(
      {
        data: "No prompt provided",
      },
      {
        status: 400,
        headers,
      }
    )
  }
  if (history && history.length % 2 === 1) {
    return NextResponse.json(
      {
        data: "No history provided",
      },
      {
        status: 400,
        headers,
      }
    )
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    ...rest,
  })

  const chat = model.startChat({ history })

  try {
    const res = await chat.sendMessageStream(prompt)
    const stream = GoogleGenerativeAIStream(res)
    return new StreamingTextResponse(stream, { headers })
  } catch (error) {
    return NextResponse.json(
      {
        data: String(error),
      },
      {
        status: 400,
        headers,
      }
    )
  }
}
