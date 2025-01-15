"use server";
import { Client, Events, GatewayIntentBits } from 'discord.js';
import fs from 'fs';

const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
];

const client = new Client({ intents });

export async function saveBotData (formData) {
    try {
        const token = formData.get('token')?.toString().trim();
        fs.writeFileSync('.env.local', `DISCORD_TOKEN="${token}"\n`);
        await client.login(token);
        const displayName = client.user.tag;
        const avatarURL = client.user.displayAvatarURL({
            format: 'webp',
            dynamic: true,
            size: 1024
        });
        await client.application?.fetch();
        const description = client.application?.description || 'No description provided!';
        fs.writeFileSync('src/data/bot_data.json', JSON.stringify({ displayName, avatarURL, description }));
        console.log('Saved bot data to .env.local, bot_data.json');
    } catch (error) {
        console.error('Failed to save bot data:', error);
        throw error;
    } finally {
        return true;
    }
}

export async function checkIfSaved() {
    const token = process.env.DISCORD_TOKEN?.trim();
    return !!token; // Return true if token exists, false otherwise
}

export async function getBotData() {
    const data = fs.readFileSync('src/data/bot_data.json');
    return JSON.parse(data);
}

export async function BotLogin(providedToken) {
    const token = providedToken || process.env.DISCORD_TOKEN?.trim();
    
    if (!token) {
        throw new Error('Discord token not found in environment variables');
    }

    try {
        await client.login(token);
        
        return new Promise((resolve, reject) => {
            client.once(Events.ClientReady, async (c) => {
                try {
                    await client.application?.fetch();
                    console.log(`Ready! Logged in as ${c.user.tag}`);
                    const displayName = c.user.tag;
                    const avatarURL = c.user.displayAvatarURL({
                        format: 'webp',
                        dynamic: true,
                        size: 1024
                    });
                    const description = client.application?.description || 'No description provided!';
                    console.log('Avatar URL:', avatarURL);
                    console.log('Description:', description);
                    fs.writeFileSync('src/data/bot_data.json', JSON.stringify({ displayName, avatarURL, description }));
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Failed to login:', error);
        throw error;
    }
}

export async function GetAvatarAndDescription() {
    if (!client.isReady()) {
        throw new Error('Client is not ready. Please ensure bot is logged in first.');
    }
    
    try {
        await client.application?.fetch();
        const avatarURL = client.user.displayAvatarURL({ 
            format: 'webp', 
            dynamic: true, 
            size: 1024 
        });
        const description = client.application?.description || 'No description provided!';
        return { avatarURL, description };
    } catch (error) {
        console.error('Error getting avatar and description:', error);
        throw error;
    }
}