import { Client, GatewayIntentBits } from 'discord.js';
import { EndBehaviorType, joinVoiceChannel } from '@discordjs/voice';
import { createClient } from '@deepgram/sdk';
import { configDotenv } from 'dotenv';
import fs from 'fs';
import path from 'path';
import prism from 'prism-media';
import { exec } from 'child_process';

configDotenv();
const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
];
const client = new Client({ intents: intents });
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

class Transcript {
  constructor() {
    this.chat_transcript = "";
    this.audio_transcript = "";
  }
  addChatTranscript(message) {
    this.chat_transcript += `${message.author.displayName}: ${message.content}\n`;
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
    this.audioFilePath = path.join(import.meta.dirname, 'recording.pcm');
    this.audioWriteStream = null;
    this.recordingTimer = null; // timer to chunk recordings
    this.RECORDING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
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
    await this.start_recording(message); // pass the message for follow-up actions
    message.reply('Joined the voice channel and started 5-minute chunk recording!');
  }

  async start_recording(message) {
    // Clear any old timer
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }

    if (!this.voice_connection) {
      return message.reply('I need to be in a voice channel to record!');
    }
    // Clear the old PCM in case it exists
    fs.writeFileSync(this.audioFilePath, '');

    this.audioWriteStream = fs.createWriteStream(this.audioFilePath, { flags: 'a' });
    const receiver = this.voice_connection.receiver;

    // Subscribe to each user’s audio
    receiver.speaking.on('start', (userId) => {
      console.log(`Receiving audio from user: ${userId}`);
      const audioStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 1000,
        },
      });

      const pcmStream = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
      const outputStream = fs.createWriteStream(this.audioFilePath, { flags: 'a' });

      audioStream.pipe(pcmStream).pipe(outputStream);

      audioStream.on('end', () => {
        console.log(`Stopped receiving from user: ${userId}`);
        outputStream.end();
      });
    });

    // After 5 minutes, stop this chunk and transcribe, then start a new one
    this.recordingTimer = setTimeout(async () => {
      await this.stopAndRestart(message);
    }, this.RECORDING_INTERVAL_MS);
  }

  async stopAndRestart(message) {
    // Stop current recording and force transcription
    console.log('5 min reached: stopping to transcribe the chunk...');
    await this.stop_recording(message);

    // After transcribing, start a new recording chunk
    console.log('Restarting recording for next 5-minute chunk...');
    this.start_recording(message);
  }

  async stop_recording(message) {
    if (!this.voice_connection || !this.audioWriteStream) {
      return;
    }

    // Clear the timer so it doesn't call stop again
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }

    // Close the write stream
    this.audioWriteStream.end();
    this.audioWriteStream = null;

    const pcmFilePath = this.audioFilePath;
    const wavFilePath = path.join(import.meta.dirname, 'recording.wav');

    // Convert PCM to WAV
    exec(`ffmpeg -f s16le -ar 48000 -ac 2 -i ${pcmFilePath} ${wavFilePath} -y`, async (error) => {
      if (error) {
        console.error(`Error converting PCM to WAV: ${error.message}`);
        return;
      }
      console.log('PCM file converted to WAV successfully');

      // Read WAV file and send to Deepgram
      const audioBuffer = fs.readFileSync(wavFilePath);
      try {
        const response = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, { punctuate: true });
        console.log('Transcription response:', response);

        const channels = response?.result?.results?.channels;
        if (channels && channels[0].alternatives[0]) {
          const transcriptText = channels[0].alternatives[0].transcript;
          this.transcription.audio_transcript += `Chunk Transcript: ${transcriptText}\n`;
          console.log('Transcription:', transcriptText);
          message.reply(`Chunk Transcription: ${transcriptText}`);
        } else {
          console.log('Transcription missing results:', response);
        }
      } catch (err) {
        console.error('Deepgram transcription error:', err);
      }
    });
  }

  async leave(message) {
    // When leaving, stop the chunked recording and destroy the connection
    if (this.voice_connection) {
      console.log('Leaving and stopping final chunk...');
      await this.stop_recording(message);

      this.voice_connection.destroy();
      this.voice_connection = null;
      message.reply(`Final Transcription:\n${this.transcription.audio_transcript}`);
      this.transcription.clearTranscript();
    } else {
      message.reply("I'm not in a voice channel!");
    }
  }

  async start() {
    this.client.login(this.token);
    this.client.on('ready', () => {
      console.log('Bot is ready!');
    });
  }
}

const bot = new MeetingBot();
client.on('messageCreate', async (message) => {
  if (message.content === '!join') {
    await bot.join(message);
  } else if (message.content === '!leave') {
    await bot.leave(message);
  } else if (!bot.voice_connection) {
    return;
  } else {
    bot.transcription.addChatTranscript(message);
  }
});

bot.start();