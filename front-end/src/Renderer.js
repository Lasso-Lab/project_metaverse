import { Application } from 'pixi.js';

import { Controller } from './Controller.js';
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
            const player = new Player(null, null, this.app, username, Object.keys(this.players).length, controller);
            this.players[username] = player;
        } else {
            const player = new Player(null, null, this.app, username, Object.keys(this.players).length, null);
            this.players[username] = player;
        }
    }

    removePlayer(username) {
        this.players[username].destroy();
        delete this.players[username];
    }

    getHostPosition() {
        if (this.host === null || this.players === null || this.players[this.host] === null) {
            return { x: 0, y: 0 };
        }
        return this.players[this.host].getPosition();
    }

    setHost(username) {
        this.host = username;
    }

    updatePlayer(username, x, y) {
        this.players[username]?.setPosition(x, y);
    }


    render() {
        this.app.ticker.add((time) => {
            for (const player of Object.values(this.players)) {
                player.update(time.deltaTime);
            }
        });
    }
}
