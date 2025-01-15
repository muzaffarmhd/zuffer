'use client'

import { useState } from 'react'
import { saveToken } from '@/app/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function InputForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = await saveToken(formData)
    setIsLoading(false)
    toast({
      title: result.success ? "Success" : "Error",
      description: result.message,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Discord Bot Token</CardTitle>
        <CardDescription>Please provide your Discord bot token to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="token">Token</Label>
              <Input id="token" name="token" placeholder="Enter your Discord bot token" required />
            </div>
          </div>
          <CardFooter className="flex justify-between mt-4 p-0">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}

