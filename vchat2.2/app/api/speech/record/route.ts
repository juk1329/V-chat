// app/api/speech/record/route.ts
import { type NextRequest, NextResponse } from "next/server"
import OpenAI from 'openai'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 음성 녹음 상태 관리 (실제 프로덕션에서는 Redis 등 사용)
let recordingState: { [sessionId: string]: boolean } = {}

export async function POST(request: NextRequest) {
  try {
    const { action, audioData, sessionId = 'default' } = await request.json()

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: "OpenAI API key not configured" 
      }, { status: 500 })
    }

    if (action === "start") {
      // 음성 녹음 시작
      recordingState[sessionId] = true
      return NextResponse.json({ 
        success: true, 
        message: "녹음 시작",
        recording: true
      })
    } 
    
    else if (action === "stop") {
      // 음성 녹음 중지
      recordingState[sessionId] = false
      
      if (!audioData) {
        // audioData가 없으면 시뮬레이션 응답
        const mockTranscriptions = [
          "안녕하세요!",
          "오늘 날씨가 좋네요",
          "뭐하고 계세요?",
          "재밌는 얘기 해주세요",
          "고마워요!"
        ]
        
        const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]
        
        return NextResponse.json({
          success: true,
          transcription: randomTranscription,
          isSimulation: true
        })
      }

      try {
        // 실제 Whisper API로 음성 변환
        const audioFile = new File([audioData], "audio.wav", { type: "audio/wav" })
        
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "ko", // 한국어 설정
        })

        return NextResponse.json({
          success: true,
          transcription: transcription.text,
          isSimulation: false
        })
      } catch (whisperError: any) {
        console.error("Whisper API error:", whisperError)
        
        // Whisper API 에러 시 시뮬레이션으로 폴백
        const fallbackTranscriptions = [
          "음성 인식이 어려워서 임시 응답이에요",
          "다시 한 번 말씀해 주세요",
          "음성이 잘 들리지 않았어요"
        ]
        
        const fallbackResponse = fallbackTranscriptions[Math.floor(Math.random() * fallbackTranscriptions.length)]
        
        return NextResponse.json({
          success: true,
          transcription: fallbackResponse,
          isSimulation: true,
          error: "Whisper API 사용 불가, 시뮬레이션 모드"
        })
      }
    }
    
    else if (action === "status") {
      // 녹음 상태 확인
      return NextResponse.json({
        success: true,
        recording: recordingState[sessionId] || false
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: "Invalid action. Use 'start', 'stop', or 'status'" 
    }, { status: 400 })

  } catch (error: any) {
    console.error("Error in speech recording:", error)
    
    // API 키 관련 에러
    if (error.code === 'invalid_api_key') {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid OpenAI API key" 
      }, { status: 401 })
    }

    return NextResponse.json({ 
      success: false, 
      error: "Failed to handle speech recording" 
    }, { status: 500 })
  }
}