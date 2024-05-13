const BASE_URL = import.meta.env.VITE_API_BASE_URL

export class Client {
    constructor(renderer) {
        this.username;
        this.players = {};
        this.renderer = renderer;
        this.dataChannels = {};
    }
    
    updatePlayer(username, x, y) {
        if (!this.players[username]) {
            this.renderer.addPlayer(username);
        }

        this.players[username] = { x, y };
        this.renderer.updatePlayer(username, x, y);
    }

    sendPosition(x, y) {
        var dataChannel = this.dataChannels["position"]
        if (dataChannel && dataChannel.isOpen) {
            dataChannel.channel.send(`${x}|${y}`)
        }
    }

    onConnect(username) {
        this.username = username;
        this.players[username] = { x: 0, y: 0 }

        // Create the WebRTC offer
        const peerConnection = new RTCPeerConnection()

        // Handle the positions
        const positionDataChannel = peerConnection.createDataChannel("position")

        positionDataChannel.onopen = () => {
          console.log("Position data channel is open")
          this.renderer.setHost(this.username)
          this.renderer.addPlayer(this.username)
          this.dataChannels["position"].isOpen = true
        }

        positionDataChannel.onmessage = (event) => {
          let [username, x, y] = event.data.split("|")
          x = parseInt(x)
          y = parseInt(y)
          this.updatePlayer(username, x, y)
        }

        // Handle the notifications
        const notificationDataChannel = peerConnection.createDataChannel("notification")

        notificationDataChannel.onopen = () => {
          console.log("Notification data channel is open")
          this.dataChannels["notification"].isOpen = true
        }

        notificationDataChannel.onmessage = (event) => {
          const reader = new FileReader()
          reader.onload = () => {
            const text = reader.result
            const message = JSON.parse(text)

            console.log("Notification received : ", message)
          }

          reader.readAsText(event.data)
        }

        peerConnection.createOffer().then(
          (offer) => {
            console.log("Offer created : ", offer);
            peerConnection.setLocalDescription(offer);
            this._sendOfferAndGetAnswer(peerConnection, offer);
          }
        )

        this.dataChannels["position"] = {
          "channel": positionDataChannel,
          "isOpen": false
        }

        this.dataChannels["notification"] = {
          "channel": notificationDataChannel,
          "isOpen": false
        }
      }

      async _sendOfferAndGetAnswer(peerConnection, offer) {
        try {
          const response = await fetch(`${BASE_URL}/auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              username: this.username,
              offer: offer
            })
          })
          const data = await response.json()
          // Set the remote description
          if (data.type === "answer") {
            peerConnection.setRemoteDescription(data)
          }
        } catch (error) {
          console.error("Error while sending the offer : ", error)
        }
      }
}