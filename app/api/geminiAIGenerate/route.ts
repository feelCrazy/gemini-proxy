import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai"
import { BodyData } from "@/types"

const API_KEY = process.env.API_KEY || ""
const genAI = new GoogleGenerativeAI(API_KEY)

export const runtime = "edge"
export const dynamic = "force-dynamic"

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
function calculateBase64Size(base64String: string) {
  const padding = base64String.endsWith("==")
    ? 2
    : base64String.endsWith("=")
    ? 1
    : 0
  const sizeInBytes = (base64String.length / 4) * 3 - padding
  const sizeInKB = sizeInBytes / 1024
  return { sizeInBytes, sizeInKB }
}

function calculateStringSize(str: string) {
  const sizeInBytes = new Blob([str]).size
  const sizeInKB = sizeInBytes / 1024
  return { sizeInBytes, sizeInKB }
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function POST(request: Request) {
  const { imageBase, prompt, ...rest } = (await request.json()) as BodyData

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
  if (!imageBase) {
    return NextResponse.json(
      {
        data: "No image provided",
      },
      {
        status: 400,
        headers,
      }
    )
  }
  if (imageBase.length > 16) {
    return NextResponse.json(
      {
        data: "Too many images provided",
      },
      {
        status: 400,
        headers,
      }
    )
  }

  if (imageBase.length) {
    let size = 0
    imageBase.map((item) => {
      const { sizeInKB } = calculateBase64Size(item.inlineData.data)
      size += sizeInKB
    })
    const { sizeInKB } = calculateStringSize(prompt)
    size += sizeInKB
    if (size / 1024 > 4) {
      return NextResponse.json(
        {
          data: "Maximum of 4MB for the entire prompt, including images and text",
        },
        {
          status: 400,
          headers,
        }
      )
    }
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    ...rest,
  })

  try {
    const res = await model.generateContentStream([prompt])
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
