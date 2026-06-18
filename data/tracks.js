/**
 * tracks.js — Track definitions with themed environments.
 * Each track: control points, start grid, laps, and visual theme metadata.
 */
window.RacingGame = window.RacingGame || {};

window.RacingGame.TRACKS = [
    {
        id: 'forest',
        name: 'Forest Circuit',
        laps: 3,
        theme: 'forest',
        themeColors: {
            background: '#0a1a0a',
            grass: '#1a3d1a',
            grassAlt: '#143214',
            trackSurface: '#2a2a28',
            borderOuter: '#4caf50',
            borderInner: '#81c784',
            curb1: '#ff5722',
            curb2: '#ffffff',
            startLine: '#e8f5e9',
            roadside: '#2e5a2e'
        },
        controlPoints: [
            { x: 350,  y: 1200 },
            { x: 700,  y: 1200 },
            { x: 1050, y: 1200 },
            { x: 1400, y: 1150 },
            { x: 1600, y: 1000 },
            { x: 1650, y: 750 },
            { x: 1550, y: 500 },
            { x: 1350, y: 380 },
            { x: 1050, y: 350 },
            { x: 750,  y: 380 },
            { x: 500,  y: 450 },
            { x: 400,  y: 600 },
            { x: 450,  y: 780 },
            { x: 350,  y: 900 },
            { x: 400,  y: 1050 }
        ],
        startPositions: [
            { x: 420, y: 1180, angle: 0 },
            { x: 420, y: 1220, angle: 0 },
            { x: 370, y: 1180, angle: 0 },
            { x: 370, y: 1220, angle: 0 }
        ]
    },
    {
        id: 'desert',
        name: 'Desert Run',
        laps: 3,
        theme: 'desert',
        themeColors: {
            background: '#1a1408',
            grass: '#c2a060',
            grassAlt: '#a88848',
            trackSurface: '#3d3428',
            borderOuter: '#ff9800',
            borderInner: '#ffc107',
            curb1: '#e65100',
            curb2: '#fff8e1',
            startLine: '#fffde7',
            roadside: '#8d6e3a'
        },
        controlPoints: [
            { x: 300,  y: 1250 },
            { x: 650,  y: 1220 },
            { x: 1000, y: 1180 },
            { x: 1350, y: 1100 },
            { x: 1580, y: 920 },
            { x: 1620, y: 680 },
            { x: 1480, y: 450 },
            { x: 1200, y: 320 },
            { x: 850,  y: 300 },
            { x: 550,  y: 380 },
            { x: 380,  y: 550 },
            { x: 320,  y: 750 },
            { x: 380,  y: 950 },
            { x: 300,  y: 1100 }
        ],
        startPositions: [
            { x: 380, y: 1230, angle: 0.05 },
            { x: 380, y: 1270, angle: 0.05 },
            { x: 330, y: 1230, angle: 0.05 },
            { x: 330, y: 1270, angle: 0.05 }
        ]
    },
    {
        id: 'city',
        name: 'City Sprint',
        laps: 3,
        theme: 'city',
        themeColors: {
            background: '#0a0a14',
            grass: '#1a1a2e',
            grassAlt: '#141428',
            trackSurface: '#2a2a35',
            borderOuter: '#00bcd4',
            borderInner: '#e91e63',
            curb1: '#f44336',
            curb2: '#ffffff',
            startLine: '#e0e0e0',
            roadside: '#303050'
        },
        controlPoints: [
            { x: 400,  y: 1180 },
            { x: 750,  y: 1180 },
            { x: 1100, y: 1150 },
            { x: 1450, y: 1050 },
            { x: 1680, y: 850 },
            { x: 1700, y: 600 },
            { x: 1550, y: 400 },
            { x: 1250, y: 300 },
            { x: 900,  y: 320 },
            { x: 600,  y: 420 },
            { x: 420,  y: 600 },
            { x: 350,  y: 800 },
            { x: 400,  y: 1000 }
        ],
        startPositions: [
            { x: 450, y: 1160, angle: 0 },
            { x: 450, y: 1200, angle: 0 },
            { x: 400, y: 1160, angle: 0 },
            { x: 400, y: 1200, angle: 0 }
        ]
    },
    {
        id: 'night_highway',
        name: 'Night Highway',
        laps: 3,
        theme: 'night',
        themeColors: {
            background: '#020208',
            grass: '#0a0a18',
            grassAlt: '#060610',
            trackSurface: '#1a1a22',
            borderOuter: '#7c4dff',
            borderInner: '#00e5ff',
            curb1: '#ff1744',
            curb2: '#fafafa',
            startLine: '#ffffff',
            roadside: '#12122a'
        },
        controlPoints: [
            { x: 320,  y: 1220 },
            { x: 680,  y: 1210 },
            { x: 1040, y: 1190 },
            { x: 1380, y: 1120 },
            { x: 1650, y: 980 },
            { x: 1720, y: 720 },
            { x: 1600, y: 480 },
            { x: 1320, y: 340 },
            { x: 980,  y: 310 },
            { x: 640,  y: 360 },
            { x: 420,  y: 520 },
            { x: 340,  y: 720 },
            { x: 360,  y: 920 },
            { x: 320,  y: 1080 }
        ],
        startPositions: [
            { x: 390, y: 1200, angle: 0.02 },
            { x: 390, y: 1240, angle: 0.02 },
            { x: 340, y: 1200, angle: 0.02 },
            { x: 340, y: 1240, angle: 0.02 }
        ]
    }
];

/** AI difficulty presets — speed multipliers for 3 opponents. */
window.RacingGame.AI_PRESETS = {
    easy:   [0.78, 0.82, 0.86],
    medium: [0.88, 0.93, 0.97],
    hard:   [0.95, 0.98, 1.02]
};
