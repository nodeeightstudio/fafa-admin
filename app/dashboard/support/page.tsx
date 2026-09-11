"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"

import { supabase, getAdminRecord, AdminUser } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

interface SupportConversation {
  id: string
  institution_id: string
  user_id: string
  status: "open" | "closed"
  created_at: string
  updated_at: string
  institution?: {
    id: string
    name: string
  } | null
}

interface SupportMessage {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_admin_id: string | null
  message: string
  created_at: string
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function SupportInboxPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  )

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("institution_support_conversations")
      .select(
        `
        *,
        institution:institutions(id, name)
      `
      )
      .order("updated_at", { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as SupportConversation[]
    setConversations(rows)
    setSelectedId((current) => current ?? rows[0]?.id ?? null)
  }

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("institution_support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) throw error
    setMessages((data ?? []) as SupportMessage[])
  }

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const adminRecord = await getAdminRecord()
      if (!adminRecord) {
        toast.error("Access denied. Admin privileges required.")
        router.push("/login")
        return
      }

      setAdmin(adminRecord)

      try {
        await fetchConversations()
      } catch (error: any) {
        toast.error(error.message || "Failed to load support conversations")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }

    fetchMessages(selectedId).catch((error) => {
      toast.error(error.message || "Failed to load messages")
    })
  }, [selectedId])

  useEffect(() => {
    if (!admin) return

    const channelName = `admin_institution_support:${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "institution_support_conversations" },
        () => fetchConversations().catch(() => undefined)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "institution_support_messages" },
        (payload) => {
          const newMessage = payload.new as SupportMessage
          if (newMessage.conversation_id === selectedId) {
            fetchMessages(selectedId).catch(() => undefined)
          }
          fetchConversations().catch(() => undefined)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [admin, selectedId])

  const sendMessage = async () => {
    if (!admin || !selectedId || !messageText.trim() || sending) return

    const text = messageText.trim()
    setSending(true)
    setMessageText("")

    const { error } = await supabase.from("institution_support_messages").insert({
      conversation_id: selectedId,
      sender_admin_id: admin.id,
      message: text,
    })

    if (error) {
      setMessageText(text)
      toast.error(error.message || "Failed to send message")
    } else {
      await fetchMessages(selectedId)
      await fetchConversations()
    }

    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-[560px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Support Inbox</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institution Support</h1>
          <p className="text-muted-foreground">
            View and reply to anon support conversations for your institution.
          </p>
        </div>

        <div className="grid min-h-[620px] gap-4 lg:grid-cols-[360px_1fr]">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4" />
                Conversations
              </CardTitle>
              <CardDescription>{conversations.length} open thread(s)</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[540px] overflow-y-auto p-0">
              {conversations.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No institution support conversations yet.
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={`w-full border-b px-4 py-4 text-left transition-colors hover:bg-muted/60 ${
                      selectedId === conversation.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">Anon</div>
                      <Badge variant="secondary">{conversation.status}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {conversation.institution?.name ?? "Institution"}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Updated {formatTime(conversation.updated_at)}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[620px]">
            <CardHeader className="border-b">
              <CardTitle>
                {selectedConversation ? "Anon conversation" : "Select a conversation"}
              </CardTitle>
              <CardDescription>
                {selectedConversation?.institution?.name ??
                  "Choose a thread from the support inbox."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-[500px] flex-col gap-4">
              {!selectedConversation ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  No conversation selected.
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-4">
                    {messages.length === 0 ? (
                      <div className="py-20 text-center text-sm text-muted-foreground">
                        No messages yet.
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isAnon = message.sender_id === selectedConversation.user_id
                        const isAdmin = message.sender_admin_id === admin?.id

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isAnon ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                                isAnon
                                  ? "bg-background text-foreground"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <div
                                className={`mb-1 text-[11px] font-semibold uppercase ${
                                  isAnon
                                    ? "text-muted-foreground"
                                    : "text-primary-foreground/80"
                                }`}
                              >
                                {isAnon ? "Anon" : isAdmin ? "You" : "Institution Admin"}
                              </div>
                              <div>{message.message}</div>
                              <div
                                className={`mt-1 text-[11px] ${
                                  isAnon
                                    ? "text-muted-foreground"
                                    : "text-primary-foreground/70"
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Reply as institution admin..."
                      className="min-h-12 flex-1 resize-none"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!messageText.trim() || sending}
                      className="h-auto self-stretch"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
