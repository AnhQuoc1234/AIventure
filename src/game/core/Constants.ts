export const CONSTANTS = {
    GAME_LOGICAL_WIDTH: 384,
    GAME_LOGICAL_HEIGHT: 384,
    GRID_SIZE: 32,
    HALF_GRID: 16,
    PLAYER_SIZE: 32,
    PLAYER_SPAWN: 6, // (Spawn at a safe spot, e.g., 6,6)
    colors: {
        PLAYER: 0xf44336,
        EYES: 0xffffff,
        BG: 0x000000,
    },
    ZOOM: { X: 1, Y: 1 },
    TWEEN: {
        MOVE_DURATION: 120,
        BUMP_DURATION: 60
    },
    NPC_MOVE_INTERVAL: 2000,
    AGENT_MAX_TOOL_USE: 8,
    THOUGHT_BUBBLE: {
        DEFAULT_DURATION: 3000,
        SHORT_DURATION: 500,
        LONG_DURATION: 5000,
    },
    // 3d related constants
    GROUND_LEVEL: -2,
    camera: {
        TILT_X: 0.3,
        OFFSET_Y: -150,
        POS_Z: 500,
        NEAR: 0.1,
        FAR: 1000
    },
    gltfObject: {
        TILT_X: 0.6,
        POS_X: -20,
        POS_Y: -10,
        POS_Z: 20,
        SCALE: 2
    }
};

export const InteractionType = {
    CHAT: 'chat',
    DOOR: 'door',
    START: 'start',
    PORTAL: 'portal',
    LINK: 'link',
    TREASURE: 'treasure',
    MOVABLE: "movable",
    SLOT: "slot",
    SWITCH: "switch",
    MODEL: 'gemini',
    CODE: 'code',
    BUILD: 'build',
    COLLECTIBLE: 'collectible',
    AI_NPC: 'ai-npc',
} as const;

export const BehaviourName = {
    BLOCKER: 'BlockerBehaviour',
    INTERACTIVE: 'InteractiveBehaviour'
} as const;

export enum NPCMovementType
{
    IDLE = 0,
    RANDOM = 1,
    PATROL = 2,
    FOLLOW = 3
}

export enum Direction
{
    None,
    Up,
    Down,
    Left,
    Right,
}
