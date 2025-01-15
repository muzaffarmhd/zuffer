import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface BotInfoProps {
  displayName: string
  avatar: string
  description: string
}

export default function BotInfo({ displayName, avatar, description }: BotInfoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar || '/placeholder.svg?height=48&width=48'} alt="Bot Avatar" />
            <AvatarFallback>BOT</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{displayName}</CardTitle>
            <CardDescription>Bot Information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}