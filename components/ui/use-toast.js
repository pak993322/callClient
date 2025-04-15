"use client"

import { createContext, useContext, useState } from "react"

const ToastContext = createContext({
  toast: () => {},
  toasts: [],
  dismissToast: () => {},
})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = "default" }) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description, variant }])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(id)
    }, 5000)

    return id
  }

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast, toasts, dismissToast }}>
      {children}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-md shadow-md max-w-md transform transition-all duration-300 ease-in-out ${
              toast.variant === "destructive"
                ? "bg-red-100 border-l-4 border-red-500"
                : "bg-white"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3
                  className={`font-medium ${
                    toast.variant === "destructive"
                      ? "text-red-800"
                      : "text-gray-900"
                  }`}
                >
                  {toast.title}
                </h3>
                {toast.description && (
                  <p
                    className={`text-sm mt-1 ${
                      toast.variant === "destructive"
                        ? "text-red-700"
                        : "text-gray-500"
                    }`}
                  >
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
