const WebSocket = require("ws")

const wss = new WebSocket.Server({ port: 8080 })

let mic = null
let listeners = []

console.log("Audio server running on port 8080")

wss.on("connection", (ws, req) => {

  const path = req.url

  // ANDROID MIC
  if (path === "/mic") {

    mic = ws
    console.log("Mic connected")

    ws.on("message", (data) => {

      if (data instanceof Buffer) {
        const msg = data.toString("utf-8")

        // Only log NETWORK_TYPE once, not audio
        if (msg.startsWith("NETWORK_TYPE:")) {
          console.log("Received from mic:", msg)
          return
        }

        // forward audio to all browser listeners
        for (const client of listeners) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data)
          }
        }

      } else if (typeof data === "string") {
        // control messages
        console.log("Mic control message:", data)
      }

    })

    ws.on("close", () => {
      mic = null
      console.log("Mic disconnected")
    })

  }

  // BROWSER LISTENER
  else if (path === "/listen") {

    listeners.push(ws)
    console.log("Listener connected:", listeners.length)

    // tell mic to start
    if (mic) {
      mic.send("START")
    }

    ws.on("message", (data) => {
      if (mic && typeof data === "string" && data === "CHECK_NETWORK") {
        mic.send("CHECK_NETWORK") // request network type from Android
      }
    })

    ws.on("close", () => {
      listeners = listeners.filter(c => c !== ws)
      console.log("Listener disconnected:", listeners.length)

      if (listeners.length === 0 && mic) {
        mic.send("STOP")
      }
    })

  }

})