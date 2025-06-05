// app/api/personas/route.ts
import { NextResponse } from "next/server"
import { personaService } from "@/lib/persona-service"

export async function GET() {
  try {
    const data = personaService.getPersonas()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching personas:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch personas",
      personas: []
    }, { status: 500 })
  }
}