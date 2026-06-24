"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface Message {
  id: string;
  body: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  partner: Contact;
  lastMessage: { body: string; createdAt: string } | null;
  unread: number;
}

export default function ChatClient({
  currentUser,
  contacts,
}: {
  currentUser: { id: string; name: string; role: string };
  contacts: Contact[];
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/chat");
    if (res.ok) setConversations(await res.json());
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (partnerId: string) => {
    setLoadingMsgs(true);
    const res = await fetch(`/api/chat/${partnerId}`);
    if (res.ok) setMessages(await res.json());
    setLoadingMsgs(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    if (!active) return;
    fetchMessages(active.id);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMessages(active.id), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [active, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openConversation(contact: Contact) {
    setActive(contact);
    setMessages([]);
    setConversations((prev) =>
      prev.map((c) => c.partner.id === contact.id ? { ...c, unread: 0 } : c)
    );
  }

  async function send() {
    if (!active || !draft.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/chat/${active.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setDraft("");
      fetchConversations();
    }
    setSending(false);
  }

  // Merge contacts + existing conversation partners
  const contactIds = new Set(contacts.map((c) => c.id));
  const conversationContacts = conversations
    .map((c) => c.partner)
    .filter((p) => !contactIds.has(p.id));
  const allContacts = [...contacts, ...conversationContacts];

  function getConversation(id: string) {
    return conversations.find((c) => c.partner.id === id);
  }

  function timeLabel(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }

  return (
    <div className="flex h-full">
      {/* Sidebar contacts */}
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Сообщения</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {allContacts.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">
              Нет доступных контактов
            </div>
          )}
          {allContacts.map((contact) => {
            const conv = getConversation(contact.id);
            const isActive = active?.id === contact.id;
            return (
              <button
                key={contact.id}
                onClick={() => openConversation(contact)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-slate-50 transition-colors ${isActive ? "bg-indigo-50" : "hover:bg-slate-50"}`}
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-indigo-700">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800 truncate">{contact.name}</p>
                    {conv?.lastMessage && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                        {timeLabel(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[contact.role] || ""}`}>
                      {ROLE_LABELS[contact.role] || contact.role}
                    </span>
                    {conv?.lastMessage && (
                      <p className="text-xs text-slate-400 truncate">{conv.lastMessage.body}</p>
                    )}
                  </div>
                </div>
                {conv && conv.unread > 0 && (
                  <span className="w-5 h-5 bg-indigo-500 text-white text-[10px] rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    {conv.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">Выберите контакт</p>
              <p className="text-slate-400 text-sm mt-1">для начала переписки</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-700">
                  {active.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{active.name}</p>
                <p className="text-xs text-slate-400">{active.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingMsgs && (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {msg.body}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 px-1">
                        {timeLabel(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && !loadingMsgs && (
                <div className="text-center py-12 text-sm text-slate-400">
                  Начните переписку с {active.name}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 p-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={`Написать ${active.name}...`}
                  rows={1}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-32"
                  style={{ minHeight: "40px" }}
                />
                <button
                  onClick={send}
                  disabled={sending || !draft.trim()}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 px-1">Enter — отправить, Shift+Enter — новая строка</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
