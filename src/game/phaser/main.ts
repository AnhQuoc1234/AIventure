import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { CONSTANTS } from '../core/Constants';
import { CRTPipeline } from './shaders/CRTShader';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: CONSTANTS.GAME_LOGICAL_WIDTH,
    height: CONSTANTS.GAME_LOGICAL_HEIGHT,
    pixelArt: true,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
	mode: Scale.FIT,
	autoCenter: Scale.CENTER_BOTH
    },
    pipeline: { 'CRTPipeline': CRTPipeline } as any,
    scene: [
        Boot,
        Preloader,
        MainGame,
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
