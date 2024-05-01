import { Application } from 'pixi.js';

import { Controller } from './Systems/Controller.js';
import { Player } from './Player.js';

export class Renderer {
    constructor() {
        this.systems = [];
        this.players = {};
        this.host = null;
    }

    async init() {
        this.app = new Application();
        await this.app.init({ background: '#1099bb', resizeTo: window });
        document.body.appendChild(this.app.canvas);
    }

    addPlayer(username) {
        if (username === this.host) {
            const controller = new Controller();
            const player = new Player(null, null, this.app, username, this.players.size(), controller);
            this.players[username] = player;
        } else {
            const player = new Player(null, null, this.app, username, this.players.size(), null);
            this.players[username] = player;
        }
    }

    removePlayer(username) {
        this.players[username].destroy();
        delete this.players[username];
    }

    getHostPosition() {
        return this.players[this.host].getPosition();
    }

    setHost(username) {
        this.host = username;
    }

    setPositions(positions) {
        for (const [username, position] of Object.entries(positions)) {
            this.players[username].setPosition(position);
        }
    }

    render() {
        this.app.ticker.add((time) => {
            for (const player of Object.values(this.players)) {
                player.update(time.deltaTime);
            }
        });
    }
}
