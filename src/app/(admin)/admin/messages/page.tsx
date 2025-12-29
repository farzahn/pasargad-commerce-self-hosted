'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Mail, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { getPocketBaseClient } from '@/lib/pocketbase'
import type { ContactMessage } from '@/types/pocketbase'

export default function AdminMessagesPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null
  )

  useEffect(() => {
    async function fetchMessages() {
      try {
        const pb = getPocketBaseClient()
        const result = await pb
          .collection('messages')
          .getList<ContactMessage>(1, 500, {
            sort: '-id',
          })
        setMessages(result.items)
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [])

  const markAsRead = async (message: ContactMessage) => {
    try {
      const pb = getPocketBaseClient()
      await pb.collection('messages').update(message.id, { isRead: true })
      setMessages(
        messages.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const archiveMessage = async (messageId: string) => {
    try {
      const pb = getPocketBaseClient()
      await pb.collection('messages').update(messageId, { isArchived: true })
      setMessages(
        messages.map((m) =>
          m.id === messageId ? { ...m, isArchived: true } : m
        )
      )
      setSelectedMessage(null)
      toast({
        title: 'Message archived',
      })
    } catch (error) {
      console.error('Error archiving message:', error)
      toast({
        title: 'Error',
        description: 'Failed to archive message',
        variant: 'destructive',
      })
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      const pb = getPocketBaseClient()
      await pb.collection('messages').delete(messageId)
      setMessages(messages.filter((m) => m.id !== messageId))
      setSelectedMessage(null)
      toast({
        title: 'Message deleted',
      })
    } catch (error) {
      console.error('Error deleting message:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      })
    }
  }

  const openMessage = (message: ContactMessage) => {
    setSelectedMessage(message)
    if (!message.isRead) {
      markAsRead(message)
    }
  }

  const activeMessages = messages.filter((m) => !m.isArchived)
  const unreadCount = activeMessages.filter((m) => !m.isRead).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          {unreadCount > 0 && (
            <p className="text-muted-foreground">
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {activeMessages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages"
          description="Contact form submissions will appear here"
        />
      ) : (
        <div className="space-y-4">
          {activeMessages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                !message.isRead ? 'border-primary' : ''
              }`}
              onClick={() => openMessage(message)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{message.name}</p>
                      {!message.isRead && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {message.email}
                    </p>
                    <p className="mt-1 font-medium">{message.subject}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {message.message}
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-muted-foreground">
                    {formatDate(message.created)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Message Detail Dialog */}
      <Dialog
        open={!!selectedMessage}
        onOpenChange={() => setSelectedMessage(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMessage.subject}</DialogTitle>
                <DialogDescription>
                  From: {selectedMessage.name} ({selectedMessage.email})
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="py-4">
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <Separator />
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Received: {formatDate(selectedMessage.created)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archiveMessage(selectedMessage.id)}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${selectedMessage.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Reply
                    </a>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMessage(selectedMessage.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
