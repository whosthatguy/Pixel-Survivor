# Pixel Survivors

A Vampire Survivors-style roguelike web game built with [LittleJS](https://github.com/KilledByAPixel/LittleJS) engine.

![Pixel Survivors](https://img.shields.io/badge/Engine-LittleJS-blue) ![Status](https://img.shields.io/badge/Status-Playable-green)

## Play

Simply open `index.html` in your browser - no build step required!

Or play online: [GitHub Pages link coming soon]

## Features

- **3 Playable Classes**
  - **Warrior** - Heavy melee fighter with sword swing attacks and Berserker Rage ability
  - **Druid** - Shapeshifter with 4 unique forms (Human, Bear, Wolf, Lunar)
  - **Shaman** - Spirit caster with high damage projectiles and Ancestral Wrath lightning burst

- **Druid Shapeshifting System**
  | Form | Bonuses | Attack Style |
  |------|---------|--------------|
  | Human | Balanced stats | Nature's Wrath (ranged thorns) |
  | Bear | +50% HP, +30% damage, -20% speed | Claw Swipe (melee arc) |
  | Wolf | +40% speed, +20% crit chance | Bite (fast melee) |
  | Lunar | +50% spell damage, -30% HP | Moonfire (homing projectiles) |

- **5 Enemy Types**
  - Imp (fast demon)
  - Skeleton (basic undead)
  - Zombie (slow & tanky)
  - Demon Knight (elite armored)
  - Lich (ranged caster)

- **Procedural Pixel Art** - All 32x32 sprites are generated programmatically

- **Persistent Upgrades** - Spend gold between runs to permanently boost stats

- **Level-Up System** - Choose from random upgrades each level

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| Mouse | Aim attacks |
| Space | Special ability |
| 1-4 | Switch Druid forms |
| Shift | Cycle Druid forms |
| Escape | Pause |

## Tech Stack

- **Engine**: [LittleJS](https://github.com/KilledByAPixel/LittleJS) v1.17.11
- **Languages**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: localStorage for persistent upgrades
- **Dependencies**: None (LittleJS loaded from CDN)

## Project Structure

```
pixel-survivors/
├── index.html    # Main HTML with UI elements and styling
├── game.js       # All game logic (~2000 lines)
└── README.md     # This file
```

## Development

No build process needed. Just edit the files and refresh your browser.

To run locally:
1. Clone this repository
2. Open `index.html` in a web browser
3. Play!

## Credits

- Game engine: [LittleJS](https://github.com/KilledByAPixel/LittleJS) by Frank Force
- Inspired by [Vampire Survivors](https://store.steampowered.com/app/1794680/Vampire_Survivors/)

## License

MIT License - feel free to use this code for your own projects!
