"use client"
import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { Button } from "@/components/ui/button"
import EnterInCall from "./call/EnterInCall"
import UserRegistration from "../components/user-registration"
import { Phone, Video, Users, User, PhoneForwarded } from "lucide-react"

export default function Page() {
  const [userId, setUserId] = useState("")
  const [users, setUsers] = useState([])
  const [socket, setSocket] = useState(null)
  const [callStatus, setCallStatus] = useState("idle")
  const [callUserFn, setCallUserFn] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [userData, setUserData] = useState({ id: "", name: "" })

  const handleRegistration = (userId, userName) => {
    setUserData({ id: userId, name: userName })
    setIsRegistered(true)
  }

  useEffect(() => {
    setUserId(userData)

    const newSocket = io("https://testcallbackend-production.up.railway.app")
    setSocket(newSocket)
    
    // Set the registration status to true

    return () => {
      newSocket.disconnect()
    }
  }, [userData])

  useEffect(() => {
    if (!socket || !userData.id) return

    // Register with both ID and name
    socket.emit("register", { userId: userData.id, userName: userData.name })

    socket.on("users", (onlineUsers) => {
      // Filter out current user
      setUsers(onlineUsers.filter((user) => user.id !== userData.id))
    })

    return () => {
      socket.off("users")
    }
  }, [socket, userData])
  console.log("Users:", users)

  const handleCallUser = (targetId, isAudioOnly = false) => {
    if (callUserFn) {
      callUserFn(targetId, isAudioOnly)
    } else {
      console.log("Call function not ready")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500">
            Connect<span className="text-slate-800 dark:text-white">Now</span>
          </h1>

          {!isRegistered ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-8 transition-all duration-300 hover:shadow-2xl">
              <UserRegistration onRegister={handleRegistration} />
            </div>
          ) : (
            <div className="grid md:grid-cols-[1fr_2fr] gap-6">
              {/* User Profile Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 h-fit">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{userData.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{userData.id}</p>
                    <div className="flex items-center mt-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">Online</span>
                    </div>
                  </div>
                </div>

                {/* Online Users Section */}
                {callStatus === "idle" && (
                  <div className="mt-6">
                    <div className="flex items-center mb-4">
                      <Users className="w-5 h-5 mr-2 text-slate-600 dark:text-slate-300" />
                      <h3 className="text-lg font-medium">Online Users</h3>
                    </div>

                    {users.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No users online</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {users.map((user) => (
                          <li
                            key={user.id}
                            className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[120px]">
                                    {user.id}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                              <Button
                                onClick={() => handleCallUser(user.id, true)}
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                              >
                                <Phone className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                                Audio
                              </Button>
                              <Button
                                onClick={() => handleCallUser(user.id, false)}
                                variant="default"
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all duration-200"
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Video
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                  <EnterInCall
                    socket={socket}
                    userId={userId.id}
                    setCallUserFunction={setCallUserFn}
                    callStatus={callStatus}
                    setCallStatus={setCallStatus}
                  />
                </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
