"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Send, Mic, MicOff, Volume2, MessageSquare, Headphones, Speaker, AlertCircle } from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  selectedPersona: string
}

export default function ChatInterface({ selectedPersona }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatMode, setChatMode] = useState<"text-to-text" | "speech-to-speech" | "text-to-speech">("text-to-text")
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const addMessage = (type: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const handleTextSubmit = async (text: string) => {
    if (!text.trim() || !selectedPersona) return

    setError(null)
    addMessage("user", text)
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode: chatMode,
          persona: selectedPersona,
        }),
      })

      const data = await response.json()

      if (data.success) {
        addMessage("assistant", data.response)

        // TTS 모드인 경우 음성 재생
        if ((chatMode === "text-to-speech" || chatMode === "speech-to-speech") && data.audio_url) {
          const audio = new Audio(data.audio_url)
          audio.play().catch((error) => {
            console.error("Audio playback failed:", error)
            setError("음성 재생에 실패했습니다.")
          })
        }
      } else {
        addMessage("assistant", "죄송해요, 응답을 생성하는데 문제가 발생했어요.")
        setError(data.error || "응답 생성에 실패했습니다.")
      }
    } catch (error) {
      console.error("Chat error:", error)
      addMessage("assistant", "네트워크 오류가 발생했어요. 다시 시도해주세요.")
      setError("네트워크 연결을 확인해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleTextSubmit(inputValue)
    setInputValue("")
  }

  const handleVoiceRecord = async () => {
    if (isRecording) {
      setIsRecording(false)
      setError(null)
      
      try {
        const response = await fetch("/api/speech/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "stop" }),
        })

        const data = await response.json()
        if (data.success && data.transcription) {
          handleTextSubmit(data.transcription)
        } else {
          setError("음성 인식에 실패했습니다.")
        }
      } catch (error) {
        console.error("Voice recording error:", error)
        setError("음성 녹음 중 오류가 발생했습니다.")
      }
    } else {
      setIsRecording(true)
      setError(null)
      
      try {
        await fetch("/api/speech/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        })
      } catch (error) {
        console.error("Voice recording start error:", error)
        setIsRecording(false)
        setError("음성 녹음을 시작할 수 없습니다.")
      }
    }
  }

  const playLastResponse = async () => {
    const lastAssistantMessage = messages.filter((m) => m.type === "assistant").pop()
    if (!lastAssistantMessage) return

    setError(null)
    
    try {
      const response = await fetch("/api/speech/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastAssistantMessage.content }),
      })
      
      const data = await response.json()
      if (data.success && data.audio_url) {
        const audio = new Audio(data.audio_url)
        await audio.play()
      } else {
        setError("음성 변환에 실패했습니다.")
      }
    } catch (error) {
      console.error("TTS error:", error)
      setError("음성 재생 중 오류가 발생했습니다.")
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "text-to-text":
        return <MessageSquare className="h-4 w-4" />
      case "speech-to-speech":
        return <Headphones className="h-4 w-4" />
      case "text-to-speech":
        return <Speaker className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "text-to-text":
        return "텍스트 → 텍스트"
      case "speech-to-speech":
        return "음성 → 음성"
      case "text-to-speech":
        return "텍스트 → 음성"
      default:
        return "텍스트 → 텍스트"
    }
  }

  if (!selectedPersona) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            페르소나를 선택해주세요
          </h3>
          <p className="text-gray-600">
            왼쪽 사이드바에서 대화하고 싶은 페르소나를 선택하세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] p-6">
      {/* 상단 컨트롤 바 */}
      <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex items-center space-x-4">
          {/* 페르소나 정보 */}
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {selectedPersona}
            </Badge>
            <span className="text-sm text-gray-500">와 대화 중</span>
          </div>
        </div>

        {/* 모드 선택 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">모드:</span>
          <Select value={chatMode} onValueChange={(value: any) => setChatMode(value)}>
            <SelectTrigger className="w-48">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  {getModeIcon(chatMode)}
                  <span>{getModeLabel(chatMode)}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text-to-text">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>텍스트 → 텍스트</span>
                </div>
              </SelectItem>
              <SelectItem value="speech-to-speech">
                <div className="flex items-center space-x-2">
                  <Headphones className="h-4 w-4" />
                  <span>음성 → 음성</span>
                </div>
              </SelectItem>
              <SelectItem value="text-to-speech">
                <div className="flex items-center space-x-2">
                  <Speaker className="h-4 w-4" />
                  <span>텍스트 → 음성</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 채팅 영역 */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  {selectedPersona}와 대화를 시작해보세요!
                </p>
                <p className="text-sm">
                  {chatMode === "speech-to-speech" 
                    ? "마이크 버튼을 눌러 말해보세요" 
                    : "아래에 메시지를 입력하세요"
                  }
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.type === "user" 
                      ? "bg-purple-600 text-white" 
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[70%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedPersona}가 생각하고 있어요...
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 입력 영역 */}
        <div className="border-t p-4 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                chatMode === "speech-to-speech"
                  ? "음성 버튼을 눌러 말해보세요..."
                  : `${selectedPersona}에게 메시지를 입력하세요...`
              }
              disabled={isLoading || chatMode === "speech-to-speech"}
              className="flex-1 bg-white"
            />

            {/* 음성 녹음 버튼 (음성 모드일 때) */}
            {chatMode === "speech-to-speech" ? (
              <Button
                type="button"
                onClick={handleVoiceRecord}
                disabled={isLoading}
                variant={isRecording ? "destructive" : "default"}
                className={`${isRecording ? "animate-pulse" : ""}`}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            ) : (
              /* 텍스트 전송 버튼 */
              <Button 
                type="submit" 
                disabled={isLoading || !inputValue.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}

            {/* 음성 재생 버튼 (TTS 모드일 때) */}
            {(chatMode === "text-to-speech" || chatMode === "speech-to-speech") && (
              <Button
                type="button"
                onClick={playLastResponse}
                variant="outline"
                disabled={messages.filter((m) => m.type === "assistant").length === 0 || isLoading}
                title="마지막 응답 다시 듣기"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </form>

          {/* 음성 녹음 상태 표시 */}
          {isRecording && (
            <div className="mt-2 text-center">
              <div className="inline-flex items-center space-x-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">녹음 중... 말씀해주세요</span>
              </div>
            </div>
          )}

          {/* 모드별 안내 메시지 */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            {chatMode === "text-to-text" && "텍스트로 대화하고 텍스트 응답을 받습니다"}
            {chatMode === "speech-to-speech" && "음성으로 말하고 음성 응답을 받습니다"}
            {chatMode === "text-to-speech" && "텍스트로 대화하고 음성 응답을 받습니다"}
          </div>
        </div>
      </Card>
    </div>
  )
}