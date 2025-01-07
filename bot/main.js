import { Client, GatewayIntentBits } from 'discord.js';
import { EndBehaviorType, joinVoiceChannel } from '@discordjs/voice';
import { createClient } from '@deepgram/sdk';
import { configDotenv } from 'dotenv';
import fs from 'fs';
import path from 'path';
import prism from 'prism-media';
import { exec } from 'child_process';

configDotenv();
const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent];
const client = new Client({ intents: intents });
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

class Transcript {
    constructor() {
        this.chat_transcript = "";
        this.audio_transcript = "";
    }
    addChatTranscript(message) {
        this.chat_transcript += message.author.displayName + ": " + message.content + "\n";
    }

    clearTranscript() {
        this.chat_transcript = "";
        this.audio_transcript = "";
    }
}

class MeetingBot {
    constructor() {
        this.client = client;
        this.intents = intents;
        this.token = process.env.DISCORD_TOKEN;
        this.transcription = new Transcript();
        this.voice_connection = null;
        this.userAudioBuffers = {};
        this.audioChunks = [];
        this.audioFilePath = path.join(import.meta.dirname, 'recording.pcm');
        this.audioWriteStream = null;
    }

    async join(message) {
        if (!message.member.voice.channel) {
            return message.reply('You need to join a voice channel first!');
        }

        const connection = joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        this.voice_connection = connection;
        this.start_recording();
        message.reply('Joined the voice channel!');
    }

    async start_recording() {
        if (!this.voice_connection) {
            return message.reply('I need to be in a voice channel to record!');
        }
        fs.writeFileSync(this.audioFilePath, '');
        this.audioWriteStream = fs.createWriteStream(this.audioFilePath, { flags: 'a' });

        const receiver = this.voice_connection.receiver;

        receiver.speaking.on('start', (userId) => {
            console.log(`Started receiving audio from user: ${userId}`);
            const audioStream = receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: 1000, // Silence detection
                },
            });

            const pcmStream = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
            const outputStream = fs.createWriteStream(this.audioFilePath, { flags: 'a' });

            audioStream.pipe(pcmStream).pipe(outputStream);

            audioStream.on('end', () => {
                console.log(`Stopped receiving audio from user: ${userId}`);
                outputStream.end();
            });
        });
    }

    async stop_recording(message) {
        if (!this.voice_connection) {
            return;
        }

        this.audioWriteStream.end();
        this.audioWriteStream = null;

        const pcmFilePath = this.audioFilePath;
        const wavFilePath = path.join(import.meta.dirname, 'recording.wav');

        exec(`ffmpeg -f s16le -ar 48000 -ac 2 -i ${pcmFilePath} ${wavFilePath} -y`, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error converting PCM to WAV: ${error.message}`);
                return;
            }

            console.log('PCM file converted to WAV successfully');

            // Read the WAV file and send it to Deepgram
            console.log("reached here 1");
            const audioBuffer = fs.readFileSync(wavFilePath);
            console.log("reached here");
            const response = await deepgram.listen.prerecorded.transcribeFile(
                audioBuffer,
                { punctuate: true }
            );
            console.log('Transcription response:', response);

            if (response.result.results.channels[0].alternatives[0]) {
                const transcriptText = response.result.results.channels[0].alternatives[0].transcript;
                this.transcription.audio_transcript += `Combined Transcript: ${transcriptText}\n`;
                console.log('Transcription:', transcriptText);
                message.reply(`Audio Transcription: ${transcriptText}`);
            } else {
                console.log('Transcription error:', response);
            }


        });
    }

    async leave(message) {
        if (this.voice_connection) {
            this.stop_recording(message);
            this.voice_connection.destroy();
            this.voice_connection = null;
            await message.reply(`Chat Transcript:\n${this.transcription.chat_transcript}`);
            this.transcription.clearTranscript();
            return;

        } else {
            return message.reply("I'm not in a voice channel!");
        }
    }

    async start() {
        this.client.login(this.token);
        this.client.on('ready', () => {
            console.log('Bot is ready!');
        });
    }
}

client.on('messageCreate', async (message) => {
    if (message.content === '!join') {
        await bot.join(message);
    } else if (message.content === '!record') {
        bot.start_recording();
        message.reply(`Recording started!`);
    } else if (message.content === '!leave') {
        await bot.leave(message);
    } else if (!bot.voice_connection) {
        return;
    } else {
        bot.transcription.addChatTranscript(message);
    }
});

const bot = new MeetingBot();
bot.start();


