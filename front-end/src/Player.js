import { Sprite, Graphics, Text } from 'pixi.js';


export class Player {
    /**
     * @param {any} texture
     * @param {any} object
     * @param {any} app
     */
    constructor(texture, object, app, pseudo, id, controller) {
        this.id = id;
        if (texture)
            this.sprite = Sprite.from(texture);
        this.shape = object;

        if (!this.sprite && !this.shape) {
            let randomColor = Math.floor(Math.random()*16777215).toString(16);
            this.shape = new Graphics().circle(0, 0, 16).fill({ color: randomColor }).stroke({ color: 0x111111, alpha: 0.87, width: 1 });
        }

        this.app = app;

        this.username = new Text(pseudo ?? 'Player ' + id, { fontFamily: 'Arial', fontSize: 12, fill: 0xffffff, align: 'center' });
        this.username.anchor.set(0.5);
        app.stage.addChild(this.username);

        if (this.sprite) {
            this.sprite.anchor.set(0.5);
            app.stage.addChild(this.sprite);
            this.sprite.x = app.screen.width / 2;
            this.sprite.y = app.screen.height / 2;
        }
        
        if (this.shape) {
            app.stage.addChild(this.shape);
            this.shape.x = app.screen.width / 2;
            this.shape.y = app.screen.height / 2;
        }

        // Set initial properties for rotation and movement speed
        this.rotationSpeed = 0.1;
        this.speed = 30;
        this.controller = controller;
    }

    /**
     * @param {{ keys: { space: { pressed: any; doubleTap: any; }; right: { pressed: number; }; left: { pressed: number; }; down: { pressed: number; }; up: { pressed: number; }; }; }} this.controller
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (!this.controller)
            return;
        
        // Rotate sprite based on space key press
        if (this.controller.keys.space.pressed) {
            if (this.sprite)
                this.sprite.rotation += this.rotationSpeed * deltaTime * (this.controller.keys.space.doubleTap ? -1 : 1);
            if (this.shape)
                this.shape.rotation += this.rotationSpeed * deltaTime * (this.controller.keys.space.doubleTap ? -1 : 1);
        }

        // Move sprite based on arrow keys
        if (this.sprite) {
            this.sprite.x += (this.controller.keys.right.pressed - this.controller.keys.left.pressed) * this.speed * deltaTime;
            this.sprite.y += (this.controller.keys.down.pressed - this.controller.keys.up.pressed) * this.speed * deltaTime;

            this.username.x = this.sprite.x;
            this.username.y = this.sprite.y - 32;
        }

        // also move the shape
        if (this.shape) {
            this.shape.x += (this.controller.keys.right.pressed - this.controller.keys.left.pressed) * this.speed * deltaTime;
            this.shape.y += (this.controller.keys.down.pressed - this.controller.keys.up.pressed) * this.speed * deltaTime;

        }
    }


    getPosition() {
        if (this.sprite) {
            return {
                x: this.sprite.x,
                y: this.sprite.y
            }
        } else if (this.shape) {
            return {
                x: this.shape.x,
                y: this.shape.y
            }
        } else {
            return {
                x: 0,
                y: 0
            }
        } 
    }

    setPosition(x, y) {
        this.username.x = x;
        this.username.y = y - 32;
        if (this.sprite) {
            this.sprite.x = x;
            this.sprite.y = y;
        }
        if (this.shape) {
            this.shape.x = x;
            this.shape.y = y;
        }
    }

    destroy() {
        if (this.sprite) {
            this.app.stage.removeChild(this.sprite);
        }
        if (this.shape) {
            this.app.stage.removeChild(this.shape);
        }
        this.app.stage.removeChild(this.username);
    }

}