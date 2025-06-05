// app/api/personas/select/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { personaService } from "@/lib/persona-service"

export async function POST(request: NextRequest) {
  try {
    const { persona_name } = await request.json()
    
    if (!persona_name) {
      return NextResponse.json({ 
        success: false, 
        error: "Persona name is required" 
      }, { status: 400 })
    }

    const data = personaService.selectPersona(persona_name)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error selecting persona:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to select persona" 
    }, { status: 500 })
  }
}