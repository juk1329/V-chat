// lib/persona-service.ts
import personasData from '@/data/personas.json'

export interface PersonaData {
  name: string
  voice_id: string
  fine_tuned_model_id: string
  url: string
  persona_data: {
    age_group: string
    gender: string
    occupation: string
    personality_traits: string[]
    speech_patterns: string[]
    tone: string
    speaking_style: string
    personality: string
    characteristics: string[]
  }
  few_shot_examples: {
    user: string
    assistant: string
  }[]
}

export interface PersonasResponse {
  success: boolean
  personas: string[]
  current_persona?: string
  error?: string
}

export interface PersonaSelectResponse {
  success: boolean
  message?: string
  error?: string
}

export interface ChatResponse {
  success: boolean
  response?: string
  audio_url?: string
  error?: string
}

let currentSelectedPersona: string = ''

class PersonaService {
  private personas: Record<string, PersonaData> = personasData

  // 사용 가능한 페르소나 목록 가져오기
  getPersonas(): PersonasResponse {
    try {
      const personaNames = Object.keys(this.personas)
      
      // 현재 선택된 페르소나가 없으면 첫 번째 페르소나 선택
      if (!currentSelectedPersona && personaNames.length > 0) {
        currentSelectedPersona = personaNames[0]
      }
      
      return {
        success: true,
        personas: personaNames,
        current_persona: currentSelectedPersona
      }
    } catch (error) {
      return {
        success: false,
        personas: [],
        error: 'Failed to load personas'
      }
    }
  }

  // 페르소나 선택
  selectPersona(personaName: string): PersonaSelectResponse {
    if (this.personas[personaName]) {
      currentSelectedPersona = personaName
      return {
        success: true,
        message: `${personaName} 선택됨`
      }
    } else {
      return {
        success: false,
        error: '페르소나를 찾을 수 없습니다'
      }
    }
  }

  // 현재 선택된 페르소나 가져오기
  getCurrentPersona(): PersonaData | null {
    if (currentSelectedPersona && this.personas[currentSelectedPersona]) {
      return this.personas[currentSelectedPersona]
    }
    return null
  }

  // 채팅 응답 생성 (시뮬레이션)
  async generateChatResponse(message: string, mode: string): Promise<ChatResponse> {
    const currentPersona = this.getCurrentPersona()
    
    if (!currentPersona) {
      return {
        success: false,
        error: '페르소나가 선택되지 않았습니다'
      }
    }

    try {
      // 간단한 응답 시뮬레이션 (실제로는 OpenAI API 호출)
      const responses = this.getPersonaResponses(currentPersona.name, message)
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      // 지연 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      return {
        success: true,
        response: randomResponse
      }
    } catch (error) {
      return {
        success: false,
        error: '응답 생성에 실패했습니다'
      }
    }
  }

  // 페르소나별 응답 패턴
  private getPersonaResponses(personaName: string, userMessage: string): string[] {
    const baseResponses: Record<string, string[]> = {
      '둥그레': [
        '앗 뭐야 뭐야~ 재밌는 얘기네!',
        '하하하 정말? 그런 일이 있었구나 ㅋㅋ',
        '우와 대박! 나도 그런 거 좋아해~',
        '헉 진짜야? 너무 신기하다!',
        '아 맞아맞아! 나도 그렇게 생각해!',
        '으으음~ 그거 좀 어려운데? ㅋㅋㅋ',
        '야야 그거 정말 재밌겠다! 나도 해볼래~'
      ],
      '왕누니': [
        '왕누니가 답해줄게! 그거 완전 재밌는데?',
        '어머 정말? 왕누니도 그런 거 좋아해~',
        '앗 그거 알아! 왕누니가 잘하는 건데 ㅎㅎ',
        '우와 대박사건! 왕누니도 궁금해졌어',
        '헤헤 그런 거구나~ 왕누니가 알려줄게!',
        '음음 그거 말이야... 왕누니 생각엔 말이지~',
        '야야 재밌다! 왕누니랑 더 얘기해보자!'
      ],
      '아이네': [
        '흐으으으으음~ 하이네~~! 그거 정말 좋은데?',
        '미웡! 그런 일이 있었구나~',
        '아이네는 그런 거 정말 좋아라네!',
        '우와~ 너무 재밌는 얘기다네!',
        '헉 진짜라네? 아이네도 놀랐어!',
        '흠흠 그거 말이야... 아이네 생각엔 말이지~',
        '하이네~ 그거 정말 멋진 아이디어라네!'
      ],
      '릴파': [
        '안녕하세요~ 릴파입니다! 그거 정말 재밌네요!',
        '오호~ 그런 일이 있었군요! 릴파도 궁금해졌어요',
        '우와 대박! 릴파도 그런 거 좋아해요~',
        '정말요? 릴파가 도움을 드릴 수 있을까요?',
        '헤헤 재밌는 얘기네요! 릴파도 경험이 있어요',
        '음음 그거 말씀하시는 거... 릴파가 알아요!',
        '와~ 정말 멋진데요! 릴파도 해보고 싶어져요'
      ],
      '징버거': [
        '하이부가~! 그거 정말 재밌는 얘기네!',
        '모시깽이처럼 쉬운 건 아니지만... 재밌어!',
        '어머 정말? 징버거도 그런 거 좋아해~',
        '우와 대박! 징버거가 도와줄게!',
        '헉 진짜야? 징버거도 놀랐어!',
        '음음 그거 말이야... 징버거 생각엔~',
        '야야 재밌다! 징버거랑 더 놀자!'
      ]
    }

    return baseResponses[personaName] || [
      '안녕! 재밌는 얘기네~',
      '우와 정말? 나도 궁금해졌어!',
      '헤헤 그런 거구나! 재밌다~'
    ]
  }

  // 페르소나 생성 (시뮬레이션)
  async createPersona(name: string, url: string, voiceId?: string, modelId?: string): Promise<PersonaSelectResponse> {
    try {
      // 실제로는 웹 스크래핑 + AI 분석
      await new Promise(resolve => setTimeout(resolve, 3000)) // 3초 지연 시뮬레이션
      
      // 새 페르소나 데이터 생성
      const newPersona: PersonaData = {
        name,
        voice_id: voiceId || "HAIQu18Se8Zljrot4frx",
        fine_tuned_model_id: modelId || "ft:gpt-4o-mini-2024-07-18:session12::BdvAqZdI",
        url,
        persona_data: {
          age_group: "20대",
          gender: "여성",
          occupation: "인터넷 방송인",
          personality_traits: ["밝은", "활발한", "친근한"],
          speech_patterns: ["반말", "애교", "감탄사"],
          tone: "밝고 친근한",
          speaking_style: "반말, 애교 섞인 말투",
          personality: "활발하고 긍정적이며 시청자들과 친근하게 소통하는 방송인",
          characteristics: ["친근한 성격", "밝은 분위기", "재미있는 리액션"]
        },
        few_shot_examples: [
          {
            user: "안녕하세요!",
            assistant: `안녕~ ${name}이야! 반가워!`
          },
          {
            user: "오늘 뭐했어?",
            assistant: "오늘은 재밌는 일이 많았어! 너는 뭐했어?"
          }
        ]
      }
      
      // 메모리에 추가
      this.personas[name] = newPersona
      
      return {
        success: true,
        message: `${name} 페르소나가 성공적으로 생성되었습니다!`
      }
    } catch (error) {
      return {
        success: false,
        error: '페르소나 생성에 실패했습니다'
      }
    }
  }
}

export const personaService = new PersonaService()