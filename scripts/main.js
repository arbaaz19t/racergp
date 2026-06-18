/**
 * main.js — Bootstrap Entry Point
 * 
 * Waits for the DOM to be fully loaded, then creates and
 * initializes the Game instance. Stores a global reference
 * for debugging purposes.
 * 
 * Depends on: RG.Game (and all its transitive dependencies)
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    window.addEventListener('DOMContentLoaded', function () {
        const canvas = document.getElementById('game-canvas');
        const uiContainer = document.getElementById('ui-container');

        if (!canvas || !uiContainer) {
            console.error('[NeonRacer] Could not find #game-canvas or #ui-container.');
            return;
        }

        // Create the game instance and kick everything off
        const game = new window.RacingGame.Game(canvas, uiContainer);
        game.init();

        // Expose for console debugging
        window.game = game;
    });
})();
