import asyncio
import string
import random
import json
from io import BytesIO

import websockets
from PIL import Image

async def analyze_frame(websocket):
    while True:
        frame = await websocket.recv()
        frame = Image.open(BytesIO(frame))
        width, height = frame.size

        await asyncio.sleep(3) #Simulate detection...
        """
        x: The x-coordinate of the top-left corner of the bounding box.
        y: The y-coordinate of the top-left corner of the bounding box.
        width: The width of the bounding box.
        height: The height of the bounding box.
        class_name: The label or class of the detected object (e.g., "person", "car").
        score: The confidence score of the detection (usually between 0 and 1).
        """
        detections = [
            {
                "x": int(width * 1/random.randint(2,10)),
                "y": int(height * 1/random.randint(2,10)),
                "width": int(width * 1/random.randint(2,10)),
                "height": int(height * 1/random.randint(2,10)),
                "class_name": "person",
                "score": 1/random.randint(1,10)
            },
            {
                "x": int(width * 1/random.randint(2,10)),
                "y": int(height * 1/random.randint(2,10)),
                "width": int(width * 1/random.randint(2,10)),
                "height": int(height * 1/random.randint(2,10)),
                "class_name": "cell phone",
                "score": 1/random.randint(1,10)
            }
        ]

        chars = string.ascii_letters + string.digits + string.punctuation

        response = {
            "conclusion": ''.join([random.choice(chars) for _ in range(35)]),
            "detections": detections,
        }

        await websocket.send(json.dumps(response))

async def main():
    async with websockets.serve(analyze_frame, "localhost", 6789):
        print("WebSocket server started at ws://localhost:6789")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
