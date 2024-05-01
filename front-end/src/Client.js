const BASE_URL = import.meta.env.VITE_API_BASE_URL

export class Client {
    constructor(renderer) {
        this.username;
        this.players = {};
        this.renderer = renderer;
        this.dataChannel = null;
        this.isDataChannelOpen = false;
    }
    
    updatePlayer(username, x, y) {
        if (!this.players[username]) {
            this.renderer.addPlayer(username);
        }

        this.players[username] = { x, y };
        this.renderer.updatePlayer(username, x, y);
    }

    sendPosition(x, y) {
        if (this.dataChannel && this.isDataChannelOpen) {
            this.dataChannel.send(`${x}|${y}`)
        }
    }

    onConnect(username) {
        this.username = username;
        this.players[username] = { x: 0, y: 0 }

        // Create the WebRTC offer
        const peerConnection = new RTCPeerConnection()
        const dataChannel = peerConnection.createDataChannel("position")

        dataChannel.onopen = () => {
          console.log("Data channel is open")
          this.renderer.setHost(this.username)
          this.renderer.addPlayer(this.username)
          this.isDataChannelOpen = true
        }

        dataChannel.onmessage = (event) => {
          let [username, x, y] = event.data.split("|")
          x = parseInt(x)
          y = parseInt(y)
          this.updatePlayer(username, x, y)
        }

        peerConnection.createOffer().then(
          (offer) => {
            console.log("Offer created : ", offer);
            peerConnection.setLocalDescription(offer);
            this._sendOfferAndGetAnswer(peerConnection, offer);
          }
        )
        this.dataChannel = dataChannel;
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