'use client';
import { useState } from "react";
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { saveBotData } from "../discord/client";

export default function InputToken() {
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);
        const response = await saveBotData(formData);
        if (response) {
            console.log("Bot Data Saved Successfully");
        } else {
            console.log("Failed to save Bot Data", response);
        }
        alert("Bot Data Saved Successfully");
        setIsLoading(false);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Enter Discord Bot Token</CardTitle>
                <CardDescription>Please provide your Discord bot token to continue.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <label htmlFor="token">Token</label>
                            <Input id="token" name="token" placeholder="Enter your Discord bot token" required />
                            {/* <input id="token" name="token" placeholder="Enter your Discord bot token" required /> */}
                        </div>
                    </div>
                    <CardFooter className="flex justify-between mt-4 p-0">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin"/> : "Submit"}
                        </Button>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    )
}
