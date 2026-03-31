# AIventure

A 2D grid-based adventure game built with [Phaser 3](https://phaser.io/) and [Angular](https://angular.io/).

## Overview

AIventure is a top-down exploration game where players navigate a grid-based world, interact with objects, and explore different rooms. The project demonstrates how to integrate Phaser game instances within an Angular application, handling communication between the frameworks.

## Features

*   **Angular Integration:** Seamless embedding of game scenes within Angular components.
*   **Phaser 3 Renderer:** Optimized 2D Pixel Art rendering.
*   **Decoupled Architecture:** Core game logic (Entities, Grid, Physics) is completely separated from rendering code, located in `src/game/core/`.
*   **Data-Driven World:** Game levels, classes, and behaviors are loaded from external JSON data (`WorldData`).
*   **Grid-Based Movement:** Precise tile-based player movement and collision detection.
*   **Zelda-Style Camera:** Camera transitions between screen-sized rooms.
*   **Interactive Objects:** Support for blockers, chat interactions, and external links.
*   **Smart NPCs:** Autonomous characters that can patrol, follow the player, or execute AI-driven commands.
*   **Dual AI Integration:** Seamlessly powered by **Google Gemini** and **Gemma** to drive sophisticated NPC dialogues and dynamic puzzle-solving logic.

## UI in Angular

The UI is divided into 3 major sections:

*   **Left Panel:** Contains the "AIventure" header and a chat interface that displays messages from the game.
*   **Middle Panel:** A container centered in the page, hosting the active game instance (Phaser).
*   **Right Panel:** Features a tabbed interface with sections for Comments, Code, iFrame, and Logs.

## Project Structure

*   `src/app/`: Contains the Angular application logic.
    *   `components/`: UI components (chat, panels, modals).
    *   `phaser-game.component.ts`: The main wrapper component for the game view.
    *   `app.component.ts`: The main application orchestrator.
*   `src/game/`: Contains the game engine code.
    *   `core/`: **Renderer-Agnostic Logic**.
        *   `WorldData.ts`: Handles loading and parsing of game configuration.
        *   `GridManager.ts`: Manages the game grid and collisions.
        *   `Player.ts`, `NPC.ts`, `MovableObject.ts`: Pure logic entities.
        *   `BaseWorldBuilder.ts`, `BaseLevelManager.ts`: Base classes for world generation and level management.
        *   `InteractionSystem.ts`: Handles high-level game interactions.
        *   `trigger/`: **Rule-Based Trigger System**.
            *   `TriggerSystem.ts`: Core processing engine.
            *   `PuzzleRules.ts`: Game rules configuration.
            *   `actions/`: Action implementations.
        *   `EventBus.ts`: Central communication hub.
    *   `phaser/`: **Phaser 3 Implementation**.
        *   `scenes/`: Phaser scenes (Boot, Preloader, Game).
        *   `WorldBuilder.ts`, `LevelManager.ts`: Phaser-specific implementations extending Core base classes.

## Development

### Prerequisites

*   Node.js and npm installed.

### Installation

```bash
npm install
```

### Run Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

```bash
npm run dev
```

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

```bash
npm run build
```
