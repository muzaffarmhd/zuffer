import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { checkIfSaved } from "@/discord/client"
import { getBotData } from "@/discord/client";
export default async function Configure() {
  const isConfigured = await checkIfSaved();
  const { displayName, avatarURL, description } = await getBotData();
  return (
    <div className="w-full flex flex-col p-24 items-center justify-center text-white">
      {isConfigured ? (
        
        <div className="flex justify-center flex-col items-center max-w-lg">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarURL || "/placeholder.svg?height=48&width=48"} alt="Bot Avatar" />
            <AvatarFallback>BOT</AvatarFallback>
          </Avatar>
          <h1 className="font-bold">
            {displayName}
          </h1>
          <p className="text-sm text-center text-blue-100 m-10">{description}</p>
          Bot is already configured.{" "}
          <Link className="text-blue-400" href="/configure/edit">
            Edit configuration here
          </Link>
        </div>
      ) : (
        <div className="max-w-lg">
          Configure your bot{" "}
          <Link className="text-blue-400" href="/configure/edit">
            here
          </Link>.
        </div>
      )}
    </div>
  );
}


