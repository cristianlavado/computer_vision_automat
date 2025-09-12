import asyncio
import websockets
import requests


async def enviar_frases(websocket):
    while True:
        frase = requests.get('https://api.chucknorris.io/jokes/random').json()["value"]

        await websocket.send(frase)
        print(f"Frase enviada: {frase}")
        await asyncio.sleep(3)

async def main():
    async with websockets.serve(enviar_frases, "localhost", 6789):
        print("Servidor WebSocket iniciado en ws://localhost:6789")
        await asyncio.Future()

asyncio.run(main())
