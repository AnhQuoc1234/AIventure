import { Component, OnInit } from "@angular/core";
import Phaser from "phaser";
import StartGame from "../game/phaser/main";
import { EventBus } from "../game/core/EventBus";
import { ChatInputComponent } from "./components/chat-input/chat-input.component";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'phaser-game',
    template: `
    <app-chat-input></app-chat-input>
    <div id="game-container" (mousedown)="onGameFocus()"></div>
    `,
    styles: [`
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }
        #game-container {
            width: calc(100% - 20px);
            height: calc(100% - 20px);
            margin: 10px;
            border-radius: 10px;
            overflow: hidden;
            background-color: #000;
        }
    `],
    standalone: true,
    imports: [ChatInputComponent, CommonModule]
})
export class PhaserGame implements OnInit
{
    scene: Phaser.Scene | any;
    game: Phaser.Game;
    sceneCallback: (scene: Phaser.Scene | any) => void;

    ngOnInit()
    {
        this.initGame();

        EventBus.on('current-scene-ready', (scene: any) =>
        {
            this.scene = scene;

            if (this.sceneCallback)
            {
                this.sceneCallback(scene);
            }
        });
    }

    initGame()
    {
        if (this.game)
        {
            this.game.destroy(true);
        }

        this.game = StartGame('game-container');
    }

    onGameFocus()
    {
        EventBus.emit('game-focused');
    }

    ngOnDestroy()
    {
        if (this.game)
        {
            this.game.destroy(true);
        }
    }
}
