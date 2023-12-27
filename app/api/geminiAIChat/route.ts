import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai"
import { BodyData } from "@/types"

const API_KEY = process.env.API_KEY || ""
const genAI = new GoogleGenerativeAI(API_KEY)

export const runtime = "edge"

export async function POST(request: Request) {
  const { history, prompt, ...rest } = (await request.json()) as BodyData

  if (!prompt) {
    return NextResponse.json(
      {
        data: "No prompt provided",
      },
      {
        status: 400,
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
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.log(">>>eeee", error)

    return NextResponse.json(
      {
        data: String(error),
      },
      {
        status: 400,
      }
    )
  }
}
