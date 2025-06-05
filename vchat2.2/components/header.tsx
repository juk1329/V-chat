"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageCircle, UserPlus, LogOut, Bot, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  currentMode: "chat" | "create"
  onModeChange: (mode: "chat" | "create") => void
  selectedPersona: string
}

export default function Header({ currentMode, onModeChange, selectedPersona }: HeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="flex items-center justify-between">
        {/* 로고 및 브랜드 */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              VChat
            </h1>
          </div>

          {/* 모드 전환 버튼 */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={currentMode === "chat" ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange("chat")}
              className={`flex items-center space-x-2 transition-all ${
                currentMode === "chat" 
                  ? "bg-white shadow-sm" 
                  : "hover:bg-gray-200"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>채팅</span>
            </Button>

            <Button
              variant={currentMode === "create" ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange("create")}
              className={`flex items-center space-x-2 transition-all ${
                currentMode === "create" 
                  ? "bg-white shadow-sm" 
                  : "hover:bg-gray-200"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>페르소나 생성</span>
            </Button>
          </div>
        </div>

        {/* 우측 정보 및 메뉴 */}
        <div className="flex items-center space-x-4">
          {/* 현재 페르소나 표시 */}
          {selectedPersona && currentMode === "chat" && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">현재 페르소나:</span>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {selectedPersona}
              </Badge>
            </div>
          )}

          {/* 모드 상태 표시 */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {currentMode === "chat" ? "채팅 모드" : "페르소나 생성 모드"}
            </span>
          </div>

          {/* 사용자 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {user?.email?.[0].toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user?.displayName || "사용자"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>로그아웃</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}