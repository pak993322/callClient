"use client"
import { useEffect, useState, useRef } from "react"
import Peer from "simple-peer"
import CallInterface from "@/components/call-interface"
import IncomingCall from "@/components/incoming-call"
import { Button } from "@/components/ui/button"

export default function EnterInCall({ socket, userId, setCallUserFunction, callStatus, setCallStatus, onUserBusy }) {
  const [myStream, setMyStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [peer, setPeer] = useState(null)
  const [callerInfo, setCallerInfo] = useState(null)
  const [targetUserId, setTargetUserId] = useState("")
  const [isAudioOnly, setIsAudioOnly] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const ringtoneRef = useRef(null)

  useEffect(() => {
    // Initialize the audio element
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio("/slack.mp3")
      ringtoneRef.current.loop = true
    }

    // Play ringtone when call status is incoming
    if (callStatus === "incoming") {
      ringtoneRef.current.play().catch((err) => console.error("Error playing ringtone:", err))
    } else {
      // Stop ringtone when call status is not incoming
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }

    // Cleanup function to stop audio when component unmounts
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }
    }
  }, [callStatus])

  const stopMediaStream = () => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop())
      setMyStream(null)
    }
    if (cameraStream && cameraStream !== myStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
  }

  const getMediaStream = async (audioOnly = false) => {
    try {
      const constraints = audioOnly ? { video: false, audio: true } : { video: true, audio: true }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setMyStream(stream)
      setCameraStream(stream)
      return stream
    } catch (err) {
      console.error("Failed to get media:", err)
      return null
    }
  }

  const toggleScreenShare = async (enableScreenShare) => {
    try {
      // If we're already in a call
      if (peer && myStream) {
        // If enabling screen share
        if (enableScreenShare) {
          // Check if screen sharing is supported
          if (!navigator.mediaDevices.getDisplayMedia) {
            alert("Screen sharing is not supported in your browser")
            return false
          }

          // Get screen sharing stream
          const screenStream = await navigator.mediaDevices
            .getDisplayMedia({
              video: true,
              audio: true,
            })
            .catch((err) => {
              console.error("Error getting screen share:", err)
              return null
            })

          if (!screenStream) return false

          // Save camera stream if we haven't already
          if (!cameraStream) {
            setCameraStream(myStream)
          }

          // Replace tracks in the peer connection
          const videoTrack = screenStream.getVideoTracks()[0]

          // Get all senders from the peer connection
          const senders = peer._pc.getSenders()

          // Find the video sender
          const videoSender = senders.find((sender) => sender.track && sender.track.kind === "video")

          if (videoSender) {
            videoSender.replaceTrack(videoTrack)
          }

          // Handle when user stops screen sharing via the browser UI
          videoTrack.addEventListener("ended", () => {
            toggleScreenShare(false)
          })

          // Update current stream
          setMyStream(screenStream)
          setIsScreenSharing(true)
          return true
        }
        // If disabling screen share, switch back to camera
        else if (cameraStream) {
          // Stop current screen sharing tracks
          myStream.getVideoTracks().forEach((track) => track.stop())

          // Get the video track from camera stream
          const videoTrack = cameraStream.getVideoTracks()[0]

          if (videoTrack && peer._pc) {
            // Find the video sender
            const senders = peer._pc.getSenders()
            const videoSender = senders.find((sender) => sender.track && sender.track.kind === "video")

            if (videoSender) {
              videoSender.replaceTrack(videoTrack)
            }
          }

          // Update current stream
          setMyStream(cameraStream)
          setIsScreenSharing(false)
          return true
        }
      }
      return false
    } catch (err) {
      console.error("Error toggling screen share:", err)
      return false
    }
  }

  useEffect(() => {
    if (!socket) return

    socket.on("incomingCall", async ({ from, callerName, signal, isAudioOnly = false }) => {
      setCallerInfo({ from, signal, callerName, isAudioOnly })
      console.log("calllller", callerName)
      setIsAudioOnly(isAudioOnly)
      setCallStatus("incoming")
    })

    socket.on("callAccepted", ({ signal }) => {
      peer?.signal(signal)
      setCallStatus("connected")
    })

    socket.on("callDeclined", () => {
      peer?.destroy()
      setPeer(null)
      setCallStatus("idle")
      stopMediaStream()
    })

    socket.on("callEnded", () => {
      peer?.destroy()
      setPeer(null)
      setRemoteStream(null)
      setCallStatus("idle")
      stopMediaStream()
    })

    socket.on("userBusy", () => {
      console.log("User is busy")
      // Clean up any call attempt
      if (peer) {
        peer.destroy()
        setPeer(null)
      }
      stopMediaStream()
      setCallStatus("idle")

      // Notify the parent component to show the busy notification
      if (onUserBusy) {
        onUserBusy(targetUserId)
      }
    })

    return () => {
      socket.off("incomingCall")
      socket.off("callAccepted")
      socket.off("callDeclined")
      socket.off("callEnded")
      socket.off("userBusy")
    }
  }, [socket, peer, onUserBusy, targetUserId])

  useEffect(() => {
    const callUser = async (targetId, audioOnly = false) => {
      console.log("Calling user:", targetId, "userId", userId, "Audio only:", audioOnly)
      const stream = await getMediaStream(audioOnly)
      if (!stream) return

      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      })

      newPeer.on("signal", (signal) => {
        socket.emit("callUser", { to: targetId, from: userId, signal, isAudioOnly: audioOnly })
      })

      newPeer.on("stream", (stream) => {
        setRemoteStream(stream)
      })

      newPeer.on("close", () => {
        setCallStatus("idle")
        setRemoteStream(null)
      })

      newPeer.on("error", (err) => {
        console.error("Peer error: ", err)
        setCallStatus("idle")
      })

      setMyStream(stream)
      setPeer(newPeer)
      setCallStatus("calling")
      setTargetUserId(targetId)
      setIsAudioOnly(audioOnly)
    }

    setCallUserFunction(() => callUser)
  }, [socket, userId, setCallUserFunction])

  const acceptCall = async () => {
    if (!callerInfo) return
    const stream = await getMediaStream(callerInfo.isAudioOnly)
    if (!stream) return

    // Stop ringtone when call is accepted
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }

    const newPeer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    })

    newPeer.on("signal", (signal) => {
      socket.emit("acceptCall", { to: callerInfo.from, signal })
    })

    newPeer.on("stream", (stream) => {
      setRemoteStream(stream)
    })

    newPeer.on("close", () => {
      setCallStatus("idle")
      setRemoteStream(null)
    })

    newPeer.on("error", (err) => {
      console.error("Peer error: ", err)
      setCallStatus("idle")
    })

    newPeer.signal(callerInfo.signal)
    setMyStream(stream)
    setPeer(newPeer)
    setCallStatus("connected")
    setTargetUserId(callerInfo.from)
  }

  const declineCall = () => {
    if (!callerInfo) return

    // Stop ringtone when call is declined
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }

    socket.emit("declineCall", { to: callerInfo.from })
    setCallStatus("idle")
    setCallerInfo(null)
    stopMediaStream()
  }

  const endCall = () => {
    if (peer) peer.destroy()
    socket.emit("endCall", { to: targetUserId })
    setCallStatus("idle")
    setRemoteStream(null)
    setPeer(null)
    setMyStream(null)
    stopMediaStream()
  }

  const [showCallInterface, setShowCallInterface] = useState(false);
  const [showCallingText, setShowCallingText] = useState(false);

  useEffect(() => {
    if (callStatus === "calling") {
      setShowCallingText(true);
      const timer = setTimeout(() => {
        setShowCallingText(false);
      }, 5000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [callStatus]);
  useEffect(() => {
    let timeout;
    if (callStatus === "connected" || callStatus === "calling") {
      timeout = setTimeout(() => {
        setShowCallInterface(true);
      }, 5000); // 3 seconds delay
    } else {
      setShowCallInterface(false);
    }

    return () => clearTimeout(timeout); // Cleanup on unmount or callStatus change
  }, [callStatus]);
  return (
    <div>
      {callStatus === "incoming" && (
        <IncomingCall
          caller={callerInfo.from}
          callerName={callerInfo.callerName}
          isAudioOnly={callerInfo.isAudioOnly}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}
      {callStatus === "calling" && showCallInterface && (
        <div className="text-center p-4 border rounded-lg mb-4">
          <p>
            {isAudioOnly ? "Audio calling" : "Video calling"} user:
            <span className="font-mono ml-1">{targetUserId}</span>
          </p>
          <Button variant="destructive" onClick={endCall}>
            Cancel Call
          </Button>
        </div>
      )}
      {callStatus === "calling" && showCallingText && (
        <h1>Calling...</h1>
      )}
      {callStatus === "calling" && showCallInterface && (
        <CallInterface
          myStream={myStream}
          remoteStream={remoteStream}
          onEndCall={endCall}
          isAudioOnly={isAudioOnly}
          onToggleScreenShare={toggleScreenShare}
        />
      )}

      {callStatus === "connected" && (
        <CallInterface
          myStream={myStream}
          remoteStream={remoteStream}
          onEndCall={endCall}
          isAudioOnly={isAudioOnly}
          onToggleScreenShare={toggleScreenShare}
        />
      )}

    </div>
  )
}
