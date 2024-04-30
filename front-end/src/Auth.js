const BASE_URL = "http://localhost:8080"
const usernameInput = document.getElementById("username")
const button = document.getElementById("login")

let userDataChannel = null
let userPosition = null

button.addEventListener(
  "click",
  () => {
    onConnect(usernameInput.value)
  }
)

const positionInput = document.getElementById("position")
const sendPositionButton = document.getElementById("sendPosition")

sendPositionButton.addEventListener(
  "click",
  () => {
    const position = positionInput.value
    if (!position) {
      console.error("Please enter a position")
      return
    }
    if (position.length <= 0) {
      console.error("Position must be at least 1 characters long")
      return
    }
    console.log("Sending position : ", position)

    sendPosition(userDataChannel, position)
  }
)

const onConnect = (username) => {
  if (!username) {
    console.error("Please enter a username")
    return
  }
  if (username.length <= 0) {
    console.error("Username must be at least 1 characters long")
    return
  }
  console.log("Connecting to the server using username : ", username)

  // Create the WebRTC offer
  const peerConnection = new RTCPeerConnection()
  const dataChannel = peerConnection.createDataChannel("position")


  dataChannel.onopen = () => {
    console.log("Data channel is open")
  }
  dataChannel.onmessage = (event) => {
    console.log("Message received : ", event.data)
    const [name, position] = event.data.split("|")
    updatePosition(position)
  }

  peerConnection.createOffer().then(
    (offer) => {
      console.log("Offer created : ", offer);
      peerConnection.setLocalDescription(offer);
      sendOfferAndGetAnswer(peerConnection, offer);
    }
  )
  userDataChannel = dataChannel
}

const sendOfferAndGetAnswer = async (peerConnection, offer) => {
  try {
    const response = await fetch(`${BASE_URL}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: usernameInput.value,
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

const sendPosition = (dataChannel, position) => {
  dataChannel.send(position)
}

const updatePosition = (newPosition) => {
  userPosition = newPosition

  console.log("User position updated : ", userPosition)
}