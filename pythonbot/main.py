import discord
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env.local")
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

TOKEN = os.getenv('DISCORD_TOKEN')
client.run(TOKEN)