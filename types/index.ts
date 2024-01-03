import { SafetySetting } from "@google/generative-ai"

export type BodyData = {
  history?: {
    role: string
    parts: string
  }[]
  imageBase: ImageBase[]

  prompt: string
  generationConfig?: {
    [key: string]: string | number
  }
  safetySettings?: SafetySetting[]
}

type ImageBase = {
  inlineData: {
    data: string
    mimeType: string
  }
}
