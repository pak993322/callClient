"use client"

import { Button } from "@/components/ui/button"
import { Phone, PhoneOff } from "lucide-react"

export default function IncomingCall({ caller,callerName, isAudioOnly, onAccept, onDecline }) {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Incoming Call</h2>
        <p className="text-gray-700 mb-2">
          {isAudioOnly ? "Audio" : "Video"} call from: <span className="font-mono">{callerName}</span>
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="ghost" className="text-green-600" onClick={onAccept}>
            <Phone className="h-5 w-5 mr-2" />
            Accept
          </Button>
          <Button variant="ghost" className="text-red-600" onClick={onDecline}>
            <PhoneOff className="h-5 w-5 mr-2" />
            Decline
          </Button>
        </div>
      </div>
    </div>
  )
}
