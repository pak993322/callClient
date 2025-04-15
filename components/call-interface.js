"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MicOff, Video, VideoOff, Phone, MonitorSmartphone, Camera } from "lucide-react"

export default function CallInterface({ myStream, remoteStream, onEndCall, isAudioOnly = false, onToggleScreenShare }) {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const videoContainerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)

  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  // Add a new state to track if local stream is expanded
  const [isLocalStreamExpanded, setIsLocalStreamExpanded] = useState(false)

  // Add a function to toggle local stream expansion
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

  // Handle mouse movement and clicks in fullscreen mode
  useEffect(() => {
    const handleMouseMove = () => {
      if (isFullScreen) {
        setShowControls(true)
        resetControlsTimeout()
      }
    }

    const handleClick = () => {
      if (isFullScreen) {
        setShowControls(true)
        resetControlsTimeout()
      }
    }

    const resetControlsTimeout = () => {
      // Clear any existing timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      // Set a new timeout to hide controls after 3 seconds of inactivity
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    // Only add event listeners when in fullscreen mode
    if (isFullScreen) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("click", handleClick)

      // Initialize the timeout
      resetControlsTimeout()
    } else {
      // Always show controls when not in fullscreen
      setShowControls(true)

      // Clear any existing timeout when exiting fullscreen
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = null
      }
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("click", handleClick)

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isFullScreen])

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

  const toggleFullScreen = () => {
    const videoContainer = videoContainerRef.current

    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen()
      } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen()
      } else if (videoContainer.msRequestFullscreen) {
        videoContainer.msRequestFullscreen()
      }
      setIsFullScreen(true)
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
      setIsFullScreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  // Detect mobile device and adjust video size
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      const localVideo = document.querySelector('[ref="localVideoRef"]')?.parentElement

      if (localVideo) {
        if (isMobile) {
          localVideo.style.width = "40%" // Larger on mobile
        } else {
          localVideo.style.width = isFullScreen ? "20%" : "25%"
        }
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize() // Initial call

    return () => window.removeEventListener("resize", handleResize)
  }, [isFullScreen])

  return (
    <div className="flex flex-col items-center">
      {!isAudioOnly ? (
        <div
          id="video-container"
          ref={videoContainerRef}
          className={`relative w-full max-w-4xl aspect-video bg-slate-900 rounded-2xl overflow-hidden mb-4 shadow-xl ${isFullScreen ? "fixed inset-0 z-50 max-w-none rounded-none" : ""}`}
        >
          {/* Remote video - add conditional rendering based on local stream expansion */}
          {remoteStream && (
  <div
    className={`${
      isLocalStreamExpanded
        ? "absolute bottom-2 left-2 w-1/4 md:w-1/5 aspect-video"
        : "block w-full h-full"
    } bg-slate-800 rounded-xl overflow-hidden border-2 border-white shadow-lg z-20`}
    onClick={(e) => {
      if (isLocalStreamExpanded) {
        e.stopPropagation();
        toggleLocalStreamExpansion();
      }
    }}
  >
    <video
      ref={remoteVideoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  </div>
)}

          {/* When local stream is expanded, show remote stream in small container */}
          {/* {remoteStream && isLocalStreamExpanded && (
            <div
              className="absolute bottom-2 left-2 w-1/4 md:w-1/5 aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-white shadow-lg z-20"
              onClick={(e) => {
                e.stopPropagation()
                toggleLocalStreamExpansion()
              }}
            >
              <video autoPlay playsInline className="w-full h-full object-cover" srcobject={remoteStream} />
            </div>
          )} */}

          {/* Modify the connecting state to respect local stream expansion */}
          {!remoteStream && !isLocalStreamExpanded && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p>Connecting...</p>
              </div>
            </div>
          )}

          {/* Call duration timer - only shown when both users are connected */}
          {remoteStream && (
            <div
              className={`absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-mono transition-opacity duration-300 ${isFullScreen && !showControls ? "opacity-0" : "opacity-100"}`}
            >
              {formatDuration(callDuration)}
            </div>
          )}

          {/* Local video */}
          <div
            onClick={toggleLocalStreamExpansion}
            className={`${
              isLocalStreamExpanded
                ? "absolute inset-0 z-10 w-full h-full"
                : `absolute bottom-2 right-2 ${isFullScreen ? "w-1/3 md:w-1/5" : "w-1/4 md:w-1/4 sm:w-1/3"}`
            } aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-white shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer`}
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

          {/* Fullscreen controls overlay */}
          {isFullScreen && (
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
              style={{ pointerEvents: showControls ? "auto" : "none" }}
            >
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${!audioEnabled ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"}`}
                >
                  {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${!videoEnabled ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"}`}
                >
                  {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleScreenShare}
                  className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${isScreenSharing ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : "bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"}`}
                >
                  {isScreenSharing ? <Camera className="h-5 w-5" /> : <MonitorSmartphone className="h-5 w-5" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullScreen}
                  className="w-12 h-12 rounded-full shadow-md transition-all duration-200 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                    <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={onEndCall}
                  className="w-12 h-12 rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-red-600 hover:bg-red-700"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>

              <p className="text-xs text-white/80 text-center mt-2">
                {isAudioOnly ? "Audio call" : "Video call"} • {formatDuration(callDuration)}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 mb-4 flex flex-col items-center justify-center shadow-xl min-h-[300px]">
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

      {/* Only show these controls when NOT in fullscreen mode */}
      {!isFullScreen && !isAudioOnly && (
        <div className="flex flex-wrap justify-center gap-3 mt-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${!audioEnabled ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-white dark:bg-slate-800"}`}
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${!videoEnabled ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-white dark:bg-slate-800"}`}
          >
            {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${isScreenSharing ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : "bg-white dark:bg-slate-800"}`}
          >
            {isScreenSharing ? <Camera className="h-5 w-5" /> : <MonitorSmartphone className="h-5 w-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullScreen}
            className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${isFullScreen ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : "bg-white dark:bg-slate-800"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={onEndCall}
            className="w-12 h-12 rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Only show this footer when NOT in fullscreen mode */}
      {!isFullScreen && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
          {isAudioOnly ? "Audio call" : "Video call"}
          {remoteStream && ` • ${formatDuration(callDuration)}`}
        </p>
      )}

      {/* Audio-only controls */}
      {isAudioOnly && (
        <div className="flex flex-wrap justify-center gap-3 mt-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full shadow-md transition-all duration-200 ${!audioEnabled ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-white dark:bg-slate-800"}`}
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={onEndCall}
            className="w-12 h-12 rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
