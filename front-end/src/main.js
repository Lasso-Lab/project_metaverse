import { Application, Assets } from 'pixi.js';
import { Controller } from './Controller.js';
import { Player } from './Player.js';

// Asynchronous IIFE
(async () =>
{
    // Create a PixiJS application.
    const app = new Application();

    // Intialize the application.
    await app.init({ background: '#1099bb', resizeTo: window });

    // Then adding the application's canvas to the DOM body.
    document.body.appendChild(app.canvas);

    const texture = await Assets.load('./player.png');

    // Create a new Sprite from an image path.
    // Initialize the player with the loaded texture.
    const player = new Player(texture, app);
    app.stage.addChild(player.sprite);

    const controller = new Controller();

    // Add an animation loop callback to the application's ticker.
    app.ticker.add((time) => {
        player.update(controller, time.deltaTime);
    });
})();
