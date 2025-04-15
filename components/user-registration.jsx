import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

export default function UserRegistration({ onRegister }) {
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!userName.trim()) {
      return
    }

    setIsLoading(true)

    // Generate a random ID
    const randomId = Math.floor(Math.random() * 1000000).toString()

    // Simulate a slight delay for better UX
    setTimeout(() => {
      onRegister(randomId, userName)
      setIsLoading(false)
    }, 500)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Register to Join
        </CardTitle>
        <CardDescription>Enter your name to join the video call application</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !userName.trim()}>
            {isLoading ? "Registering..." : "Register"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
