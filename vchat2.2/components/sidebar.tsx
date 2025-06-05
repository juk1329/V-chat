"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Users, Sparkles } from "lucide-react"

interface SidebarProps {
  personas: string[]
  selectedPersona: string
  onPersonaSelect: (persona: string) => void
  isLoading?: boolean
}

export default function Sidebar({ personas, selectedPersona, onPersonaSelect, isLoading = false }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-20 bottom-0 z-40 shadow-sm">
      <div className="p-4 h-full flex flex-col">
        {/* 헤더 */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">페르소나</h2>
          </div>
          <p className="text-sm text-gray-500">
            {isLoading ? "로딩 중..." : `${personas.length}개의 페르소나`}
          </p>
        </div>

        {/* 페르소나 목록 */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {isLoading ? (
              // 로딩 스켈레톤
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))
            ) : personas.length > 0 ? (
              personas.map((persona) => (
                <Button
                  key={persona}
                  variant={selectedPersona === persona ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-200 ${
                    selectedPersona === persona 
                      ? "bg-purple-600 text-white shadow-sm hover:bg-purple-700" 
                      : "hover:bg-purple-50 hover:text-purple-700"
                  }`}
                  onClick={() => onPersonaSelect(persona)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`rounded-full p-1 ${
                      selectedPersona === persona 
                        ? "bg-purple-500" 
                        : "bg-gray-200"
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <span className="truncate font-medium">{persona}</span>
                    {selectedPersona === persona && (
                      <Sparkles className="h-4 w-4 ml-auto flex-shrink-0" />
                    )}
                  </div>
                </Button>
              ))
            ) : (
              // 빈 상태
              <div className="text-center py-8">
                <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  페르소나가 없습니다
                </h3>
                <p className="text-xs text-gray-500">
                  페르소나를 생성해보세요
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 하단 정보 */}
        {!isLoading && personas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              {selectedPersona ? (
                <span className="text-purple-600 font-medium">
                  {selectedPersona} 활성화됨
                </span>
              ) : (
                "페르소나를 선택하세요"
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}