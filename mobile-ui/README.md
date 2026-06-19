# Neon Racer — Premium Mobile UI

AAA-quality mobile racing interface inspired by **Need for Speed Heat** and **CarX Street**.

Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Framer Motion**, and **React Three Fiber**.

## Features

### In-Race HUD (Landscape)
- **Top left:** Position, lap counter, live leaderboard with time gaps
- **Top right:** Race timer, nitro %, pause button, FPS counter
- **Bottom left:** Circular glowing minimap with checkpoints & opponents
- **Bottom right:** Futuristic speedometer (speed, gear, RPM arc, nitro, drift, boost)
- **Bottom center:** Race progress bar with checkpoint & position alerts
- **Touch controls:** Steering wheel + L/R buttons, gas, brake, drift, nitro

### Garage (CarX Street Style)
- **Left sidebar:** 14 customization categories with orange glow selection
- **Center:** 3D car viewer — rotate, pinch zoom, reflections, dynamic lighting
- **Bottom:** Horizontal parts carousel with buy/equip cards
- **Right panel:** Performance radar chart (current vs upgraded stats)

## Run Locally

```bash
cd mobile-ui
npm install
npm run dev
```

Open on a phone or use Chrome DevTools **landscape mobile** emulation.

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  components/
    hud/          HUD, Leaderboard, Minimap, Speedometer, RaceProgress
    controls/     MobileControls
    garage/       CarViewer3D, SidebarMenu, PartsCarousel, PerformanceRadar
  screens/        MenuScreen, RaceScreen, GarageScreen
  hooks/          useFPS, useRaceSimulation
  data/           mockData
  types/          TypeScript interfaces
```

## Integration

This UI layer is modular and can be wired to the canvas game in `../` by passing live race state into `<HUD race={...} />` and control events from `<MobileControls />`.
