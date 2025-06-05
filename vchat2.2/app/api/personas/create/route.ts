// app/api/personas/create/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { personaService } from "@/lib/persona-service"

export async function POST(request: NextRequest) {
  try {
    const { name, url, voiceId, modelId } = await request.json()

    if (!name || !url) {
      return NextResponse.json({ 
        success: false, 
        error: "Name and URL are required" 
      }, { status: 400 })
    }

    const data = await personaService.createPersona(name, url, voiceId, modelId)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating persona:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create persona" 
    }, { status: 500 })
  }
}