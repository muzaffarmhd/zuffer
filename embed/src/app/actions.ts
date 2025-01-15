'use server'
import { BotLogin, GetAvatarAndDescription } from '@/discord/client';
import fs from 'fs/promises';
import path from 'path';

export async function getBotData(providedToken?: string) {
    const token = providedToken || process.env.DISCORD_TOKEN?.trim();
    const hasToken = !!token;
    let botData = { displayName:'', avatarURL: '', description: '' };

    if (hasToken) {
        try {
            const filePath = path.join(process.cwd(), 'src/data/bot_data.json');
            const fileContent = await fs.readFile(filePath, 'utf-8');
            botData = JSON.parse(fileContent);
            await BotLogin();
        } catch (error) {
            console.error('Error in getBotData:', error);
        }
    }

    return { hasToken, botData };
}

export async function saveToken(formData: FormData) {
    try {
        const token = formData.get('token')?.toString().trim();
        
        if (!token) {
            return { success: false, message: 'Token is required' };
        }
        await fs.writeFile('.env.local', `DISCORD_TOKEN="${token}"\n`);
        await BotLogin(token);
        return { success: true, message: 'Token saved and verified successfully' };
    } catch (error) {
        console.error('Error in saveToken:', error);
        return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to save token' 
        };
    }
}