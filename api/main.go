package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/pion/webrtc/v4"
)

type Player struct {
	Username    string
	Peer        *webrtc.PeerConnection
	DataChannel *webrtc.DataChannel
}

type GameServer struct {
	players     map[string]*Player
	playersLock sync.Mutex
}

func newGameServer() *GameServer {
	return &GameServer{
		players: make(map[string]*Player),
	}
}

func (gs *GameServer) addPlayer(username string, peer *webrtc.PeerConnection, dataChannel *webrtc.DataChannel) {
	gs.playersLock.Lock()
	defer gs.playersLock.Unlock()

	gs.players[username] = &Player{
		Username:    username,
		Peer:        peer,
		DataChannel: dataChannel,
	}
}

func (gs *GameServer) createPeerConnection(username string, offer webrtc.SessionDescription, config webrtc.Configuration, answerCh chan webrtc.SessionDescription) {
	peerConnection, err := webrtc.NewPeerConnection(config)
	if err != nil {
		panic(err)
	}

	defer func() {
		if cErr := peerConnection.Close(); cErr != nil {
			fmt.Printf("cannot close peerConnection: %v\n", cErr)
		}
	}()

	peerConnection.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		if s == webrtc.PeerConnectionStateFailed || s == webrtc.PeerConnectionStateDisconnected || s == webrtc.PeerConnectionStateClosed {
			gs.playersLock.Lock()
			defer gs.playersLock.Unlock()

			delete(gs.players, username)

			return
		}
	})

	peerConnection.OnDataChannel(func(d *webrtc.DataChannel) {
		d.OnOpen(func() {
			if d.Label() == "position" {
				gs.addPlayer(username, peerConnection, d)
			}
		})

		d.OnMessage(func(msg webrtc.DataChannelMessage) {
			// Broadcast the message to all other players
			gs.playersLock.Lock()
			defer gs.playersLock.Unlock()

			for _, player := range gs.players {
				err := player.DataChannel.SendText(username + "|" + string(msg.Data))

				if err != nil {
					fmt.Println(err)
				}
			}
		})
	})

	err = peerConnection.SetRemoteDescription(offer)
	if err != nil {
		panic(err)
	}

	answer, err := peerConnection.CreateAnswer(nil)
	if err != nil {
		panic(err)
	}

	gatherComplete := webrtc.GatheringCompletePromise(peerConnection)

	err = peerConnection.SetLocalDescription(answer)
	if err != nil {
		panic(err)
	}

	<-gatherComplete
	answerCh <- *peerConnection.LocalDescription()

	select {}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

type AuthRequest struct {
	Username string                    `json:"username"`
	Offer    webrtc.SessionDescription `json:"offer"`
}

func main() {
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}

	gs := newGameServer()

	router := http.NewServeMux()
	router.HandleFunc("POST /auth", func(w http.ResponseWriter, r *http.Request) {
		var authReq AuthRequest
		err := json.NewDecoder(r.Body).Decode(&authReq)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		answerCh := make(chan webrtc.SessionDescription)

		go gs.createPeerConnection(authReq.Username, authReq.Offer, config, answerCh)

		answer := <-answerCh

		b, err := json.Marshal(answer)
		if err != nil {
			panic(err)
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(b)
	})

	server := http.Server{
		Addr:    ":8080",
		Handler: corsMiddleware(router),
	}
	fmt.Println("Server is running on port 8080")
	server.ListenAndServe()
}
