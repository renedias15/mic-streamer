const express = require("express")
const { WebSocketServer } = require("ws")

const app = express()
const PORT = 3000

console.log("Starting audio server...")

app.use(express.static("public"))

const server = app.listen(PORT, () => {
    console.log("Server running on port", PORT)
})

const wss = new WebSocketServer({ server })

let sender = null
let listeners = []

function updateSender() {

    if (sender && sender.readyState === 1) {

        const msg = "LISTENERS:" + listeners.length

        sender.send(msg)

        console.log("Sent to sender:", msg)

    }

}

wss.on("connection", (ws) => {

    console.log("Client connected")

    ws.on("message", (data) => {

        const text = data.toString()

        if (text === "SENDER") {

            sender = ws
            console.log("Sender registered")

            updateSender()
            return
        }

        if (text === "LISTENER") {

            listeners.push(ws)

            console.log("Listener joined")

            updateSender()
            return
        }
        if (text.startsWith("NETWORK:")) {

            console.log("Network update:", text)
        
            listeners.forEach(client => {
        
                if (client.readyState === 1) {
                    client.send(text)
                }
        
            })
        
            return
        }
        if (ws === sender) {

            listeners.forEach(client => {

                if (client.readyState === 1) {
                    client.send(data)
                }

            })

        }

    })

    ws.on("close", () => {

        listeners = listeners.filter(c => c !== ws)

        if (ws === sender) {
            sender = null
        }

        updateSender()

        console.log("Client disconnected")
        console.log("Listeners:", listeners.length)

    })

})