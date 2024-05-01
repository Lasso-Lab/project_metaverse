import { Application, Assets, Graphics } from 'pixi.js';

import { Renderer } from './Renderer.js';
import { Client } from './Client.js';

// Asynchronous IIFE
(async () =>
{
    // Create a PixiJS application.
    const renderer = new Renderer();
    await renderer.init();

    const client = new Client(renderer);

    const usernameInput = document.getElementById("username")
    const button = document.getElementById("login")

    button.addEventListener(
    "click",
    () => {
        client.onConnect(usernameInput.value)
    }
    )

    renderer.render();
})();
