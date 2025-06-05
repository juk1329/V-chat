"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import ChatInterface from "@/components/chat-interface"
import PersonaCreator from "@/components/persona-creator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, UserPlus } from "lucide-react"

export default function ChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentMode, setCurrentMode] = useState<"chat" | "create">("chat")
  const [selectedPersona, setSelectedPersona] = useState<string>("")
  const [personas, setPersonas] = useState<string[]>([])
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (user) {
      fetchPersonas()
    }
  }, [user])

  const fetchPersonas = async () => {
    setIsLoadingPersonas(true)
    setError(null)
    try {
      const response = await fetch("/api/personas")
      const data = await response.json()
      
      if (data.success) {
        setPersonas(data.personas || [])
        // 현재 페르소나가 있으면 설정, 없으면 첫 번째 페르소나 선택
        if (data.current_persona) {
          setSelectedPersona(data.current_persona)
        } else if (data.personas.length > 0 && !selectedPersona) {
          setSelectedPersona(data.personas[0])
          // 자동으로 첫 번째 페르소나 선택
          await handlePersonaSelect(data.personas[0])
        }
      } else {
        setError("페르소나 목록을 불러오는데 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to fetch personas:", error)
      setError("네트워크 오류가 발생했습니다.")
    } finally {
      setIsLoadingPersonas(false)
    }
  }

  const handlePersonaSelect = async (personaName: string) => {
    try {
      const response = await fetch("/api/personas/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona_name: personaName }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSelectedPersona(personaName)
        setError(null)
      } else {
        setError(`페르소나 선택에 실패했습니다: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to select persona:", error)
      setError("페르소나 선택 중 네트워크 오류가 발생했습니다.")
    }
  }

  const handlePersonaCreated = () => {
    fetchPersonas()
    setCurrentMode("chat") // 페르소나 생성 후 채팅 모드로 자동 전환
  }

  const handleModeChange = (mode: "chat" | "create") => {
    setCurrentMode(mode)
    setError(null) // 모드 변경시 에러 초기화
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentMode={currentMode} 
        onModeChange={handleModeChange} 
        selectedPersona={selectedPersona} 
      />

      <div className="flex pt-20"> {/* 헤더 높이만큼 패딩 추가 */}
        <Sidebar 
          personas={personas} 
          selectedPersona={selectedPersona} 
          onPersonaSelect={handlePersonaSelect}
        />

        <main className="flex-1 ml-64 min-h-[calc(100vh-5rem)]">
          {/* 에러 메시지 */}
          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchPersonas}
                    className="ml-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    다시 시도
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* 메인 콘텐츠 */}
          {currentMode === "chat" ? (
            personas.length > 0 ? (
              <ChatInterface selectedPersona={selectedPersona} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    사용 가능한 페르소나가 없습니다
                  </h3>
                  <p className="text-gray-600 mb-6">
                    채팅을 시작하려면 먼저 페르소나를 생성해주세요.
                  </p>
                  <Button 
                    onClick={() => setCurrentMode("create")}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    페르소나 생성하기
                  </Button>
                </div>
              </div>
            )
          ) : (
            <PersonaCreator onPersonaCreated={handlePersonaCreated} />
          )}
        </main>
      </div>
    </div>
  )
}