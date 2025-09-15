import asyncio
import websockets
import string
import random

async def analyze_frame(websocket):
    while True:
        frame = await websocket.recv()
        # with open("image.jpg", "wb") as f:
        #     f.write(frame)
        chars = string.ascii_letters + string.digits + string.punctuation
        random_quote = ''.join([random.choice(chars) for _ in range(35)])
        await websocket.send(random_quote)
        await asyncio.sleep(3)

async def main():
    async with websockets.serve(analyze_frame, "localhost", 6789):
        print("WebSocket server started at ws://localhost:6789")
        await asyncio.Future()

asyncio.run(main())
