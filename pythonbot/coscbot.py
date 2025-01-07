import discord
from discord.ext import commands
import asyncio
from fastapi import FastAPI, HTTPException
import os
from typing import List, Dict
import json
from groq import Groq
import threading
import logging
from dotenv import load_dotenv
import time
from pathlib import Path
from deepgram import DeepgramClient, PrerecordedOptions, FileSource
import wave
from io import BytesIO

class AudioSink:
    def __init__(self):
        self.audio_data = {}
        self.vc = None
        self.encoding = 'wav'

    def write(self, data, user):
        if user not in self.audio_data:
            self.audio_data[user] = BytesIO()
        self.audio_data[user].write(data)

    def cleanup(self):
        formatted_audio = {}
        print("reached here:")
        for user_id, buffer in self.audio_data.items():
            wav_buffer = BytesIO()
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(2)
                wav_file.setsampwidth(2)
                wav_file.setframerate(48000)
                buffer.seek(0)
                wav_file.writeframes(buffer.read())
            print("saving file....")
            with open(f"{user_id}.wav", "wb") as out_f:
                out_f.write(wav_buffer.read())
            wav_buffer.seek(0)
            formatted_audio[user_id] = wav_buffer
        return formatted_audio

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('discord')
logger.setLevel(logging.DEBUG)

load_dotenv()
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')

if not DISCORD_TOKEN:
    logger.error("No Discord token found in environment variables!")
    exit(1)

app = FastAPI()
intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True
intents.guilds = True
client = commands.Bot(command_prefix='!', intents=intents)

groq_client = Groq(api_key=GROQ_API_KEY)
deepgram = DeepgramClient(DEEPGRAM_API_KEY)

deepgram_options = PrerecordedOptions(
    model="nova-2",
    smart_format=True,
    utterances=True,
    punctuate=True,
    diarize=True,
    detect_language=True,
)

class VoiceRecorder:
    def __init__(self, channel_id):
        self.channel_id = channel_id
        self.recording = False
        self.sink = None
        self.text_messages = []
        self.recorded_users = set()
        self.audio_sink = AudioSink()
        logger.info(f"Created new VoiceRecorder for channel {channel_id}")

    async def process_audio(self, audio_data):
        try:
            payload = {
                "buffer": audio_data.read(),
            }
            response = await deepgram.listen.prerecorded.v("1").transcribe_file(payload, deepgram_options)
            words = response["results"]["channels"][0]["alternatives"][0]["words"]
            
            transcript = ""
            current_speaker = None
            
            for word in words:
                if word["speaker"] != current_speaker:
                    transcript += f"\nSpeaker {word['speaker']}: "
                    current_speaker = word["speaker"]
                transcript += f"{word['punctuated_word']} "
            
            return transcript.strip()
        except Exception as e:
            logger.error(f"Error processing audio with Deepgram: {e}")
            return ""

class VoiceClient(discord.VoiceClient):
    def __init__(self, client: discord.Client, channel: discord.abc.Connectable):
        super().__init__(client, channel)
        self.recording = False
        self.audio_sink = None

    def start_recording(self, sink):
        self.recording = True
        self.audio_sink = sink

    def stop_recording(self):
        self.recording = False
        return self.audio_sink.cleanup()

    def receive_audio(self, data, user):
        if self.recording and self.audio_sink:
            self.audio_sink.write(data, user)

class MeetingBot:
    def __init__(self):
        self.voice_recorders: Dict[int, VoiceRecorder] = {}

    async def join_meeting(self, channel_id: int, guild_id: int):
        try:
            logger.info(f"Joining channel {channel_id} in guild {guild_id}")
            
            guild = client.get_guild(guild_id)
            if not guild:
                raise ValueError(f"Guild {guild_id} not found")
                
            channel = guild.get_channel(channel_id)
            if not channel or not isinstance(channel, discord.VoiceChannel):
                raise ValueError(f"Valid voice channel {channel_id} not found")

            try:
                if channel.guild.voice_client:
                    await channel.guild.voice_client.move_to(channel)
                    voice_client = channel.guild.voice_client
                else:
                    voice_client = await channel.connect(cls=VoiceClient)
                
                logger.info(f"Connected to voice channel: {channel.name}")
            except Exception as e:
                logger.error(f"Failed to connect to voice channel: {e}")
                raise

            recorder = VoiceRecorder(channel_id)
            self.voice_recorders[channel_id] = recorder
            recorder.recording = True

            voice_client.start_recording(recorder.audio_sink)
            logger.info("Successfully started recording")

            return {"status": "success", "message": f"Joined channel {channel.name}"}
            
        except Exception as e:
            logger.error(f"Error in join_meeting: {e}", exc_info=True)
            raise

    async def leave_meeting(self, channel_id: int):
        try:
            logger.info(f"Leaving channel {channel_id}")
            
            voice_client = None
            for vc in client.voice_clients:
                if vc.channel.id == channel_id:
                    voice_client = vc
                    break
            
            if not voice_client:
                raise ValueError("Not connected to this channel")
            
            recorder = self.voice_recorders.get(channel_id)
            if not recorder:
                raise ValueError("No recorder found for this channel")

            audio_data = voice_client.stop_recording()
            print("audio data: ", audio_data)
            
            transcripts = []
            for user_id, audio in audio_data.items():
                transcript = await recorder.process_audio(audio)
                if transcript:
                    transcripts.append(transcript)

            summary = await self._generate_summary("\n".join(transcripts), recorder.text_messages)

            await voice_client.disconnect()
            del self.voice_recorders[channel_id]

            return {
                "status": "success",
                "transcript": "\n".join(transcripts),
                "summary": summary
            }
            
        except Exception as e:
            logger.error(f"Error in leave_meeting: {e}", exc_info=True)
            raise

    async def _generate_summary(self, transcript: str, messages: List[str]) -> str:
        try:
            prompt = f"""
            Please analyze this meeting and provide a comprehensive summary including main conclusions.
            Tell what was discussed in audio more importantly. 
            Audio Transcript:
            {transcript}
            
            Chat Messages:
            {' '.join(messages)}
            
            Please provide:
            1. Meeting Summary
            2. Key Discussion Points
            3. Main Conclusions
            4. Action Items (if any)
            """
            
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="mixtral-8x7b-32768",
                temperature=0.7,
                max_tokens=20000
            )
            print("Here is the transcript: ", transcript)
            return response.choices[0].message.content
            
        except Exception as e:
            print("Here is the transcript", transcript)
            logger.error(f"Error generating summary: {e}", exc_info=True)
            return "Error generating summary"

bot = MeetingBot()

@client.command()
async def join(ctx):
    try:
        if not ctx.author.voice:
            await ctx.send("❌ You need to be in a voice channel first!")
            return
        
        channel = ctx.author.voice.channel
        logger.info(f"Join command received for channel: {channel.name}")
        
        result = await bot.join_meeting(channel.id, ctx.guild.id)
        await ctx.send(f"✅ Joined '{channel.name}' and started recording! Use !leave when done.")
        
    except Exception as e:
        logger.error(f"Error in join command: {e}", exc_info=True)
        await ctx.send(f"❌ Error: {str(e)}")

@client.command()
async def leave(ctx):
    try:
        if not ctx.voice_client:
            await ctx.send("❌ I'm not in a voice channel!")
            return
        
        channel_id = ctx.voice_client.channel.id
        
        status_msg = await ctx.send("⏳ Processing meeting recording...")
        
        try:
            result = await bot.leave_meeting(channel_id)
            
            await status_msg.edit(content=f"""
✅ Meeting ended!

📝 Transcript:
```
{result['transcript'][:10000]}{"..." if len(result['transcript']) > 10000 else ""}
```

📋 Summary:
```
{result['summary'][:10000]}{"..." if len(result['summary']) > 10000 else ""}
```
""")
        except Exception as e:
            await status_msg.edit(content=f"❌ Error processing meeting: {str(e)}")
            
    except Exception as e:
        logger.error(f"Error in leave command: {e}", exc_info=True)
        await ctx.send(f"❌ Error: {str(e)}")

@client.command()
async def status(ctx):
    if ctx.voice_client:
        recorder = bot.voice_recorders.get(ctx.voice_client.channel.id)
        if recorder:
            await ctx.send(
                f"📊 Status:\n"
                f"Connected to: {ctx.voice_client.channel.name}\n"
                f"Recording: {recorder.recording}\n"
                f"Users recorded: {len(recorder.recorded_users)}\n"
                f"Messages logged: {len(recorder.text_messages)}"
            )
    else:
        await ctx.send("❌ Not connected to any voice channel")

@client.event
async def on_ready():
    logger.info(f'Bot is ready: {client.user.name}')
    logger.info(f'Bot is in {len(client.guilds)} guilds')
    for guild in client.guilds:
        logger.info(f' - {guild.name} (id: {guild.id})')

@client.event
async def on_message(message):
    if message.author.bot:
        return
        
    if message.channel.id in bot.voice_recorders:
        recorder = bot.voice_recorders[message.channel.id]
        recorder.text_messages.append(f"{message.author.name}: {message.content}")
    
    await client.process_commands(message)

@client.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.errors.CommandNotFound):
        await ctx.send(f"❌ Command not found. Available commands: !join, !leave, !status")
    else:
        logger.error(f"Command error: {error}", exc_info=True)
        await ctx.send(f"❌ An error occurred: {str(error)}")

if __name__ == "__main__":
    import uvicorn
    import nest_asyncio
    
    nest_asyncio.apply()
    
    bot_thread = threading.Thread(
        target=client.run, 
        args=(DISCORD_TOKEN,)
    )
    bot_thread.start()
    
    uvicorn.run(app, host="0.0.0.0", port=8000)