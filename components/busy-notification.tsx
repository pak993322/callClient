"use client"

import { useEffect, useState } from "react"
import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BusyNotificationProps {
  visible: boolean
  onClose: () => void
}

export default function BusyNotification({ visible, onClose }: BusyNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsVisible(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!isVisible) return null

  return (
    <Alert className="fixed top-4 right-4 max-w-md z-50 bg-white dark:bg-slate-800 border-red-200 dark:border-red-800 shadow-lg animate-in slide-in-from-top-5">
      <AlertCircle className="h-5 w-5 text-red-500" />
      <div className="flex-1">
        <AlertTitle className="text-red-500">User Busy</AlertTitle>
        <AlertDescription>
          The user you're trying to call is currently in another call. Please try again later.
        </AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => {
          setIsVisible(false)
          onClose()
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}
