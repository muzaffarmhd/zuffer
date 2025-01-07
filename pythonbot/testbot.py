import discord
import wave
import asyncio
import io
from discord.ext import commands
from discord import PCMVolumeTransformer

TOKEN = "MTMyMjE0NjQ3MjI0MTc5MTA1Ng.GzwVub.vahk8aynAf6wid1SdZgAZ9RXBqYKOt0QS0oyoY"

intents = discord.Intents.all()
intents.messages = True
intents.guilds = True
intents.voice_states = True
intents.guild_messages = True

bot = commands.Bot(command_prefix="!", intents=intents)


class AudioRecorderSink():
    def __init__(self):
        self.audio_data = bytearray()

    def write(self, data):
        self.audio_data.extend(data)

    def save_to_file(self, filename):
        with wave.open(filename, 'wb') as wav_file:
            wav_file.setnchannels(2)  # Stereo
            wav_file.setsampwidth(2)  # 16-bit audio
            wav_file.setframerate(48000)  # 48kHz sample rate
            wav_file.writeframes(self.audio_data)


@bot.command()
async def join(ctx):
    if ctx.author.voice is None:
        await ctx.send("You are not in a voice channel.")
        return

    channel = ctx.author.voice.channel
    vc = await channel.connect()

    await ctx.send(f"Joined {channel.name}!")


@bot.command()
async def record(ctx, duration: int = 10):
    """Records audio for the specified duration (in seconds)."""
    if ctx.voice_client is None:
        await ctx.send("I'm not connected to a voice channel.")
        return

    voice_client = ctx.voice_client

    # Start recording
    sink = AudioRecorderSink()
    voice_client.listen(sink)
    await ctx.send("Recording started...")

    await asyncio.sleep(duration)

    # Stop recording
    voice_client.stop_listening()
    sink.save_to_file("recording.wav")
    await ctx.send("Recording saved as 'recording.wav'.")


@bot.command()
async def leave(ctx):
    if ctx.voice_client:
        await ctx.voice_client.disconnect()
        await ctx.send("Disconnected from the voice channel.")
    else:
        await ctx.send("I'm not connected to any voice channel.")


bot.run(TOKEN)
