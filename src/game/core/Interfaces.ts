import { GridManager } from './GridManager';
import { Player } from './Player';
import { MovingNPC } from './MovingNPC';
import { AgenticNPC } from './AgenticNPC';
import { MovableObject } from './MovableObject';

export interface IGameObject {
    destroy(): void;
    props?: any;
    visible?: boolean;
    instanceId?: string;
}

export interface ILevelManager {
    gridManager: GridManager;
    player: Player;
    npcs: MovingNPC[];
    agents: AgenticNPC[];
    movables: MovableObject[];
    mapObjects: IGameObject[];

    changeLayout(layoutName: string): void;
    getVisibleAgent(): AgenticNPC | null;
    getObjectsByTag(tag: string): IGameObject[];
    removeObject(instanceId: string): void;
    triggerCollectible(name: string): void;
    flipObject(instanceId: string): void;
}
