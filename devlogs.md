# Developement Logs 
## Basic Overview
The basic plan of this project is to provide a custom bot manager along with some basic features [ create and manage a custom professional event management bot ].
## Design
### Planned Features:
1. Welcomer
2. Embed Builder
3. Meeting Summarizer (credits to @mdimado)
4. Bulk Channel Creator
5. Manage Users and give access to channles through simple commands. (Avoids role creation)
## Installation
1. discord.py has a dependency on audioop which is a module that will be removed in python3.13, so if we are using python3.13, discord.py won't be able to find it.
`Fix: pip install audioop-lts`. *audioop: is a python module that allows users to manipulate audio data and perform operations on audio fragments.*
2. Enable Intents in the discord developer portal applications - bot page.