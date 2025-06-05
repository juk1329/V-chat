// app/api/chat/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { personaService } from "@/lib/persona-service"
import OpenAI from 'openai'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, mode, persona } = await request.json()

    if (!message || !persona) {
      return NextResponse.json({ 
        success: false, 
        error: "Message and persona are required" 
      }, { status: 400 })
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: "OpenAI API key not configured" 
      }, { status: 500 })
    }

    // 현재 선택된 페르소나와 요청된 페르소나가 다르면 선택
    personaService.selectPersona(persona)
    const currentPersona = personaService.getCurrentPersona()
    
    if (!currentPersona) {
      return NextResponse.json({ 
        success: false, 
        error: "Persona not found" 
      }, { status: 404 })
    }

    // 시스템 프롬프트 생성
    const systemPrompt = generateSystemPrompt(currentPersona)
    
    // Few-shot 예제들로 메시지 구성
    const messages = buildFewShotMessages(currentPersona, message, systemPrompt)

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.8,
      max_tokens: 250,
    })

    const response = completion.choices[0]?.message?.content || "미안, 지금 말이 안 나와 ㅠㅠ"

    return NextResponse.json({
      success: true,
      response: response.trim()
    })

  } catch (error: any) {
    console.error("Error in chat:", error)
    
    // OpenAI API 에러 처리
    if (error.code === 'invalid_api_key') {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid OpenAI API key" 
      }, { status: 401 })
    }
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json({ 
        success: false, 
        error: "OpenAI API quota exceeded" 
      }, { status: 429 })
    }

    return NextResponse.json({ 
      success: false, 
      error: "Failed to get chat response" 
    }, { status: 500 })
  }
}

function generateSystemPrompt(persona: any): string {
  const data = persona.persona_data
  return `당신은 '${persona.name}'라는 ${data.gender} ${data.occupation}입니다.

페르소나 특성:
- 성격: ${data.personality}
- 나이대: ${data.age_group}
- 말투: ${data.speaking_style}

대화할 때 다음 특징들을 반드시 지켜주세요:

1. **말투와 어조**:
   - 친한 친구와 대화하듯이 친근한 말투 사용
   - 애교 섞인 밝고 여성적인 말투 사용
   - 감정이 풍부하게 드러나도록 '!', '?', '~' 등 활용
   - 자연스러운 감탄사 사용

2. **성격 표현**:
   - 밝고 에너지 넘치는 분위기
   - 친근하고 장난스러운 태도
   - 시청자를 친구처럼 대하는 편안한 관계
   - 솔직하고 감정 표현이 풍부함

3. **절대 피해야 할 것**:
   - 경어체 사용 금지
   - 같은 말 반복하지 말기
   - 사무적이고 딱딱한 답변 금지
   - 맥락에 맞지 않는 엉뚱한 대답 금지

4. **반응 스타일**:
   - 게임이나 재미있는 주제에 큰 리액션
   - 귀엽고 애교 있는 반응
   - 자연스러운 대화 흐름 유지

항상 '${persona.name}'의 캐릭터를 유지하면서 자연스럽고 일관성 있게 대답해주세요.`
}

function buildFewShotMessages(persona: any, userMessage: string, systemPrompt: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt }
  ]

  // Few-shot 예제들 추가
  for (const example of persona.few_shot_examples) {
    messages.push({ role: "user", content: example.user })
    messages.push({ role: "assistant", content: example.assistant })
  }

  // 실제 사용자 메시지
  messages.push({ role: "user", content: userMessage })

  return messages
}