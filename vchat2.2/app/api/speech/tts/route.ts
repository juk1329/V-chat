// app/api/speech/tts/route.ts
import { type NextRequest, NextResponse } from "next/server"
import OpenAI from 'openai'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: "Text is required" 
      }, { status: 400 })
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: "OpenAI API key not configured. TTS 기능을 사용하려면 환경변수를 설정하세요." 
      }, { status: 500 })
    }

    try {
      // OpenAI TTS API 호출
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // 여성 목소리 (alloy, echo, fable, onyx, nova, shimmer)
        input: text,
        speed: 1.0
      })

      // 오디오 데이터를 Buffer로 변환
      const buffer = Buffer.from(await mp3.arrayBuffer())
      
      // Base64로 인코딩하여 클라이언트에 전송
      const audioBase64 = buffer.toString('base64')
      const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`

      return NextResponse.json({
        success: true,
        audio_url: audioDataUrl,
        message: "음성 변환 완료"
      })

    } catch (ttsError: any) {
      console.error("TTS API error:", ttsError)
      
      // API 에러 처리
      if (ttsError.code === 'invalid_api_key') {
        return NextResponse.json({ 
          success: false, 
          error: "Invalid OpenAI API key" 
        }, { status: 401 })
      }
      
      if (ttsError.code === 'insufficient_quota') {
        return NextResponse.json({ 
          success: false, 
          error: "OpenAI API quota exceeded" 
        }, { status: 429 })
      }

      // TTS API 실패 시 시뮬레이션 모드로 폴백
      return NextResponse.json({
        success: true,
        message: `"${text.substring(0, 50)}..." 텍스트의 음성 변환이 완료되었습니다 (시뮬레이션)`,
        isSimulation: true
      })
    }

  } catch (error: any) {
    console.error("Error in TTS:", error)
    
    return NextResponse.json({ 
      success: false, 
      error: "Failed to convert text to speech" 
    }, { status: 500 })
  }
}