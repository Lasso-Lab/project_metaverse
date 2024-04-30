import { Sprite } from 'pixi.js';

export class Player {
    constructor(texture, app) {
        this.sprite = new Sprite(texture);
        this.app = app;

        // Center the sprite's anchor point
        this.sprite.anchor.set(0.5);

        // Move the sprite to the center of the screen
        this.sprite.x = app.screen.width / 2;
        this.sprite.y = app.screen.height / 2;

        // Set initial properties for rotation and movement speed
        this.rotationSpeed = 0.1;
        this.speed = 30;
    }

    update(controller, deltaTime) {
        // Rotate sprite based on space key press
        if (controller.keys.space.pressed) {
            this.sprite.rotation += this.rotationSpeed * deltaTime * (controller.keys.space.doubleTap ? -1 : 1);
        }

        // Move sprite based on arrow keys
        this.sprite.x += (controller.keys.right.pressed - controller.keys.left.pressed) * this.speed * deltaTime;
        this.sprite.y += (controller.keys.down.pressed - controller.keys.up.pressed) * this.speed * deltaTime;
    }
}