/**
 * cars.js — Vehicle definitions with per-car stats.
 * Unlock requirements stored here; persistence handled by StorageManager.
 */
window.RacingGame = window.RacingGame || {};

window.RacingGame.CARS = [
    {
        id: 'bolt',
        name: 'Bolt',
        color: '#00e5ff',
        accent: '#0088aa',
        style: 'sport',
        unlocked: true,
        unlockWins: 0,
        description: 'Balanced all-rounder. Great for learning the circuits.',
        maxSpeed: 350,
        acceleration: 250,
        brakeForce: 400,
        turnSpeed: 2.8,
        friction: 0.97,
        nitroCapacity: 100,
        nitroBoost: 1.45
    },
    {
        id: 'phoenix',
        name: 'Phoenix',
        color: '#ff6b00',
        accent: '#cc4400',
        style: 'muscle',
        unlocked: false,
        unlockWins: 2,
        description: 'High top speed. Win 2 races to unlock.',
        maxSpeed: 390,
        acceleration: 220,
        brakeForce: 380,
        turnSpeed: 2.4,
        friction: 0.965,
        nitroCapacity: 90,
        nitroBoost: 1.5
    },
    {
        id: 'viper',
        name: 'Viper',
        color: '#39ff14',
        accent: '#1a9900',
        style: 'agile',
        unlocked: false,
        unlockWins: 4,
        description: 'Razor-sharp handling. Win 4 races to unlock.',
        maxSpeed: 330,
        acceleration: 270,
        brakeForce: 420,
        turnSpeed: 3.2,
        friction: 0.975,
        nitroCapacity: 85,
        nitroBoost: 1.4
    },
    {
        id: 'titan',
        name: 'Titan',
        color: '#ff00e5',
        accent: '#aa0088',
        style: 'heavy',
        unlocked: false,
        unlockWins: 6,
        description: 'Tank-like stability. Win 6 races to unlock.',
        maxSpeed: 320,
        acceleration: 240,
        brakeForce: 450,
        turnSpeed: 2.6,
        friction: 0.98,
        nitroCapacity: 110,
        nitroBoost: 1.35
    },
    {
        id: 'spectre',
        name: 'Spectre',
        color: '#b388ff',
        accent: '#6a1b9a',
        style: 'hyper',
        unlocked: false,
        unlockWins: 10,
        description: 'Ultimate speed demon. Win 10 races to unlock.',
        maxSpeed: 410,
        acceleration: 280,
        brakeForce: 410,
        turnSpeed: 2.5,
        friction: 0.96,
        nitroCapacity: 95,
        nitroBoost: 1.6
    }
];

/** Apply car definition stats onto a Car instance. */
window.RacingGame.applyCarStats = function applyCarStats(car, carData) {
    if (!car || !carData) return;
    car.carId = carData.id;
    car.color = carData.color;
    car.accentColor = carData.accent;
    car.spriteStyle = carData.style;
    car.maxSpeed = carData.maxSpeed;
    car.acceleration = carData.acceleration;
    car.brakeForce = carData.brakeForce;
    car.turnSpeed = carData.turnSpeed;
    car.friction = carData.friction;
    car.nitroCapacity = carData.nitroCapacity;
    car.nitroBoost = carData.nitroBoost;
    car.nitro = carData.nitroCapacity;
};
