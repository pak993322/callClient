"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MicOff, Video, VideoOff, Phone, MonitorSmartphone, Camera } from "lucide-react"

export default function CallInterface({ myStream, remoteStream, onEndCall, isAudioOnly = false, onToggleScreenShare }) {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isLocalStreamExpanded, setIsLocalStreamExpanded] = useState(false)

  const toggleLocalStreamExpansion = () => {
    setIsLocalStreamExpanded(!isLocalStreamExpanded)
  }

  // Call timer - only starts when both users are connected
  useEffect(() => {
    let timer

    if (remoteStream) {
      // Reset the timer when connection is established
      setCallDuration(0)

      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [remoteStream])

  // Format duration as mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && myStream) {
      localVideoRef.current.srcObject = myStream
    }
  }, [myStream])

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Toggle audio
  const toggleAudio = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled
      })
      setAudioEnabled(!audioEnabled)
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (myStream && !isAudioOnly) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled
      })
      setVideoEnabled(!videoEnabled)
    }
  }

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    const success = await onToggleScreenShare(!isScreenSharing)
    if (success) {
      setIsScreenSharing(!isScreenSharing)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {!isAudioOnly ? (
        <div id="video-container" className="relative w-full h-full flex-1 bg-slate-900 overflow-hidden">
          {/* Remote video */}
          {remoteStream && (
            <div
              className={`${
                isLocalStreamExpanded
                  ? "absolute bottom-4 right-4 w-1/4 md:w-1/5 aspect-video z-20"
                  : "absolute inset-0 w-full h-full"
              } bg-slate-800 overflow-hidden border-2 border-white shadow-lg`}
              onClick={(e) => {
                if (isLocalStreamExpanded) {
                  e.stopPropagation()
                  toggleLocalStreamExpansion()
                }
              }}
            >
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
          )}

          {/* Connecting state */}
          {!remoteStream && !isLocalStreamExpanded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p>Connecting...</p>
              </div>
            </div>
          )}

          {/* Call duration timer */}
          {remoteStream && (
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-mono z-30">
              {formatDuration(callDuration)}
            </div>
          )}

          {/* Local video */}
          <div
            onClick={toggleLocalStreamExpansion}
            className={`${
              isLocalStreamExpanded
                ? "absolute inset-0 z-30 w-full h-full"
                : "absolute bottom-4 right-4 w-1/4 md:w-1/5 aspect-video z-30"
            } bg-slate-800 rounded-xl overflow-hidden border-2 border-white shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer`}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!videoEnabled && !isAudioOnly ? "opacity-0" : ""}`}
            />
            {!videoEnabled && !isAudioOnly && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <VideoOff className="h-8 w-8 text-slate-400" />
              </div>
            )}
            {isLocalStreamExpanded && (
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
                Click to minimize
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 flex flex-col items-center justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-0 bg-emerald-500/40 rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-full mb-4 shadow-lg">
              <Phone className="h-12 w-12 text-white" />
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2 mt-4">Audio Call in Progress</h2>
          {remoteStream && (
            <p className="text-slate-500 dark:text-slate-400 mb-2 font-mono">{formatDuration(callDuration)}</p>
          )}

          {remoteStream ? (
            <audio ref={remoteVideoRef} autoPlay />
          ) : (
            <p className="text-slate-500 dark:text-slate-400">Connecting...</p>
          )}
          {myStream && <audio ref={localVideoRef} autoPlay muted />}
        </div>
      )}

      {/* Controls - positioned at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
        <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3">
          {!isAudioOnly && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${!audioEnabled ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
              >
                {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${!videoEnabled ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
              >
                {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleScreenShare}
                className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${isScreenSharing ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
              >
                {isScreenSharing ? <Camera className="h-5 w-5" /> : <MonitorSmartphone className="h-5 w-5" />}
              </Button>
            </>
          )}

          {isAudioOnly && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAudio}
              className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${!audioEnabled ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            onClick={onEndCall}
            className="w-12 h-12 rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
