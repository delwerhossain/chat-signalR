'use client'
import { useEffect, useState } from 'react'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PaperPlaneIcon, PlusCircledIcon } from '@radix-ui/react-icons'

export function ChatApp({ userId }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([]) // to store chat history
  const [connection, setConnection] = useState(null)

  // SignalR connection setup
  useEffect(() => {
    const connectSignalR = async () => {
      const newConnection = new HubConnectionBuilder()
        .withUrl('https://api-int.ctfdata.net/chatHub')
        .withAutomaticReconnect()
        .build()

      newConnection.on('ReceiveChatMessage', (message) => {
        setMessages((prevMessages) => [...prevMessages, message])
      })

      await newConnection.start()
      console.log('SignalR Connected')
      
      // Send user connection information
      await newConnection.invoke('OnConnectedUser', userId)
      
      setConnection(newConnection)
    }

    connectSignalR()

    return () => {
      if (connection) {
        connection.stop()
      }
    }
  }, [userId])

  // Handle sending a message
  const sendMessage = async () => {
    if (message.trim() === '' || !connection) return

    const newMessage = {
      id: new Date().getTime(),
      messageBody: message,
      senderUserId: userId,
      receiverUserId: 'receiver-user-id', // Replace with actual receiver ID
      sendAt: new Date(),
      isView: false,
    }

    await connection.invoke('SendMessage', newMessage)
    setMessages((prevMessages) => [...prevMessages, newMessage])
    setMessage('')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat UI Code Here */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderUserId === userId ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`max-w-[70%] ${msg.senderUserId === userId ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-lg p-3`}>
                <p className="text-sm">{msg.messageBody}</p>
                <p className="text-xs text-gray-400 mt-1">{msg.sendAt}</p>
              </div>
            </div>
          ))}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <PaperPlaneIcon className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
