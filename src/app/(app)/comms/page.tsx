'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn, relativeTime } from '@/lib/utils'
import type { Channel, Message } from '@/types/database'

export default function CommsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!client) return
      setClientId(client.id)

      const { data: chs } = await supabase
        .from('channels')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at')

      if (chs) {
        setChannels(chs)
        setActiveChannel(chs[0] ?? null)
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!activeChannel) return
    fetchMessages()

    const sub = supabase
      .channel(`messages:${activeChannel.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannel.id}` },
        fetchMessages
      )
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [activeChannel?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    if (!activeChannel) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', activeChannel.id)
      .is('deleted_at', null)
      .order('created_at')
    setMessages(data ?? [])
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel || !userId) return
    setSending(true)

    await supabase.from('messages').insert({
      channel_id: activeChannel.id,
      author_id: userId,
      body: newMessage.trim(),
      reply_to_message_id: replyTo?.id ?? null,
    })

    setNewMessage('')
    setReplyTo(null)
    setSending(false)
  }

  async function deleteMessage(id: string) {
    await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    await fetchMessages()
  }

  async function saveEdit(id: string) {
    if (!editBody.trim()) return
    await supabase
      .from('messages')
      .update({ body: editBody.trim(), edited_at: new Date().toISOString() })
      .eq('id', id)
    setEditingId(null)
    await fetchMessages()
  }

  async function createChannel() {
    if (!newChannelName.trim() || !clientId || !userId) return
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, '-')
    const { data } = await supabase
      .from('channels')
      .insert({ client_id: clientId, name: `#${name}`, created_by: userId })
      .select()
      .single()
    if (data) {
      setChannels((c) => [...c, data])
      setActiveChannel(data)
    }
    setNewChannelName('')
    setShowNewChannel(false)
  }

  const getReplyMessage = (id: string) => messages.find((m) => m.id === id)

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-[24px] overflow-hidden border border-border-default bg-panel">
      {/* Channel list */}
      <div className="w-[220px] shrink-0 bg-panel-2 border-r border-border-default flex flex-col">
        <div className="px-4 py-4 border-b border-border-default">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint">
            Channels
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {channels.length === 0 ? (
            <p className="px-4 py-3 text-text-faint text-[12.5px]">No channels yet.</p>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch)}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-[13.5px] transition-colors duration-100 rounded-lg mx-1',
                  activeChannel?.id === ch.id
                    ? 'text-text bg-purple/10'
                    : 'text-text-dim hover:text-text hover:bg-white/4'
                )}
              >
                {ch.name}
              </button>
            ))
          )}
        </div>

        {/* New channel */}
        <div className="p-3 border-t border-border-default">
          {showNewChannel ? (
            <div className="flex gap-1">
              <input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createChannel()}
                placeholder="channel-name"
                autoFocus
                className="flex-1 text-[12.5px] bg-panel border border-border-default rounded-lg px-2 py-1.5 text-text placeholder:text-text-faint focus:outline-none focus:border-purple-soft"
              />
              <button onClick={createChannel} className="text-purple text-[12px] px-1.5">✓</button>
              <button onClick={() => setShowNewChannel(false)} className="text-text-faint text-[12px] px-1">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewChannel(true)}
              className="w-full text-left text-[12.5px] text-text-faint hover:text-text-dim transition-colors px-1 py-1"
            >
              + New channel
            </button>
          )}
        </div>
      </div>

      {/* Chat pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        {activeChannel && (
          <div className="px-5 py-3.5 border-b border-border-default">
            <p className="text-[15px] font-semibold text-text">{activeChannel.name}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <p className="text-text-faint text-[13.5px]">
                No messages yet — say something.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.author_id === userId
              const replyMsg = msg.reply_to_message_id ? getReplyMessage(msg.reply_to_message_id) : null
              const isHovered = hoveredId === msg.id
              const isEditing = editingId === msg.id

              return (
                <div
                  key={msg.id}
                  className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                  onMouseEnter={() => setHoveredId(msg.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className={cn('max-w-[70%] group relative', isMine ? 'items-end' : 'items-start')}>
                    {/* Reply preview */}
                    {replyMsg && (
                      <div className={cn(
                        'text-[11.5px] text-text-faint border-l-2 border-purple/50 pl-2 mb-1.5 truncate',
                        isMine ? 'text-right' : ''
                      )}>
                        {replyMsg.body.slice(0, 60)}{replyMsg.body.length > 60 ? '…' : ''}
                      </div>
                    )}

                    {/* Bubble */}
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(msg.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                          className="flex-1 text-[13.5px] bg-panel-2 border border-purple-soft rounded-xl px-3 py-1.5 text-text focus:outline-none"
                        />
                        <button onClick={() => saveEdit(msg.id)} className="text-purple text-[12px]">✓</button>
                        <button onClick={() => setEditingId(null)} className="text-text-faint text-[12px]">✕</button>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'px-4 py-2.5 rounded-[16px] text-[13.5px] leading-relaxed',
                          isMine
                            ? 'text-white rounded-br-[4px]'
                            : 'text-text bg-panel-2 border border-border-default rounded-bl-[4px]'
                        )}
                        style={isMine ? {
                          background: 'linear-gradient(135deg, #1DD9C5, #0CBCAA)',
                        } : undefined}
                      >
                        {msg.body}
                        {msg.edited_at && (
                          <span className="ml-2 text-[11px] opacity-60">(edited)</span>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className={cn(
                      'text-[11px] text-text-faint mt-1',
                      isMine ? 'text-right' : ''
                    )}>
                      {relativeTime(msg.created_at)}
                    </p>

                    {/* Hover actions */}
                    {isHovered && !isEditing && (
                      <div className={cn(
                        'absolute -top-6 flex gap-1 bg-panel-2 border border-border-default rounded-pill px-2 py-1 shadow-lg text-[11px]',
                        isMine ? 'right-0' : 'left-0'
                      )}>
                        <button
                          onClick={() => setReplyTo(msg)}
                          className="text-text-faint hover:text-text px-1 transition-colors"
                        >
                          Reply
                        </button>
                        {isMine && (
                          <>
                            <button
                              onClick={() => { setEditingId(msg.id); setEditBody(msg.body) }}
                              className="text-text-faint hover:text-text px-1 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="text-red/70 hover:text-red px-1 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Compose */}
        <div className="px-5 py-4 border-t border-border-default">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-[12px] text-text-faint border-l-2 border-purple/50 pl-2">
              <span className="truncate">Replying: {replyTo.body.slice(0, 60)}</span>
              <button onClick={() => setReplyTo(null)} className="ml-auto text-text-faint hover:text-red">✕</button>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={activeChannel ? `Message ${activeChannel.name}` : 'Select a channel'}
              disabled={!activeChannel}
              className="flex-1 bg-panel-2 border border-border-default rounded-pill px-5 py-2.5 text-[13.5px] text-text placeholder:text-text-faint focus:outline-none focus:border-purple-soft transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-5 py-2.5 rounded-pill text-[13.5px] font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg, #1DD9C5, #0CBCAA)' }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
