const BASE_URL = "http://localhost:8081"

export class Client {
    constructor(renderer) {
        this.username;
        this.players = {};
        this.renderer = renderer;
    }
    
    updatePlayer(username, x, y) {
        this.players[username] = { x, y };
    }

    onConnect(username) {
        this.username = username;

        // Create the WebRTC offer
        const peerConnection = new RTCPeerConnection()
        const dataChannel = peerConnection.createDataChannel("position")

        dataChannel.onopen = () => {
          console.log("Data channel is open")
          this.renderer.setHost(this.username)
        }

        dataChannel.onmessage = (event) => {
          console.log("Message received : ", event.data)
          const [username, x, y] = event.data.split("|")
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