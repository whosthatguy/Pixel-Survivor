// ============================================
// PIXEL SURVIVORS - Main Game File
// ============================================

'use strict';

// Game Constants
const TILE_SIZE = 32;
let WORLD_SIZE; // Initialized in gameInit

// Game State
let gameState = 'menu'; // menu, playing, paused, levelup, gameover
let selectedClass = 'warrior';
let player = null;
let enemies = [];
let projectiles = [];
let pickups = [];
let gameTime = 0;
let killCount = 0;
let goldCollected = 0;
let currentWave = 1;
let spawnTimer = 0;
let pendingLevelUps = 0; // Queue for level-ups
let vacuumPickups = []; // Pickups being vacuumed to player
let isPaused = false;

// Meta Progression (saved to localStorage)
let metaUpgrades = {
    maxHp: 0,
    damage: 0,
    speed: 0,
    xpGain: 0,
    gold: 0
};

// Upgrade costs
const UPGRADE_COSTS = {
    maxHp: 50,
    damage: 75,
    speed: 100,
    xpGain: 150
};

// ============================================
// SPRITE GENERATION
// ============================================

let spriteSheet;
let spriteTexture;
const SPRITE_SIZE = 32;
const SPRITES_PER_ROW = 8;

// Sprite indices based on sprite sheet layout (8 columns per row)
// Row 0: Warrior (0-3), Imp (4-7)
// Row 1: Druid Human (8-11), Skeleton (12-15)
// Row 2: Druid Bear (16-19), Zombie (20-23)
// Row 3: Druid Wolf (24-27), Demon Knight (28-31)
// Row 4: Druid Lunar (32-35), Lich (36-39)
// Row 5: Shaman (40-43)
const SPRITE_INDEX = {
    warrior: 0,
    druid_human: 8,
    druid_bear: 16,
    druid_wolf: 24,
    druid_lunar: 32,
    shaman: 40,
    // Enemies
    imp: 4,
    skeleton: 12,
    zombie: 20,
    demonKnight: 28,
    lich: 36
};

function generateSpriteSheet() {
    const canvas = document.createElement('canvas');
    const rows = 6;
    canvas.width = SPRITE_SIZE * SPRITES_PER_ROW;
    canvas.height = SPRITE_SIZE * rows;
    const ctx = canvas.getContext('2d');

    // Disable smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false;

    // Generate each character sprite
    generateWarriorSprites(ctx, 0, 0);
    generateDruidHumanSprites(ctx, 0, 1);
    generateDruidBearSprites(ctx, 0, 2);
    generateDruidWolfSprites(ctx, 0, 3);
    generateDruidLunarSprites(ctx, 0, 4);
    generateShamanSprites(ctx, 0, 5);

    // Enemy sprites on the right side
    generateImpSprites(ctx, 4, 0);
    generateSkeletonSprites(ctx, 4, 1);
    generateZombieSprites(ctx, 4, 2);
    generateDemonKnightSprites(ctx, 4, 3);
    generateLichSprites(ctx, 4, 4);

    return canvas;
}

function drawPixel(ctx, x, y, color, baseX, baseY) {
    ctx.fillStyle = color;
    ctx.fillRect(baseX + x * 2, baseY + y * 2, 2, 2);
}

function generateWarriorSprites(ctx, col, row) {
    const colors = {
        skin: '#e8b89d',
        armor: '#8b4513',
        armorLight: '#a0522d',
        armorDark: '#5c3010',
        helmet: '#708090',
        helmetLight: '#a0a0a0',
        sword: '#c0c0c0',
        swordHandle: '#4a3728'
    };

    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;

        // Helmet
        for (let x = 5; x <= 10; x++) {
            drawPixel(ctx, x, 2 + bounce, colors.helmet, baseX, baseY);
        }
        for (let x = 4; x <= 11; x++) {
            drawPixel(ctx, x, 3 + bounce, colors.helmet, baseX, baseY);
            drawPixel(ctx, x, 4 + bounce, x < 6 || x > 9 ? colors.helmet : colors.helmetLight, baseX, baseY);
        }

        // Face
        for (let x = 5; x <= 10; x++) {
            drawPixel(ctx, x, 5 + bounce, colors.skin, baseX, baseY);
            drawPixel(ctx, x, 6 + bounce, colors.skin, baseX, baseY);
        }

        // Body armor
        for (let y = 7; y <= 11; y++) {
            for (let x = 4; x <= 11; x++) {
                const c = (x === 4 || x === 11) ? colors.armorDark :
                         (x === 5 || x === 10) ? colors.armor : colors.armorLight;
                drawPixel(ctx, x, y + bounce, c, baseX, baseY);
            }
        }

        // Legs
        const legOffset = frame < 2 ? 0 : (frame === 2 ? 1 : -1);
        for (let y = 12; y <= 14; y++) {
            drawPixel(ctx, 5, y, colors.armorDark, baseX, baseY);
            drawPixel(ctx, 6, y, colors.armor, baseX, baseY);
            drawPixel(ctx, 9 + (y === 14 ? legOffset : 0), y, colors.armor, baseX, baseY);
            drawPixel(ctx, 10 + (y === 14 ? legOffset : 0), y, colors.armorDark, baseX, baseY);
        }

        // Sword (right side)
        for (let y = 4; y <= 12; y++) {
            drawPixel(ctx, 13, y + bounce, y < 6 ? colors.swordHandle : colors.sword, baseX, baseY);
        }
        drawPixel(ctx, 12, 4 + bounce, colors.sword, baseX, baseY);
        drawPixel(ctx, 14, 4 + bounce, colors.sword, baseX, baseY);
    }
}

function generateDruidHumanSprites(ctx, col, row) {
    const colors = {
        skin: '#e8b89d',
        hair: '#2d5016',
        robe: '#228b22',
        robeLight: '#32cd32',
        robeDark: '#006400',
        staff: '#8b4513',
        gem: '#90ee90'
    };

    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;

        // Hair
        for (let x = 5; x <= 10; x++) {
            drawPixel(ctx, x, 2 + bounce, colors.hair, baseX, baseY);
            drawPixel(ctx, x, 3 + bounce, colors.hair, baseX, baseY);
        }

        // Face
        for (let x = 5; x <= 10; x++) {
            drawPixel(ctx, x, 4 + bounce, colors.skin, baseX, baseY);
            drawPixel(ctx, x, 5 + bounce, colors.skin, baseX, baseY);
            drawPixel(ctx, x, 6 + bounce, colors.skin, baseX, baseY);
        }

        // Robe
        for (let y = 7; y <= 14; y++) {
            const width = Math.min(y - 4, 6);
            for (let x = 8 - width; x <= 7 + width; x++) {
                const c = (x <= 8 - width + 1 || x >= 7 + width - 1) ? colors.robeDark :
                         (x <= 8 - width + 2 || x >= 7 + width - 2) ? colors.robe : colors.robeLight;
                drawPixel(ctx, x, y + (y < 12 ? bounce : 0), c, baseX, baseY);
            }
        }

        // Staff
        for (let y = 3; y <= 14; y++) {
            drawPixel(ctx, 13, y + bounce, colors.staff, baseX, baseY);
        }
        drawPixel(ctx, 12, 2 + bounce, colors.gem, baseX, baseY);
        drawPixel(ctx, 13, 2 + bounce, colors.gem, baseX, baseY);
        drawPixel(ctx, 14, 2 + bounce, colors.gem, baseX, baseY);
        drawPixel(ctx, 13, 1 + bounce, colors.gem, baseX, baseY);
    }
}

function generateDruidBearSprites(ctx, col, row) {
    const colors = {
        fur: '#8b4513',
        furLight: '#a0522d',
        furDark: '#5c3317',
        nose: '#2f1810',
        eyes: '#2f1810',
        claws: '#3d3d3d'
    };

    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;

        // Bear head
        for (let x = 4; x <= 11; x++) {
            for (let y = 2; y <= 6; y++) {
                const c = (x === 4 || x === 11 || y === 2) ? colors.furDark :
                         (x === 5 || x === 10) ? colors.fur : colors.furLight;
                drawPixel(ctx, x, y + bounce, c, baseX, baseY);
            }
        }
        // Ears
        drawPixel(ctx, 3, 2 + bounce, colors.fur, baseX, baseY);
        drawPixel(ctx, 4, 1 + bounce, colors.fur, baseX, baseY);
        drawPixel(ctx, 11, 1 + bounce, colors.fur, baseX, baseY);
        drawPixel(ctx, 12, 2 + bounce, colors.fur, baseX, baseY);
        // Eyes and nose
        drawPixel(ctx, 5, 4 + bounce, colors.eyes, baseX, baseY);
        drawPixel(ctx, 10, 4 + bounce, colors.eyes, baseX, baseY);
        drawPixel(ctx, 7, 5 + bounce, colors.nose, baseX, baseY);
        drawPixel(ctx, 8, 5 + bounce, colors.nose, baseX, baseY);

        // Bear body (big and bulky)
        for (let y = 7; y <= 12; y++) {
            for (let x = 2; x <= 13; x++) {
                const c = (x <= 3 || x >= 12) ? colors.furDark :
                         (x <= 5 || x >= 10) ? colors.fur : colors.furLight;
                drawPixel(ctx, x, y + bounce, c, baseX, baseY);
            }
        }

        // Legs
        const legOffset = frame < 2 ? 0 : (frame === 2 ? 1 : -1);
        for (let y = 13; y <= 15; y++) {
            drawPixel(ctx, 3, y, colors.fur, baseX, baseY);
            drawPixel(ctx, 4, y, colors.furLight, baseX, baseY);
            drawPixel(ctx, 5, y, colors.fur, baseX, baseY);
            drawPixel(ctx, 10 + legOffset, y, colors.fur, baseX, baseY);
            drawPixel(ctx, 11 + legOffset, y, colors.furLight, baseX, baseY);
            drawPixel(ctx, 12 + legOffset, y, colors.fur, baseX, baseY);
        }
        // Claws
        drawPixel(ctx, 3, 15, colors.claws, baseX, baseY);
        drawPixel(ctx, 5, 15, colors.claws, baseX, baseY);
        drawPixel(ctx, 10 + legOffset, 15, colors.claws, baseX, baseY);
        drawPixel(ctx, 12 + legOffset, 15, colors.claws, baseX, baseY);
    }
}

function generateDruidWolfSprites(ctx, col, row) {
    const colors = {
        fur: '#505050',
        furLight: '#707070',
        furDark: '#303030',
        eyes: '#ffff00',
        nose: '#1a1a1a'
    };

    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const runOffset = frame < 2 ? 0 : (frame === 2 ? 2 : -1);

        // Wolf head (pointed snout)
        for (let x = 5; x <= 10; x++) {
            drawPixel(ctx, x, 4, colors.fur, baseX, baseY);
            drawPixel(ctx, x, 5, colors.furLight, baseX, baseY);
        }
        // Ears
        drawPixel(ctx, 5, 2, colors.fur, baseX, baseY);
        drawPixel(ctx, 5, 3, colors.furLight, baseX, baseY);
        drawPixel(ctx, 10, 2, colors.fur, baseX, baseY);
        drawPixel(ctx, 10, 3, colors.furLight, baseX, baseY);
        // Snout
        for (let x = 11; x <= 14; x++) {
            drawPixel(ctx, x, 5, colors.fur, baseX, baseY);
            drawPixel(ctx, x, 6, colors.furLight, baseX, baseY);
        }
        drawPixel(ctx, 14, 5, colors.nose, baseX, baseY);
        // Eyes
        drawPixel(ctx, 6, 4, colors.eyes, baseX, baseY);
        drawPixel(ctx, 9, 4, colors.eyes, baseX, baseY);

        // Wolf body (sleek, horizontal)
        for (let y = 6; y <= 9; y++) {
            for (let x = 3; x <= 12; x++) {
                const c = y === 6 ? colors.furDark :
                         y === 9 ? colors.furDark : colors.furLight;
                drawPixel(ctx, x, y, c, baseX, baseY);
            }
        }

        // Legs (4 legs, running animation)
        // Front legs
        drawPixel(ctx, 10, 10, colors.fur, baseX, baseY);
        drawPixel(ctx, 10, 11 + runOffset, colors.fur, baseX, baseY);
        drawPixel(ctx, 11, 10, colors.fur, baseX, baseY);
        drawPixel(ctx, 11, 11 - runOffset, colors.fur, baseX, baseY);
        // Back legs
        drawPixel(ctx, 4, 10, colors.fur, baseX, baseY);
        drawPixel(ctx, 4, 11 - runOffset, colors.fur, baseX, baseY);
        drawPixel(ctx, 5, 10, colors.fur, baseX, baseY);
        drawPixel(ctx, 5, 11 + runOffset, colors.fur, baseX, baseY);

        // Tail
        drawPixel(ctx, 2, 7, colors.fur, baseX, baseY);
        drawPixel(ctx, 1, 6, colors.fur, baseX, baseY);
        drawPixel(ctx, 0, 5, colors.furLight, baseX, baseY);
    }
}

function generateDruidLunarSprites(ctx, col, row) {
    const colors = {
        skin: '#c8b8d8',
        hair: '#4a0080',
        robe: '#1a0033',
        robeLight: '#2d0052',
        robeMid: '#220040',
        stars: '#ffffff',
        moon: '#fffacd',
        glow: '#9370db'
    };

    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;
        const glowPhase = frame % 2;

        // Mystical hair (flowing)
        for (let x = 4; x <= 11; x++) {
            drawPixel(ctx, x, 2 + bounce, colors.hair, baseX, baseY);
            drawPixel(ctx, x, 3 + bounce, colors.hair, baseX, baseY);
        }
        drawPixel(ctx, 3, 3 + bounce, colors.hair, baseX, baseY);
        drawPixel(ctx, 12, 3 + bounce, colors.hair, baseX, baseY);

        // Face (pale)
        for (let x = 5; x <= 10; x++) {
            drawPixel(ctx, x, 4 + bounce, colors.skin, baseX, baseY);
            drawPixel(ctx, x, 5 + bounce, colors.skin, baseX, baseY);
            drawPixel(ctx, x, 6 + bounce, colors.skin, baseX, baseY);
        }
        // Glowing eyes
        drawPixel(ctx, 6, 5 + bounce, colors.glow, baseX, baseY);
        drawPixel(ctx, 9, 5 + bounce, colors.glow, baseX, baseY);

        // Star-covered robe
        for (let y = 7; y <= 14; y++) {
            const width = Math.min(y - 4, 6);
            for (let x = 8 - width; x <= 7 + width; x++) {
                let c = colors.robe;
                if (x === 8 - width || x === 7 + width) c = colors.robeLight;
                else if ((x + y + frame) % 4 === 0) c = colors.stars;
                else if ((x + y) % 3 === 0) c = colors.robeMid;
                drawPixel(ctx, x, y + (y < 12 ? bounce : 0), c, baseX, baseY);
            }
        }

        // Floating moon orb
        const orbY = 3 + bounce + (glowPhase ? -1 : 0);
        drawPixel(ctx, 13, orbY, colors.moon, baseX, baseY);
        drawPixel(ctx, 14, orbY, colors.moon, baseX, baseY);
        drawPixel(ctx, 13, orbY + 1, colors.moon, baseX, baseY);
        drawPixel(ctx, 14, orbY + 1, colors.moon, baseX, baseY);
        // Glow effect
        if (glowPhase) {
            drawPixel(ctx, 12, orbY, colors.glow, baseX, baseY);
            drawPixel(ctx, 15, orbY + 1, colors.glow, baseX, baseY);
        }
    }
}

function generateShamanSprites(ctx, col, row) {
    const colors = {
        skin: '#8b6914',
        mask: '#deb887',
        maskDark: '#a08060',
        robe: '#4a0082',
        robeLight: '#6a2092',
        robeDark: '#2a0052',
        feathers: '#ff4500',
        feathers2: '#ffd700',
        staff: '#654321',
        skull: '#f0f0e0'
    };

    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;

        // Feather headdress
        drawPixel(ctx, 6, 0 + bounce, colors.feathers, baseX, baseY);
        drawPixel(ctx, 7, 0 + bounce, colors.feathers2, baseX, baseY);
        drawPixel(ctx, 8, 0 + bounce, colors.feathers, baseX, baseY);
        drawPixel(ctx, 9, 0 + bounce, colors.feathers2, baseX, baseY);
        drawPixel(ctx, 5, 1 + bounce, colors.feathers, baseX, baseY);
        drawPixel(ctx, 10, 1 + bounce, colors.feathers, baseX, baseY);

        // Tribal mask
        for (let x = 5; x <= 10; x++) {
            drawPixel(ctx, x, 2 + bounce, colors.mask, baseX, baseY);
            drawPixel(ctx, x, 3 + bounce, colors.mask, baseX, baseY);
            drawPixel(ctx, x, 4 + bounce, colors.maskDark, baseX, baseY);
        }
        // Mask eyes (hollow)
        drawPixel(ctx, 6, 3 + bounce, '#000000', baseX, baseY);
        drawPixel(ctx, 9, 3 + bounce, '#000000', baseX, baseY);
        // Mask mouth
        drawPixel(ctx, 7, 4 + bounce, '#000000', baseX, baseY);
        drawPixel(ctx, 8, 4 + bounce, '#000000', baseX, baseY);

        // Body showing below mask
        for (let x = 5; x <= 10; x++) {
            drawPixel(ctx, x, 5 + bounce, colors.skin, baseX, baseY);
            drawPixel(ctx, x, 6 + bounce, colors.skin, baseX, baseY);
        }

        // Robe
        for (let y = 7; y <= 14; y++) {
            const width = Math.min(y - 5, 5);
            for (let x = 8 - width; x <= 7 + width; x++) {
                const c = (x === 8 - width || x === 7 + width) ? colors.robeDark :
                         (x === 8 - width + 1 || x === 7 + width - 1) ? colors.robe : colors.robeLight;
                drawPixel(ctx, x, y + (y < 12 ? bounce : 0), c, baseX, baseY);
            }
        }

        // Spirit staff with skull
        for (let y = 4; y <= 14; y++) {
            drawPixel(ctx, 13, y + bounce, colors.staff, baseX, baseY);
        }
        // Skull on top
        drawPixel(ctx, 12, 2 + bounce, colors.skull, baseX, baseY);
        drawPixel(ctx, 13, 2 + bounce, colors.skull, baseX, baseY);
        drawPixel(ctx, 14, 2 + bounce, colors.skull, baseX, baseY);
        drawPixel(ctx, 12, 3 + bounce, colors.skull, baseX, baseY);
        drawPixel(ctx, 13, 3 + bounce, '#000000', baseX, baseY);
        drawPixel(ctx, 14, 3 + bounce, colors.skull, baseX, baseY);
    }
}

// Enemy sprite generators
function generateImpSprites(ctx, col, row) {
    const colors = { body: '#cc3333', bodyLight: '#ff5555', horns: '#880000', eyes: '#ffff00' };
    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;
        // Small demon body
        for (let y = 5; y <= 10; y++) {
            for (let x = 5; x <= 10; x++) {
                drawPixel(ctx, x, y + bounce, (x === 5 || x === 10) ? colors.body : colors.bodyLight, baseX, baseY);
            }
        }
        // Horns
        drawPixel(ctx, 5, 3 + bounce, colors.horns, baseX, baseY);
        drawPixel(ctx, 6, 4 + bounce, colors.horns, baseX, baseY);
        drawPixel(ctx, 10, 3 + bounce, colors.horns, baseX, baseY);
        drawPixel(ctx, 9, 4 + bounce, colors.horns, baseX, baseY);
        // Eyes
        drawPixel(ctx, 6, 6 + bounce, colors.eyes, baseX, baseY);
        drawPixel(ctx, 9, 6 + bounce, colors.eyes, baseX, baseY);
        // Legs
        drawPixel(ctx, 6, 11, colors.body, baseX, baseY);
        drawPixel(ctx, 9, 11, colors.body, baseX, baseY);
    }
}

function generateSkeletonSprites(ctx, col, row) {
    const colors = { bone: '#e8e8d0', boneDark: '#c8c8b0' };
    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;
        // Skull
        for (let x = 5; x <= 10; x++) {
            for (let y = 2; y <= 5; y++) {
                drawPixel(ctx, x, y + bounce, colors.bone, baseX, baseY);
            }
        }
        drawPixel(ctx, 6, 4 + bounce, '#000000', baseX, baseY);
        drawPixel(ctx, 9, 4 + bounce, '#000000', baseX, baseY);
        // Ribcage
        for (let y = 6; y <= 10; y++) {
            drawPixel(ctx, 5, y + bounce, colors.bone, baseX, baseY);
            drawPixel(ctx, 7, y + bounce, colors.boneDark, baseX, baseY);
            drawPixel(ctx, 8, y + bounce, colors.boneDark, baseX, baseY);
            drawPixel(ctx, 10, y + bounce, colors.bone, baseX, baseY);
        }
        // Legs
        const offset = frame === 2 ? 1 : frame === 3 ? -1 : 0;
        drawPixel(ctx, 6, 11, colors.bone, baseX, baseY);
        drawPixel(ctx, 6 + offset, 12, colors.bone, baseX, baseY);
        drawPixel(ctx, 9, 11, colors.bone, baseX, baseY);
        drawPixel(ctx, 9 - offset, 12, colors.bone, baseX, baseY);
    }
}

function generateZombieSprites(ctx, col, row) {
    const colors = { skin: '#4a7a4a', skinDark: '#3a5a3a', clothes: '#4a4a4a', blood: '#8b0000' };
    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;
        // Head
        for (let x = 5; x <= 10; x++) {
            for (let y = 2; y <= 6; y++) {
                drawPixel(ctx, x, y + bounce, colors.skin, baseX, baseY);
            }
        }
        drawPixel(ctx, 6, 4 + bounce, '#880000', baseX, baseY);
        drawPixel(ctx, 9, 4 + bounce, colors.skinDark, baseX, baseY);
        drawPixel(ctx, 7, 6 + bounce, colors.blood, baseX, baseY);
        // Body
        for (let y = 7; y <= 12; y++) {
            for (let x = 4; x <= 11; x++) {
                drawPixel(ctx, x, y + bounce, (y > 9) ? colors.clothes : colors.skin, baseX, baseY);
            }
        }
        // Arms reaching forward
        drawPixel(ctx, 12, 8 + bounce, colors.skin, baseX, baseY);
        drawPixel(ctx, 13, 8 + bounce, colors.skin, baseX, baseY);
        drawPixel(ctx, 3, 9 + bounce, colors.skin, baseX, baseY);
    }
}

function generateDemonKnightSprites(ctx, col, row) {
    const colors = { armor: '#2a0a0a', armorLight: '#4a1a1a', eyes: '#ff0000', sword: '#303030' };
    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;
        // Horned helmet
        drawPixel(ctx, 4, 1 + bounce, colors.armorLight, baseX, baseY);
        drawPixel(ctx, 11, 1 + bounce, colors.armorLight, baseX, baseY);
        for (let x = 4; x <= 11; x++) {
            for (let y = 2; y <= 5; y++) {
                drawPixel(ctx, x, y + bounce, colors.armor, baseX, baseY);
            }
        }
        drawPixel(ctx, 6, 4 + bounce, colors.eyes, baseX, baseY);
        drawPixel(ctx, 9, 4 + bounce, colors.eyes, baseX, baseY);
        // Heavy armor body
        for (let y = 6; y <= 13; y++) {
            for (let x = 3; x <= 12; x++) {
                drawPixel(ctx, x, y + bounce, (x === 3 || x === 12) ? colors.armorLight : colors.armor, baseX, baseY);
            }
        }
        // Dark sword
        for (let y = 2; y <= 13; y++) {
            drawPixel(ctx, 14, y + bounce, colors.sword, baseX, baseY);
        }
    }
}

function generateLichSprites(ctx, col, row) {
    const colors = { robe: '#1a0a2a', robeLight: '#2a1a4a', skull: '#d0d0c0', eyes: '#00ff88', magic: '#8800ff' };
    for (let frame = 0; frame < 4; frame++) {
        const baseX = (col + frame) * SPRITE_SIZE;
        const baseY = row * SPRITE_SIZE;
        const bounce = (frame % 2 === 1) ? -1 : 0;
        // Crown
        drawPixel(ctx, 6, 1 + bounce, colors.magic, baseX, baseY);
        drawPixel(ctx, 8, 1 + bounce, colors.magic, baseX, baseY);
        drawPixel(ctx, 10, 1 + bounce, colors.magic, baseX, baseY);
        // Skull face
        for (let x = 5; x <= 10; x++) {
            for (let y = 2; y <= 6; y++) {
                drawPixel(ctx, x, y + bounce, colors.skull, baseX, baseY);
            }
        }
        drawPixel(ctx, 6, 4 + bounce, colors.eyes, baseX, baseY);
        drawPixel(ctx, 9, 4 + bounce, colors.eyes, baseX, baseY);
        // Robe
        for (let y = 7; y <= 14; y++) {
            const w = Math.min(y - 5, 5);
            for (let x = 8 - w; x <= 7 + w; x++) {
                drawPixel(ctx, x, y + (y < 12 ? bounce : 0),
                    (x === 8 - w || x === 7 + w) ? colors.robeLight : colors.robe, baseX, baseY);
            }
        }
        // Magic orb
        drawPixel(ctx, 13, 5 + bounce, colors.magic, baseX, baseY);
        drawPixel(ctx, 14, 5 + bounce, colors.magic, baseX, baseY);
        if (frame % 2) drawPixel(ctx, 12, 4 + bounce, colors.magic, baseX, baseY);
    }
}

function getTileInfo(spriteIndex, frame = 0) {
    const totalIndex = spriteIndex + frame;
    const x = totalIndex % SPRITES_PER_ROW;
    const y = Math.floor(totalIndex / SPRITES_PER_ROW);
    const tileInfo = new TileInfo(vec2(x * SPRITE_SIZE, y * SPRITE_SIZE), vec2(SPRITE_SIZE, SPRITE_SIZE));
    tileInfo.textureInfo = spriteTexture;
    return tileInfo;
}

// ============================================
// CLASS DEFINITIONS
// ============================================

let CLASS_STATS; // Initialized in gameInit

function initClassStats() {
    CLASS_STATS = {
        warrior: {
            name: 'Warrior',
            maxHp: 120,
            speed: 0.08,
            damage: 15,
            color: new Color(0.8, 0.2, 0.2),
            weapon: 'swordSwing',
            special: 'berserkerRage'
        },
        druid: {
            name: 'Druid',
            maxHp: 100,
            speed: 0.088,
            damage: 10,
            color: new Color(0.2, 0.7, 0.3),
            weapon: 'naturesWrath',
            special: 'shapeshift',
            forms: {
                human: { hpMod: 1, speedMod: 1, damageMod: 1, weapon: 'naturesWrath' },
                bear: { hpMod: 1.5, speedMod: 0.8, damageMod: 1.3, weapon: 'clawSwipe' },
                wolf: { hpMod: 0.9, speedMod: 1.4, damageMod: 1.1, weapon: 'bite', critChance: 0.2 },
                lunar: { hpMod: 0.7, speedMod: 1, damageMod: 1.5, weapon: 'moonfire' }
            }
        },
        shaman: {
            name: 'Shaman',
            maxHp: 80,
            speed: 0.08,
            damage: 18,
            color: new Color(0.5, 0.2, 0.8),
            weapon: 'spiritBolt',
            special: 'ancestralWrath'
        }
    };
}

// ============================================
// ENEMY DEFINITIONS
// ============================================

let ENEMY_TYPES; // Initialized in gameInit

function initEnemyTypes() {
    ENEMY_TYPES = {
        imp: {
            name: 'Imp',
            hp: 10,
            damage: 5,
            speed: 0.06,
            xp: 1,
            color: new Color(1, 0.3, 0.3),
            size: 0.8,
            minWave: 1
        },
        skeleton: {
            name: 'Skeleton',
            hp: 20,
            damage: 8,
            speed: 0.04,
            xp: 2,
            color: new Color(0.9, 0.9, 0.8),
            size: 1,
            minWave: 1
        },
        zombie: {
            name: 'Zombie',
            hp: 40,
            damage: 12,
            speed: 0.025,
            xp: 3,
            color: new Color(0.3, 0.5, 0.3),
            size: 1.1,
            minWave: 3
        },
        demonKnight: {
            name: 'Demon Knight',
            hp: 80,
            damage: 20,
            speed: 0.035,
            xp: 10,
            color: new Color(0.4, 0.1, 0.1),
            size: 1.4,
            minWave: 5
        },
        lich: {
            name: 'Lich',
            hp: 50,
            damage: 15,
            speed: 0.03,
            xp: 8,
            color: new Color(0.3, 0.1, 0.5),
            size: 1.2,
            minWave: 7,
            ranged: true
        },
        reaper: {
            name: 'REAPER',
            hp: 99999,
            damage: 99999,
            speed: 0.15,
            xp: 0,
            color: new Color(0.1, 0.1, 0.1),
            size: 2.5,
            minWave: 999,
            isBoss: true
        }
    };
}

// Track if reaper has been spawned
let reaperSpawned = false;

// ============================================
// WEAPON DEFINITIONS
// ============================================

const WEAPONS = {
    swordSwing: {
        name: 'Sword Swing',
        damage: 1,
        cooldown: 0.8,
        range: 2,
        arc: Math.PI * 0.6,
        type: 'melee'
    },
    naturesWrath: {
        name: "Nature's Wrath",
        damage: 0.8,
        cooldown: 1,
        range: 6,
        projectiles: 3,
        spread: 0.3,
        type: 'projectile'
    },
    spiritBolt: {
        name: 'Spirit Bolt',
        damage: 1.2,
        cooldown: 0.6,
        range: 8,
        projectiles: 1,
        type: 'projectile'
    },
    clawSwipe: {
        name: 'Claw Swipe',
        damage: 1.3,
        cooldown: 0.5,
        range: 1.8,
        arc: Math.PI * 0.8,
        type: 'melee'
    },
    bite: {
        name: 'Bite',
        damage: 0.9,
        cooldown: 0.25,
        range: 1.2,
        arc: Math.PI * 0.4,
        type: 'melee'
    },
    moonfire: {
        name: 'Moonfire',
        damage: 1.5,
        cooldown: 0.9,
        range: 10,
        projectiles: 2,
        homing: true,
        type: 'projectile'
    },
    // Passive weapons (always active)
    holyOrbit: {
        name: 'Holy Orbit',
        damage: 0.5,
        orbitRadius: 2.5,
        orbitSpeed: 3.5,
        projectiles: 3,
        type: 'orbit'
    },
    garlicAura: {
        name: 'Garlic Aura',
        damage: 0.3,
        radius: 2,
        tickRate: 0.5,
        knockback: 0.15,
        type: 'aura'
    },
    boomerang: {
        name: 'Boomerang',
        damage: 0.8,
        cooldown: 1.5,
        range: 6,
        projectiles: 1,
        type: 'boomerang'
    },
    lightning: {
        name: 'Lightning',
        damage: 1.2,
        cooldown: 1.8,
        range: 10,
        strikes: 1,
        type: 'lightning'
    },
    throwingAxe: {
        name: 'Throwing Axe',
        damage: 1.5,
        cooldown: 2.0,
        projectiles: 1,
        penetration: 3,
        type: 'axe'
    }
};

// ============================================
// UPGRADE DEFINITIONS
// ============================================

const UPGRADES = [
    { id: 'maxHp', name: 'Max HP', desc: '+20 Maximum Health', stat: 'maxHp', value: 20 },
    { id: 'damage', name: 'Damage', desc: '+10% Damage', stat: 'damageMult', value: 0.1 },
    { id: 'speed', name: 'Speed', desc: '+10% Move Speed', stat: 'speedMult', value: 0.1 },
    { id: 'attackSpeed', name: 'Attack Speed', desc: '+15% Attack Speed', stat: 'attackSpeedMult', value: 0.15 },
    { id: 'pickupRange', name: 'Magnet', desc: '+50% Pickup Range', stat: 'pickupRange', value: 0.5 },
    { id: 'regen', name: 'Regeneration', desc: '+1 HP/sec', stat: 'regen', value: 1 },
    { id: 'armor', name: 'Armor', desc: '-10% Damage Taken', stat: 'armor', value: 0.1 },
    { id: 'luck', name: 'Luck', desc: '+10% Crit Chance', stat: 'critChance', value: 0.1 },
    // Passive weapons - level up increases damage, frequency, and projectiles
    { id: 'holyOrbit', name: 'Holy Orbit', desc: 'Orbiting orbs. Lvl+: +orb, +dmg', stat: 'passiveWeapon', value: 'holyOrbit', isWeapon: true },
    { id: 'garlicAura', name: 'Garlic Aura', desc: 'Damage aura. Lvl+: +area, +dmg', stat: 'passiveWeapon', value: 'garlicAura', isWeapon: true },
    { id: 'boomerang', name: 'Boomerang', desc: 'Returning blade. Lvl+: +speed, +dmg', stat: 'passiveWeapon', value: 'boomerang', isWeapon: true },
    { id: 'lightning', name: 'Lightning', desc: 'Random bolts. Lvl+: +strikes, +dmg', stat: 'passiveWeapon', value: 'lightning', isWeapon: true },
    { id: 'throwingAxe', name: 'Throwing Axe', desc: 'High dmg, penetrates. Lvl+: +axes', stat: 'passiveWeapon', value: 'throwingAxe', isWeapon: true }
];

// ============================================
// PLAYER CLASS
// ============================================

class Player extends EngineObject {
    constructor(pos, classType) {
        super(pos, vec2(1, 1));
        this.classType = classType;
        this.classData = CLASS_STATS[classType];

        // Apply meta upgrades
        const metaHpBonus = metaUpgrades.maxHp * 10;
        const metaDamageBonus = metaUpgrades.damage * 0.05;
        const metaSpeedBonus = metaUpgrades.speed * 0.05;

        // Base stats
        this.maxHp = this.classData.maxHp + metaHpBonus;
        this.hp = this.maxHp;
        this.baseSpeed = this.classData.speed * (1 + metaSpeedBonus);
        this.baseDamage = this.classData.damage * (1 + metaDamageBonus);

        // Modifiers (from upgrades)
        this.damageMult = 1;
        this.speedMult = 1;
        this.attackSpeedMult = 1;
        this.pickupRange = 2;
        this.regen = 0;
        this.armor = 0;
        this.critChance = 0;

        // XP and leveling
        this.xp = 0;
        this.level = 1;
        this.xpToLevel = 10;

        // Weapon
        this.currentWeapon = this.classData.weapon;
        this.weaponTimer = 0;
        this.weaponLevels = {};
        this.weaponLevels[this.currentWeapon] = 1;

        // Passive weapons (orbit, aura, etc.)
        this.passiveWeapons = {};
        this.orbitingProjectiles = [];
        this.auraEffect = null;
        this.auraDamageTimer = 0;
        this.boomerangTimer = 0;
        this.lightningTimer = 0;
        this.axeTimer = 0;

        // Druid specific
        this.currentForm = 'human';
        this.shapeshiftCooldown = 0;

        // Visual
        this.color = this.classData.color;
        this.renderOrder = 10;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.isMoving = false;
        this.facingLeft = false;

        // Invincibility frames
        this.invincibleTime = 0;

        // Special ability
        this.specialCooldown = 0;
        this.specialActive = false;
        this.specialDuration = 0;
    }

    update() {
        super.update();

        if (gameState !== 'playing') return;

        // Movement
        let moveDir = vec2(0, 0);
        if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) moveDir.y += 1;
        if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) moveDir.y -= 1;
        if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) moveDir.x -= 1;
        if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) moveDir.x += 1;

        if (moveDir.length() > 0) {
            moveDir = moveDir.normalize();
            let speed = this.baseSpeed * this.speedMult;

            // Apply form modifiers for druid
            if (this.classType === 'druid') {
                const formData = this.classData.forms[this.currentForm];
                speed *= formData.speedMod;
            }

            this.pos = this.pos.add(moveDir.scale(speed));
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }

        // Always track facing direction based on mouse (even when not moving)
        const toMouseFacing = mousePos.subtract(this.pos);
        this.facingLeft = toMouseFacing.x < 0;

        // Update animation
        this.animTimer += timeDelta;
        if (this.animTimer > 0.15) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        // Clamp to world bounds - horizontal is infinite, vertical is limited
        // Player can move left/right freely but has top/bottom limits
        const verticalLimit = 25; // How far up/down player can go from center
        const centerY = WORLD_SIZE.y / 2;
        this.pos.y = clamp(this.pos.y, centerY - verticalLimit, centerY + verticalLimit);

        // Update camera
        cameraPos = this.pos;

        // Weapon attack
        this.weaponTimer -= timeDelta;
        if (this.weaponTimer <= 0) {
            this.attack();
        }

        // Regeneration
        if (this.regen > 0) {
            this.hp = Math.min(this.maxHp, this.hp + this.regen * timeDelta);
            updateHUD();
        }

        // Invincibility
        if (this.invincibleTime > 0) {
            this.invincibleTime -= timeDelta;
        }

        // Shapeshift cooldown
        if (this.shapeshiftCooldown > 0) {
            this.shapeshiftCooldown -= timeDelta;
            updateFormButtons();
        }

        // Special ability cooldown
        if (this.specialCooldown > 0) {
            this.specialCooldown -= timeDelta;
        }

        // Special ability duration
        if (this.specialActive && this.specialDuration > 0) {
            this.specialDuration -= timeDelta;
            if (this.specialDuration <= 0) {
                this.endSpecial();
            }
        }

        // Druid form hotkeys
        if (this.classType === 'druid') {
            if (keyWasPressed('Digit1')) shapeshift('human');
            if (keyWasPressed('Digit2')) shapeshift('bear');
            if (keyWasPressed('Digit3')) shapeshift('wolf');
            if (keyWasPressed('Digit4')) shapeshift('lunar');
            if (keyWasPressed('ShiftLeft') || keyWasPressed('ShiftRight')) {
                const forms = ['human', 'bear', 'wolf', 'lunar'];
                const currentIndex = forms.indexOf(this.currentForm);
                const nextForm = forms[(currentIndex + 1) % forms.length];
                shapeshift(nextForm);
            }
        }

        // Special ability (Space)
        if (keyWasPressed('Space') && this.specialCooldown <= 0) {
            this.useSpecial();
        }

        // Pickup collection
        for (let pickup of pickups) {
            const dist = this.pos.distance(pickup.pos);
            if (dist < this.pickupRange) {
                // Move pickup toward player
                const dir = this.pos.subtract(pickup.pos).normalize();
                pickup.pos = pickup.pos.add(dir.scale(0.2));
            }
            if (dist < 0.5) {
                pickup.collect();
            }
        }

        // Update passive weapons
        this.updatePassiveWeapons();
    }

    updatePassiveWeapons() {
        // Update orbiting projectiles
        if (this.passiveWeapons.holyOrbit) {
            const weapon = WEAPONS.holyOrbit;
            const level = this.passiveWeapons.holyOrbit;
            const projectileCount = weapon.projectiles + Math.floor((level - 1) / 2);
            const radius = weapon.orbitRadius * (1 + (level - 1) * 0.1);
            const damage = this.baseDamage * weapon.damage * this.damageMult * (1 + (level - 1) * 0.2);

            // Create orbiting projectiles if needed
            while (this.orbitingProjectiles.length < projectileCount) {
                const orb = new OrbitingProjectile(this, this.orbitingProjectiles.length, projectileCount, radius, damage);
                this.orbitingProjectiles.push(orb);
            }

            // Update existing orbitals with new stats
            for (let i = 0; i < this.orbitingProjectiles.length; i++) {
                const orb = this.orbitingProjectiles[i];
                orb.updateStats(i, projectileCount, radius, damage);
            }
        }

        // Update aura damage
        if (this.passiveWeapons.garlicAura) {
            const weapon = WEAPONS.garlicAura;
            const level = this.passiveWeapons.garlicAura;
            const radius = weapon.radius * (1 + (level - 1) * 0.15);
            const damage = this.baseDamage * weapon.damage * this.damageMult * (1 + (level - 1) * 0.2);
            const knockback = weapon.knockback * (1 + (level - 1) * 0.1);

            this.auraDamageTimer -= timeDelta;
            if (this.auraDamageTimer <= 0) {
                this.auraDamageTimer = weapon.tickRate;

                // Damage all enemies in radius
                for (let enemy of enemies) {
                    const dist = this.pos.distance(enemy.pos);
                    if (dist < radius) {
                        enemy.takeDamage(damage);
                        // Apply knockback
                        const knockbackDir = enemy.pos.subtract(this.pos).normalize();
                        enemy.pos = enemy.pos.add(knockbackDir.scale(knockback));
                    }
                }
            }
        }

        // Update boomerang
        if (this.passiveWeapons.boomerang) {
            const weapon = WEAPONS.boomerang;
            const level = this.passiveWeapons.boomerang;
            const cooldown = weapon.cooldown / (1 + (level - 1) * 0.1);
            const damage = this.baseDamage * weapon.damage * this.damageMult * (1 + (level - 1) * 0.2);
            const range = weapon.range * (1 + (level - 1) * 0.1);
            const projectileCount = weapon.projectiles + Math.floor((level - 1) / 3);

            this.boomerangTimer -= timeDelta;
            if (this.boomerangTimer <= 0) {
                this.boomerangTimer = cooldown;

                // Find nearest enemy to aim at
                let targetDir = vec2(this.facingLeft ? -1 : 1, 0);
                if (enemies.length > 0) {
                    let nearest = null;
                    let nearestDist = Infinity;
                    for (let enemy of enemies) {
                        const dist = this.pos.distance(enemy.pos);
                        if (dist < nearestDist && dist < range * 2) {
                            nearestDist = dist;
                            nearest = enemy;
                        }
                    }
                    if (nearest) {
                        targetDir = nearest.pos.subtract(this.pos).normalize();
                    }
                }

                // Throw boomerang(s)
                for (let i = 0; i < projectileCount; i++) {
                    let dir = targetDir;
                    if (projectileCount > 1) {
                        const angleOffset = (i - (projectileCount - 1) / 2) * 0.4;
                        dir = targetDir.rotate(angleOffset);
                    }
                    new BoomerangProjectile(this.pos.add(dir.scale(0.3)), dir, damage, range, this);
                }
            }
        }

        // Update lightning
        if (this.passiveWeapons.lightning) {
            const weapon = WEAPONS.lightning;
            const level = this.passiveWeapons.lightning;
            const cooldown = weapon.cooldown / (1 + (level - 1) * 0.15);
            const damage = this.baseDamage * weapon.damage * this.damageMult * (1 + (level - 1) * 0.25);
            const range = weapon.range * (1 + (level - 1) * 0.1);
            const strikes = weapon.strikes + Math.floor((level - 1) / 2);

            this.lightningTimer -= timeDelta;
            if (this.lightningTimer <= 0 && enemies.length > 0) {
                this.lightningTimer = cooldown;

                // Strike multiple enemies
                for (let i = 0; i < strikes; i++) {
                    new LightningStrike(this, damage, range);
                }
            }
        }

        // Update throwing axe
        if (this.passiveWeapons.throwingAxe) {
            const weapon = WEAPONS.throwingAxe;
            const level = this.passiveWeapons.throwingAxe;
            const cooldown = weapon.cooldown / (1 + (level - 1) * 0.12);
            const damage = this.baseDamage * weapon.damage * this.damageMult * (1 + (level - 1) * 0.2);
            const penetration = weapon.penetration + Math.floor((level - 1) / 2);
            const projectileCount = weapon.projectiles + Math.floor((level - 1) / 3);

            this.axeTimer -= timeDelta;
            if (this.axeTimer <= 0 && enemies.length > 0) {
                this.axeTimer = cooldown;

                // Throw axes in spread pattern
                for (let i = 0; i < projectileCount; i++) {
                    const spreadAngle = (i - (projectileCount - 1) / 2) * 0.5;
                    new AxeProjectile(this.pos, damage, penetration, spreadAngle);
                }
            }
        }
    }

    attack() {
        let weaponKey = this.currentWeapon;

        // Druid form weapon override
        if (this.classType === 'druid') {
            const formData = this.classData.forms[this.currentForm];
            weaponKey = formData.weapon;
        }

        const weapon = WEAPONS[weaponKey];
        const level = this.weaponLevels[weaponKey] || 1;

        let cooldown = weapon.cooldown / this.attackSpeedMult;
        let damage = this.baseDamage * weapon.damage * this.damageMult * (1 + (level - 1) * 0.2);

        // Apply form damage modifier
        if (this.classType === 'druid') {
            const formData = this.classData.forms[this.currentForm];
            damage *= formData.damageMod;
        }

        // Apply berserker rage
        if (this.specialActive && this.classData.special === 'berserkerRage') {
            damage *= 1.5;
        }

        // Aim toward mouse position
        const toMouse = mousePos.subtract(this.pos);
        const attackDir = toMouse.length() > 0.1 ? toMouse.normalize() : vec2(1, 0);

        if (weapon.type === 'melee') {
            // Melee attack - hit all enemies in arc

            for (let enemy of enemies) {
                const toEnemy = enemy.pos.subtract(this.pos);
                const dist = toEnemy.length();
                if (dist <= weapon.range * (1 + (level - 1) * 0.15)) {
                    // Calculate angle difference with proper wrap-around handling
                    let angleDiff = Math.abs(toEnemy.angle() - attackDir.angle());
                    if (angleDiff > Math.PI) {
                        angleDiff = 2 * Math.PI - angleDiff;
                    }
                    if (angleDiff <= weapon.arc / 2) {
                        let finalDamage = damage;
                        // Crit check (wolf form)
                        let crit = this.critChance;
                        if (this.classType === 'druid' && this.currentForm === 'wolf') {
                            crit += 0.2;
                        }
                        if (Math.random() < crit) {
                            finalDamage *= 2;
                        }
                        enemy.takeDamage(finalDamage);
                    }
                }
            }

            // Visual effect
            new MeleeEffect(this.pos, attackDir, weapon.range, weapon.arc, this.classData.color);

        } else if (weapon.type === 'projectile') {
            // Projectile attack - aim toward mouse
            const projectileCount = weapon.projectiles + Math.floor((level - 1) / 2);

            for (let i = 0; i < projectileCount; i++) {
                let dir = attackDir;
                if (projectileCount > 1) {
                    const spreadAngle = weapon.spread || 0.2;
                    const angleOffset = (i - (projectileCount - 1) / 2) * spreadAngle;
                    // Use rotate() instead of manual cos/sin to handle LittleJS angle convention
                    dir = attackDir.rotate(angleOffset);
                }

                const proj = new Projectile(
                    this.pos.add(dir.scale(0.5)),
                    dir,
                    damage,
                    weapon.range,
                    weapon.homing,
                    this.classData.color
                );
                projectiles.push(proj);
            }
        }

        this.weaponTimer = cooldown;
    }

    useSpecial() {
        const special = this.classData.special;

        if (special === 'berserkerRage') {
            this.specialActive = true;
            this.specialDuration = 5;
            this.specialCooldown = 30;
            this.color = new Color(1, 0.5, 0);
        } else if (special === 'ancestralWrath') {
            // Lightning burst around player
            this.specialCooldown = 20;
            for (let enemy of enemies) {
                if (this.pos.distance(enemy.pos) < 5) {
                    enemy.takeDamage(this.baseDamage * 3);
                    new LightningEffect(this.pos, enemy.pos);
                }
            }
        }
    }

    endSpecial() {
        this.specialActive = false;
        this.color = this.classData.color;
    }

    takeDamage(amount) {
        if (this.invincibleTime > 0) return;

        // Apply armor
        amount *= (1 - this.armor);

        this.hp -= amount;
        this.invincibleTime = 0.5;

        updateHUD();

        // Flash red
        this.color = new Color(1, 0, 0);
        setTimeout(() => {
            if (this.classType === 'druid') {
                this.updateFormColor();
            } else {
                this.color = this.classData.color;
            }
        }, 100);

        if (this.hp <= 0) {
            gameOver();
        }
    }

    gainXP(amount) {
        // Apply meta XP bonus
        amount *= (1 + metaUpgrades.xpGain * 0.1);

        this.xp += amount;

        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
            // Queue the level-up instead of showing immediately
            pendingLevelUps++;
        }

        // Show level-up if not already showing and there are pending levels
        if (gameState === 'playing' && pendingLevelUps > 0) {
            showLevelUp();
        }

        updateHUD();
    }

    applyUpgrade(upgrade) {
        switch (upgrade.stat) {
            case 'maxHp':
                this.maxHp += upgrade.value;
                this.hp += upgrade.value;
                break;
            case 'damageMult':
                this.damageMult += upgrade.value;
                break;
            case 'speedMult':
                this.speedMult += upgrade.value;
                break;
            case 'attackSpeedMult':
                this.attackSpeedMult += upgrade.value;
                break;
            case 'pickupRange':
                this.pickupRange += upgrade.value;
                break;
            case 'regen':
                this.regen += upgrade.value;
                break;
            case 'armor':
                this.armor = Math.min(0.8, this.armor + upgrade.value);
                break;
            case 'critChance':
                this.critChance = Math.min(0.8, this.critChance + upgrade.value);
                break;
            case 'passiveWeapon':
                // Add or level up passive weapon
                if (this.passiveWeapons[upgrade.value]) {
                    this.passiveWeapons[upgrade.value]++;
                } else {
                    this.passiveWeapons[upgrade.value] = 1;
                }
                break;
        }
        updateHUD();
    }

    shapeshift(form) {
        if (this.classType !== 'druid') return;
        if (this.shapeshiftCooldown > 0) return;
        if (this.currentForm === form) return;

        const oldForm = this.classData.forms[this.currentForm];
        const newForm = this.classData.forms[form];

        // Adjust HP proportionally
        const hpPercent = this.hp / (this.maxHp * oldForm.hpMod);
        this.currentForm = form;
        this.hp = hpPercent * this.maxHp * newForm.hpMod;

        // Update visuals
        this.updateFormColor();

        // Set cooldown
        this.shapeshiftCooldown = 2;

        updateFormButtons();
        updateHUD();
    }

    updateFormColor() {
        const formColors = {
            human: new Color(0.2, 0.7, 0.3),
            bear: new Color(0.5, 0.3, 0.1),
            wolf: new Color(0.4, 0.4, 0.4),
            lunar: new Color(0.6, 0.5, 0.9)
        };
        this.color = formColors[this.currentForm];
    }

    render() {
        // Draw aura effect if active
        if (this.passiveWeapons.garlicAura) {
            const weapon = WEAPONS.garlicAura;
            const level = this.passiveWeapons.garlicAura;
            const radius = weapon.radius * (1 + (level - 1) * 0.15);

            // Multiple pulsing rings
            const pulse1 = 0.7 + Math.sin(time * 3) * 0.3;
            const pulse2 = 0.7 + Math.sin(time * 3 + Math.PI) * 0.3;

            // Inner glow
            drawRect(this.pos, vec2(radius * 1.2, radius * 1.2), new Color(0.3, 0.9, 0.3, 0.08));

            // Animated ring particles
            const particleCount = 8 + level * 2;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2 + time * 0.5;
                const particleRadius = radius * (0.85 + Math.sin(time * 4 + i) * 0.1);
                const particlePos = this.pos.add(vec2(Math.cos(angle) * particleRadius, Math.sin(angle) * particleRadius));
                const particleSize = 0.12 + Math.sin(time * 6 + i * 0.5) * 0.04;
                drawRect(particlePos, vec2(particleSize, particleSize), new Color(0.5, 1, 0.4, 0.7));
            }

            // Outer ring
            const segments = 32;
            for (let i = 0; i < segments; i++) {
                const angle1 = (i / segments) * Math.PI * 2;
                const angle2 = ((i + 1) / segments) * Math.PI * 2;
                const waveOffset = Math.sin(angle1 * 4 + time * 3) * 0.1;
                const r1 = radius * (1 + waveOffset);
                const r2 = radius * (1 + Math.sin(angle2 * 4 + time * 3) * 0.1);
                const p1 = this.pos.add(vec2(Math.cos(angle1) * r1, Math.sin(angle1) * r1));
                const p2 = this.pos.add(vec2(Math.cos(angle2) * r2, Math.sin(angle2) * r2));
                const segmentAlpha = 0.4 + Math.sin(angle1 * 2 + time * 2) * 0.2;
                drawLine(p1, p2, 0.1, new Color(0.4, 1, 0.4, segmentAlpha * pulse1));
            }

            // Inner subtle ring
            for (let i = 0; i < segments; i++) {
                const angle1 = (i / segments) * Math.PI * 2;
                const angle2 = ((i + 1) / segments) * Math.PI * 2;
                const p1 = this.pos.add(vec2(Math.cos(angle1) * radius * 0.6, Math.sin(angle1) * radius * 0.6));
                const p2 = this.pos.add(vec2(Math.cos(angle2) * radius * 0.6, Math.sin(angle2) * radius * 0.6));
                drawLine(p1, p2, 0.05, new Color(0.6, 1, 0.5, 0.2 * pulse2));
            }
        }

        // Get sprite index based on class and form
        let spriteIndex;
        if (this.classType === 'warrior') {
            spriteIndex = SPRITE_INDEX.warrior;
        } else if (this.classType === 'shaman') {
            spriteIndex = SPRITE_INDEX.shaman;
        } else if (this.classType === 'druid') {
            spriteIndex = SPRITE_INDEX['druid_' + this.currentForm];
        }

        // Get animation frame (use frames 2-3 when moving, 0-1 when idle)
        let frame = this.isMoving ? 2 + (this.animFrame % 2) : (this.animFrame % 2);

        // Draw sprite
        const formSize = this.classType === 'druid' && this.currentForm === 'bear' ? 1.5 : 1.2;
        const tileInfo = getTileInfo(spriteIndex, frame);

        // Flash white when invincible
        const drawColor = this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2 ?
            new Color(1, 1, 1) : new Color(1, 1, 1);

        drawTile(this.pos, vec2(formSize, formSize), tileInfo, drawColor, 0, this.facingLeft);
    }
}

// ============================================
// ENEMY CLASS
// ============================================

class Enemy extends EngineObject {
    constructor(pos, type) {
        const data = ENEMY_TYPES[type];
        super(pos, vec2(data.size, data.size));

        this.type = type;
        this.data = data;

        // Time-based scaling (exponential growth)
        const minutes = gameTime / 60;
        const timeScale = 1 + (minutes * 0.15) + Math.pow(minutes / 10, 2);
        const waveScale = 1 + (currentWave - 1) * 0.1;

        // Combined scaling
        const totalScale = timeScale * waveScale;

        // Boss enemies don't scale
        if (data.isBoss) {
            this.hp = data.hp;
            this.maxHp = this.hp;
            this.damage = data.damage;
            this.speed = data.speed;
        } else {
            this.hp = data.hp * totalScale;
            this.maxHp = this.hp;
            this.damage = data.damage * (1 + minutes * 0.08 + (currentWave - 1) * 0.05);
            this.speed = data.speed * (1 + minutes * 0.01); // Slight speed increase over time
        }

        this.xpValue = Math.ceil(data.xp * (1 + minutes * 0.05));

        this.color = data.color;
        this.damageTimer = 0;
        this.rangedTimer = 0;
        this.isBoss = data.isBoss || false;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.facingLeft = false;
        this.flashTimer = 0;
    }

    update() {
        super.update();

        if (gameState !== 'playing' || !player) return;

        // Move toward player
        const toPlayer = player.pos.subtract(this.pos);
        const dist = toPlayer.length();

        if (this.data.ranged && dist < 8 && dist > 4) {
            // Ranged enemy - stay at distance and shoot
            this.rangedTimer -= timeDelta;
            if (this.rangedTimer <= 0) {
                this.rangedTimer = 2;
                // Shoot at player
                const dir = toPlayer.normalize();
                const proj = new EnemyProjectile(this.pos, dir, this.damage);
                projectiles.push(proj);
            }
        } else {
            // Move toward player
            if (dist > 0.5) {
                const dir = toPlayer.normalize();
                this.pos = this.pos.add(dir.scale(this.speed));
            }
        }

        // Damage player on contact
        this.damageTimer -= timeDelta;
        if (dist < 0.8 && this.damageTimer <= 0) {
            player.takeDamage(this.damage);
            this.damageTimer = 1;
        }

        // Update animation
        this.animTimer += timeDelta;
        if (this.animTimer > 0.2) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        // Track facing direction
        if (player) {
            this.facingLeft = player.pos.x < this.pos.x;
        }

        // Flash timer
        if (this.flashTimer > 0) {
            this.flashTimer -= timeDelta;
        }
    }

    takeDamage(amount, isCrit = false) {
        this.hp -= amount;

        // Flash white
        this.flashTimer = 0.1;

        // Spawn floating damage number
        const numType = isCrit ? 'crit' : 'damage';
        const offsetPos = this.pos.add(vec2((Math.random() - 0.5) * 0.3, 0.3));
        new DamageNumber(offsetPos, amount, numType);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Spawn death effect
        const enemyColor = this.data.color || new Color(1, 0.3, 0.3);
        new DeathEffect(this.pos, enemyColor, this.data.size, this.type);

        // Drop XP
        new XPOrb(this.pos, this.xpValue);

        // Chance to drop gold (30%)
        if (Math.random() < 0.3) {
            new GoldPickup(this.pos, Math.ceil(this.xpValue * 2));
        }

        // Chance to drop health (10%)
        if (Math.random() < 0.1) {
            new HealthPickup(this.pos);
        }

        // Rare drops - Treasure Chest (1.5% - free upgrade)
        if (Math.random() < 0.015) {
            new TreasureChest(this.pos.add(vec2((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5)));
        }

        // Rare drops - Vacuum Crystal (0.8% - collect all pickups)
        if (Math.random() < 0.008) {
            new VacuumCrystal(this.pos.add(vec2((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5)));
        }

        // Remove from enemies array
        const index = enemies.indexOf(this);
        if (index > -1) enemies.splice(index, 1);

        killCount++;
        updateHUD();

        this.destroy();
    }

    render() {
        // Special rendering for Reaper boss
        if (this.isBoss) {
            this.renderReaper();
            return;
        }

        // Get sprite index for this enemy type
        const spriteIndex = SPRITE_INDEX[this.type];

        // Get tile info with animation frame
        const tileInfo = getTileInfo(spriteIndex, this.animFrame % 4);

        // Flash white when taking damage
        const drawColor = this.flashTimer > 0 ? new Color(1, 1, 1) : new Color(1, 1, 1);

        // Draw sprite
        const drawSize = this.data.size * 1.2;
        drawTile(this.pos, vec2(drawSize, drawSize), tileInfo, drawColor, 0, this.facingLeft);

        // Health bar
        if (this.hp < this.maxHp) {
            const barWidth = this.size.x;
            const barHeight = 0.15;
            const barPos = this.pos.add(vec2(0, this.size.y / 2 + 0.3));
            drawRect(barPos, vec2(barWidth, barHeight), new Color(0.3, 0.3, 0.3));
            drawRect(
                barPos.subtract(vec2((1 - this.hp / this.maxHp) * barWidth / 2, 0)),
                vec2(barWidth * (this.hp / this.maxHp), barHeight),
                new Color(1, 0, 0)
            );
        }
    }

    renderReaper() {
        const pulse = 1 + Math.sin(time * 4) * 0.1;
        const size = this.data.size * pulse;

        // Dark aura
        drawRect(this.pos, vec2(size * 2, size * 2), new Color(0, 0, 0, 0.3));
        drawRect(this.pos, vec2(size * 1.5, size * 1.5), new Color(0.1, 0, 0.1, 0.4));

        // Main body (dark hooded figure)
        drawRect(this.pos, vec2(size, size * 1.3), new Color(0.05, 0.05, 0.1, 1));

        // Hood
        drawRect(this.pos.add(vec2(0, size * 0.4)), vec2(size * 0.9, size * 0.6), new Color(0.02, 0.02, 0.05, 1));

        // Red eyes
        const eyeGlow = 0.7 + Math.sin(time * 8) * 0.3;
        drawRect(this.pos.add(vec2(-size * 0.15, size * 0.35)), vec2(0.15, 0.1), new Color(1, 0, 0, eyeGlow));
        drawRect(this.pos.add(vec2(size * 0.15, size * 0.35)), vec2(0.15, 0.1), new Color(1, 0, 0, eyeGlow));

        // Scythe
        const scytheAngle = Math.sin(time * 3) * 0.2;
        const scytheDir = vec2(Math.cos(scytheAngle - 0.5), Math.sin(scytheAngle - 0.5));
        const scytheStart = this.pos.add(vec2(size * 0.5, 0));
        const scytheEnd = scytheStart.add(scytheDir.scale(size * 1.2));
        drawLine(scytheStart, scytheEnd, 0.1, new Color(0.3, 0.3, 0.35, 1));

        // Scythe blade
        const bladePos = scytheEnd;
        const perpDir = vec2(-scytheDir.y, scytheDir.x);
        drawLine(bladePos, bladePos.add(perpDir.scale(size * 0.6)), 0.15, new Color(0.5, 0.5, 0.55, 1));

        // Floating particles
        for (let i = 0; i < 6; i++) {
            const particleAngle = time * 2 + (i / 6) * Math.PI * 2;
            const particleRadius = size * 0.8 + Math.sin(time * 3 + i) * 0.2;
            const particlePos = this.pos.add(vec2(
                Math.cos(particleAngle) * particleRadius,
                Math.sin(particleAngle) * particleRadius - size * 0.3
            ));
            const particleAlpha = 0.3 + Math.sin(time * 5 + i) * 0.2;
            drawRect(particlePos, vec2(0.1, 0.1), new Color(0.3, 0, 0.3, particleAlpha));
        }

        // Name tag
        const namePos = this.pos.add(vec2(0, size + 0.5));
        drawRect(namePos, vec2(2, 0.4), new Color(0.5, 0, 0, 0.8));
    }
}

// ============================================
// PROJECTILE CLASSES
// ============================================

class Projectile extends EngineObject {
    constructor(pos, dir, damage, range, homing, color) {
        super(pos, vec2(0.3, 0.3));
        this.dir = dir;
        this.damage = damage;
        this.range = range;
        this.homing = homing;
        this.speed = 0.2;
        this.distanceTraveled = 0;
        this.projectileColor = color;
        this.renderOrder = 5;
        this.trailPositions = [];
        this.rotation = Math.random() * Math.PI * 2;
    }

    update() {
        super.update();

        if (gameState !== 'playing') return;

        // Store trail positions
        this.trailPositions.unshift(this.pos.copy());
        if (this.trailPositions.length > 5) {
            this.trailPositions.pop();
        }

        // Spin effect
        this.rotation += 0.2;

        // Homing behavior - only after traveling some distance, with gentle correction
        if (this.homing && enemies.length > 0 && this.distanceTraveled > 2) {
            let nearest = null;
            let nearestDist = Infinity;
            for (let enemy of enemies) {
                const dist = this.pos.distance(enemy.pos);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            }
            if (nearest && nearestDist < 6) {
                const toTarget = nearest.pos.subtract(this.pos).normalize();
                this.dir = this.dir.lerp(toTarget, 0.03).normalize();
            }
        }

        this.pos = this.pos.add(this.dir.scale(this.speed));
        this.distanceTraveled += this.speed;

        // Check enemy collisions
        for (let enemy of enemies) {
            if (this.pos.distance(enemy.pos) < 0.5) {
                enemy.takeDamage(this.damage);
                // Spawn hit particles
                for (let i = 0; i < 3; i++) {
                    new HitParticle(this.pos, this.projectileColor);
                }
                this.remove();
                return;
            }
        }

        // Remove if traveled too far
        if (this.distanceTraveled > this.range) {
            this.remove();
        }
    }

    render() {
        const c = this.projectileColor;

        // Draw trail
        for (let i = 0; i < this.trailPositions.length; i++) {
            const alpha = (1 - i / this.trailPositions.length) * 0.5;
            const trailSize = 0.2 * (1 - i / this.trailPositions.length);
            drawRect(this.trailPositions[i], vec2(trailSize, trailSize), new Color(c.r, c.g, c.b, alpha));
        }

        // Outer glow
        const pulse = 1 + Math.sin(time * 10) * 0.1;
        drawRect(this.pos, vec2(0.4 * pulse, 0.4 * pulse), new Color(c.r, c.g, c.b, 0.3));

        // Main projectile body
        drawRect(this.pos, vec2(0.25, 0.25), new Color(c.r, c.g, c.b, 1));

        // Bright core
        drawRect(this.pos, vec2(0.12, 0.12), new Color(1, 1, 1, 0.9));

        // Sparkle for homing projectiles
        if (this.homing) {
            const sparkleAngle = time * 8;
            const sparkleOffset = vec2(Math.cos(sparkleAngle) * 0.15, Math.sin(sparkleAngle) * 0.15);
            drawRect(this.pos.add(sparkleOffset), vec2(0.08, 0.08), new Color(1, 1, 1, 0.7));
        }
    }

    remove() {
        const index = projectiles.indexOf(this);
        if (index > -1) projectiles.splice(index, 1);
        this.destroy();
    }
}

class EnemyProjectile extends EngineObject {
    constructor(pos, dir, damage) {
        super(pos, vec2(0.25, 0.25));
        this.dir = dir;
        this.damage = damage;
        this.speed = 0.1;
        this.distanceTraveled = 0;
        this.projectileColor = new Color(1, 0.2, 0.2);
        this.renderOrder = 5;
        this.trailPositions = [];
        this.rotation = 0;
    }

    update() {
        super.update();

        if (gameState !== 'playing' || !player) return;

        // Store trail
        this.trailPositions.unshift(this.pos.copy());
        if (this.trailPositions.length > 4) {
            this.trailPositions.pop();
        }

        this.rotation += 0.15;

        this.pos = this.pos.add(this.dir.scale(this.speed));
        this.distanceTraveled += this.speed;

        // Check player collision
        if (this.pos.distance(player.pos) < 0.5) {
            player.takeDamage(this.damage);
            this.remove();
            return;
        }

        // Remove if traveled too far
        if (this.distanceTraveled > 12) {
            this.remove();
        }
    }

    render() {
        // Draw trail
        for (let i = 0; i < this.trailPositions.length; i++) {
            const alpha = (1 - i / this.trailPositions.length) * 0.4;
            const trailSize = 0.15 * (1 - i / this.trailPositions.length);
            drawRect(this.trailPositions[i], vec2(trailSize, trailSize), new Color(1, 0.3, 0.1, alpha));
        }

        // Outer glow
        const pulse = 1 + Math.sin(time * 12) * 0.15;
        drawRect(this.pos, vec2(0.35 * pulse, 0.35 * pulse), new Color(1, 0.2, 0, 0.3));

        // Main body
        drawRect(this.pos, vec2(0.2, 0.2), new Color(1, 0.3, 0.1, 1));

        // Hot core
        drawRect(this.pos, vec2(0.1, 0.1), new Color(1, 0.8, 0.2, 1));
    }

    remove() {
        const index = projectiles.indexOf(this);
        if (index > -1) projectiles.splice(index, 1);
        this.destroy();
    }
}

// ============================================
// ORBITING PROJECTILE CLASS
// ============================================

class OrbitingProjectile extends EngineObject {
    constructor(owner, index, total, radius, damage) {
        super(owner.pos, vec2(0.5, 0.5));
        this.owner = owner;
        this.orbitIndex = index;
        this.totalOrbitals = total;
        this.orbitRadius = radius;
        this.damage = damage;
        this.orbitAngle = (index / total) * Math.PI * 2;
        this.orbitSpeed = WEAPONS.holyOrbit.orbitSpeed;
        this.damageCooldowns = new Map();
        this.renderOrder = 15;
        this.trailPositions = []; // Trail effect
        this.hitFlash = 0;
    }

    updateStats(index, total, radius, damage) {
        this.orbitIndex = index;
        this.totalOrbitals = total;
        this.orbitRadius = radius;
        this.damage = damage;
    }

    update() {
        super.update();

        if (gameState !== 'playing' || !this.owner) return;

        // Store previous position for trail
        this.trailPositions.unshift(this.pos.copy());
        if (this.trailPositions.length > 8) {
            this.trailPositions.pop();
        }

        // Rotate around player - using global time for consistent speed
        this.orbitAngle += this.orbitSpeed * timeDelta;

        // Calculate new position
        const offsetX = Math.cos(this.orbitAngle) * this.orbitRadius;
        const offsetY = Math.sin(this.orbitAngle) * this.orbitRadius;
        this.pos = this.owner.pos.add(vec2(offsetX, offsetY));

        // Update hit flash
        if (this.hitFlash > 0) this.hitFlash -= timeDelta;

        // Update damage cooldowns
        for (let [enemyId, cooldown] of this.damageCooldowns) {
            const newCooldown = cooldown - timeDelta;
            if (newCooldown <= 0) {
                this.damageCooldowns.delete(enemyId);
            } else {
                this.damageCooldowns.set(enemyId, newCooldown);
            }
        }

        // Check enemy collisions
        for (let enemy of enemies) {
            if (this.pos.distance(enemy.pos) < 0.7) {
                const enemyId = enemies.indexOf(enemy);
                if (!this.damageCooldowns.has(enemyId)) {
                    enemy.takeDamage(this.damage);
                    this.damageCooldowns.set(enemyId, 0.25);
                    this.hitFlash = 0.15;
                    // Spawn hit particles
                    new HitParticle(this.pos, new Color(1, 0.9, 0.4));
                }
            }
        }
    }

    render() {
        // Draw trail
        for (let i = 0; i < this.trailPositions.length; i++) {
            const alpha = (1 - i / this.trailPositions.length) * 0.4;
            const trailSize = 0.3 * (1 - i / this.trailPositions.length);
            drawRect(this.trailPositions[i], vec2(trailSize, trailSize), new Color(1, 0.8, 0.2, alpha));
        }

        // Pulsing effect
        const pulse = 1 + Math.sin(time * 8 + this.orbitIndex * 2) * 0.15;
        const baseSize = 0.45 * pulse;

        // Outer glow (larger, more transparent)
        drawRect(this.pos, vec2(baseSize * 2.2, baseSize * 2.2), new Color(1, 0.7, 0.1, 0.15));
        drawRect(this.pos, vec2(baseSize * 1.6, baseSize * 1.6), new Color(1, 0.8, 0.2, 0.3));

        // Main orb with gradient effect
        const mainColor = this.hitFlash > 0 ? new Color(1, 1, 1, 1) : new Color(1, 0.9, 0.3, 1);
        drawRect(this.pos, vec2(baseSize, baseSize), mainColor);

        // Inner bright core
        drawRect(this.pos, vec2(baseSize * 0.5, baseSize * 0.5), new Color(1, 1, 0.8, 1));

        // Sparkle effect
        const sparkleAngle = time * 10 + this.orbitIndex;
        const sparkleOffset = vec2(Math.cos(sparkleAngle) * baseSize * 0.3, Math.sin(sparkleAngle) * baseSize * 0.3);
        drawRect(this.pos.add(sparkleOffset), vec2(0.1, 0.1), new Color(1, 1, 1, 0.8));
    }

    remove() {
        const index = this.owner.orbitingProjectiles.indexOf(this);
        if (index > -1) this.owner.orbitingProjectiles.splice(index, 1);
        this.destroy();
    }
}

// ============================================
// BOOMERANG PROJECTILE CLASS
// ============================================

class BoomerangProjectile extends EngineObject {
    constructor(pos, dir, damage, range, owner) {
        super(pos, vec2(0.5, 0.5));
        this.startPos = pos.copy();
        this.dir = dir;
        this.damage = damage;
        this.range = range;
        this.owner = owner;
        this.speed = 0.18;
        this.distanceTraveled = 0;
        this.returning = false;
        this.rotation = 0;
        this.hitEnemies = new Set(); // Track hit enemies to avoid double hits
        this.renderOrder = 10;
        this.trailPositions = [];
        projectiles.push(this);
    }

    update() {
        super.update();

        if (gameState !== 'playing') return;

        // Store trail positions
        this.trailPositions.unshift(this.pos.copy());
        if (this.trailPositions.length > 6) {
            this.trailPositions.pop();
        }

        // Spin the boomerang
        this.rotation += 0.4;

        if (!this.returning) {
            // Moving outward
            this.pos = this.pos.add(this.dir.scale(this.speed));
            this.distanceTraveled += this.speed;

            if (this.distanceTraveled >= this.range) {
                this.returning = true;
                this.hitEnemies.clear(); // Can hit enemies again on return
            }
        } else {
            // Returning to player
            if (player) {
                const toPlayer = player.pos.subtract(this.pos);
                const dist = toPlayer.length();

                if (dist < 0.5) {
                    this.remove();
                    return;
                }

                this.dir = toPlayer.normalize();
                this.pos = this.pos.add(this.dir.scale(this.speed * 1.2));
            } else {
                this.remove();
                return;
            }
        }

        // Check enemy collisions
        for (let enemy of enemies) {
            if (!this.hitEnemies.has(enemy) && this.pos.distance(enemy.pos) < 0.7) {
                enemy.takeDamage(this.damage);
                this.hitEnemies.add(enemy);
                new HitParticle(this.pos, new Color(0.6, 0.4, 0.2));
            }
        }
    }

    render() {
        // Draw trail
        for (let i = 0; i < this.trailPositions.length; i++) {
            const alpha = (1 - i / this.trailPositions.length) * 0.5;
            const trailSize = 0.25 * (1 - i / this.trailPositions.length);
            drawRect(this.trailPositions[i], vec2(trailSize, trailSize), new Color(0.8, 0.6, 0.3, alpha));
        }

        // Spinning boomerang shape (cross pattern)
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        // Main body
        const armLength = 0.35;
        const armWidth = 0.12;

        // Draw as rotating cross shape
        for (let arm = 0; arm < 4; arm++) {
            const armAngle = this.rotation + (arm * Math.PI / 2);
            const armDir = vec2(Math.cos(armAngle), Math.sin(armAngle));
            const armEnd = this.pos.add(armDir.scale(armLength));

            // Arm gradient
            const baseColor = new Color(0.7, 0.5, 0.2, 1);
            const tipColor = new Color(0.9, 0.7, 0.3, 1);

            drawLine(this.pos, armEnd, armWidth, baseColor);
            drawRect(armEnd, vec2(0.1, 0.1), tipColor);
        }

        // Center
        drawRect(this.pos, vec2(0.15, 0.15), new Color(0.9, 0.8, 0.5, 1));

        // Motion blur glow when spinning fast
        drawRect(this.pos, vec2(0.5, 0.5), new Color(0.8, 0.6, 0.3, 0.2));
    }

    remove() {
        const index = projectiles.indexOf(this);
        if (index > -1) projectiles.splice(index, 1);
        this.destroy();
    }
}

// ============================================
// LIGHTNING STRIKE CLASS
// ============================================

class LightningStrike extends EngineObject {
    constructor(owner, damage, range) {
        super(owner.pos, vec2(1, 1));
        this.owner = owner;
        this.damage = damage;
        this.range = range;
        this.renderOrder = 25;

        // Find random enemy in range
        const enemiesInRange = enemies.filter(e => owner.pos.distance(e.pos) < range);
        if (enemiesInRange.length > 0) {
            this.target = enemiesInRange[Math.floor(Math.random() * enemiesInRange.length)];
            this.strikePos = this.target.pos.copy();
            this.target.takeDamage(damage);

            // Chain lightning effect
            this.segments = this.generateLightningPath(owner.pos, this.strikePos);
            this.lifetime = 0.25;
            this.maxLifetime = 0.25;

            // Spawn particles at strike point
            for (let i = 0; i < 5; i++) {
                new HitParticle(this.strikePos, new Color(0.5, 0.7, 1));
            }
        } else {
            this.lifetime = 0;
            this.destroy();
        }
    }

    generateLightningPath(start, end) {
        const segments = [];
        const numPoints = 8;
        const dir = end.subtract(start);
        const perpendicular = vec2(-dir.y, dir.x).normalize();

        let prevPoint = start;
        for (let i = 1; i <= numPoints; i++) {
            const t = i / numPoints;
            const basePoint = start.add(dir.scale(t));

            // Add jagged offset (less at start and end)
            const jitterAmount = Math.sin(t * Math.PI) * 0.8;
            const jitter = (Math.random() - 0.5) * jitterAmount;
            const point = basePoint.add(perpendicular.scale(jitter));

            segments.push({ start: prevPoint, end: point });
            prevPoint = point;
        }
        return segments;
    }

    update() {
        super.update();
        this.lifetime -= timeDelta;
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }

    render() {
        if (!this.segments) return;

        const alpha = this.lifetime / this.maxLifetime;
        const flash = Math.sin(time * 50) > 0 ? 1 : 0.7;

        // Draw each segment with glow
        for (let seg of this.segments) {
            // Outer glow
            drawLine(seg.start, seg.end, 0.25, new Color(0.3, 0.5, 1, alpha * 0.3));
            // Main bolt
            drawLine(seg.start, seg.end, 0.12, new Color(0.6, 0.8, 1, alpha * flash));
            // Core
            drawLine(seg.start, seg.end, 0.05, new Color(1, 1, 1, alpha));
        }

        // Strike point flash
        if (this.strikePos) {
            const flashSize = 0.8 * alpha;
            drawRect(this.strikePos, vec2(flashSize * 2, flashSize * 2), new Color(0.5, 0.7, 1, alpha * 0.3));
            drawRect(this.strikePos, vec2(flashSize, flashSize), new Color(0.8, 0.9, 1, alpha * 0.6));
        }
    }
}

// ============================================
// AXE PROJECTILE CLASS
// ============================================

class AxeProjectile extends EngineObject {
    constructor(pos, damage, penetration, spreadAngle) {
        super(pos, vec2(0.6, 0.6));
        this.damage = damage;
        this.penetration = penetration;
        this.hitCount = 0;

        // Axe throws upward then falls down
        this.velocityX = Math.sin(spreadAngle) * 0.08;
        this.velocityY = 0.25; // Initial upward velocity
        this.gravity = 0.008;

        this.rotation = 0;
        this.rotationSpeed = 0.35;
        this.trailPositions = [];
        this.hitEnemies = new Set();
        this.renderOrder = 12;
        this.lifetime = 4; // Max lifetime

        projectiles.push(this);
    }

    update() {
        super.update();

        if (gameState !== 'playing') return;

        // Store trail
        this.trailPositions.unshift(this.pos.copy());
        if (this.trailPositions.length > 8) {
            this.trailPositions.pop();
        }

        // Apply gravity - axe goes up then falls
        this.velocityY -= this.gravity;

        // Move axe
        this.pos.x += this.velocityX;
        this.pos.y += this.velocityY;

        // Spin faster as it falls
        const fallSpeed = Math.abs(this.velocityY);
        this.rotation += this.rotationSpeed + fallSpeed * 0.5;

        // Lifetime
        this.lifetime -= timeDelta;
        if (this.lifetime <= 0) {
            this.remove();
            return;
        }

        // Check enemy collisions - can penetrate multiple enemies
        for (let enemy of enemies) {
            if (!this.hitEnemies.has(enemy) && this.pos.distance(enemy.pos) < 0.8) {
                enemy.takeDamage(this.damage);
                this.hitEnemies.add(enemy);
                this.hitCount++;

                // Spawn hit particles
                for (let i = 0; i < 4; i++) {
                    new HitParticle(this.pos, new Color(0.6, 0.6, 0.6));
                }

                // Remove if exceeded penetration
                if (this.hitCount >= this.penetration) {
                    this.remove();
                    return;
                }
            }
        }

        // Remove if way off screen (below player)
        if (player && this.pos.y < player.pos.y - 20) {
            this.remove();
        }
    }

    render() {
        // Draw trail
        for (let i = 0; i < this.trailPositions.length; i++) {
            const alpha = (1 - i / this.trailPositions.length) * 0.4;
            const trailSize = 0.3 * (1 - i / this.trailPositions.length);
            drawRect(this.trailPositions[i], vec2(trailSize, trailSize), new Color(0.5, 0.5, 0.5, alpha));
        }

        // Axe head (spinning)
        const axeSize = 0.5;

        // Draw axe shape - blade and handle
        for (let blade = 0; blade < 2; blade++) {
            const bladeAngle = this.rotation + blade * Math.PI;
            const bladeDir = vec2(Math.cos(bladeAngle), Math.sin(bladeAngle));

            // Blade
            const bladeEnd = this.pos.add(bladeDir.scale(axeSize));
            const bladeColor = new Color(0.7, 0.7, 0.75, 1);
            drawLine(this.pos, bladeEnd, 0.2, bladeColor);

            // Blade edge (sharper tip)
            const perpDir = vec2(-bladeDir.y, bladeDir.x);
            const edgePos = bladeEnd.add(perpDir.scale(0.15));
            drawLine(bladeEnd, edgePos, 0.1, new Color(0.85, 0.85, 0.9, 1));
        }

        // Handle
        const handleAngle = this.rotation + Math.PI / 2;
        const handleDir = vec2(Math.cos(handleAngle), Math.sin(handleAngle));
        const handleEnd = this.pos.add(handleDir.scale(axeSize * 0.6));
        drawLine(this.pos, handleEnd, 0.12, new Color(0.5, 0.35, 0.2, 1));

        // Center
        drawRect(this.pos, vec2(0.15, 0.15), new Color(0.4, 0.4, 0.45, 1));

        // Motion blur glow
        if (Math.abs(this.velocityY) > 0.1) {
            drawRect(this.pos, vec2(0.7, 0.7), new Color(0.6, 0.6, 0.7, 0.15));
        }
    }

    remove() {
        const index = projectiles.indexOf(this);
        if (index > -1) projectiles.splice(index, 1);
        this.destroy();
    }
}

// ============================================
// FLOATING DAMAGE NUMBER CLASS
// ============================================

class DamageNumber extends EngineObject {
    constructor(pos, damage, type = 'damage') {
        super(pos, vec2(0.5, 0.5));
        this.damageValue = Math.round(damage);
        this.type = type; // 'damage', 'crit', 'heal', 'playerDamage'
        this.lifetime = 0.9;
        this.maxLifetime = 0.9;
        this.velocity = vec2((Math.random() - 0.5) * 0.08, 0.12);
        this.renderOrder = 100;

        // Visual settings per type
        this.settings = {
            damage: { color: new Color(1, 1, 1), scale: 1, prefix: '' },
            crit: { color: new Color(1, 0.9, 0.2), scale: 1.5, prefix: '' },
            heal: { color: new Color(0.3, 1, 0.4), scale: 1, prefix: '+' },
            playerDamage: { color: new Color(1, 0.3, 0.3), scale: 1.2, prefix: '-' }
        };
    }

    update() {
        super.update();
        this.pos = this.pos.add(this.velocity);
        this.velocity.y *= 0.96;
        this.velocity.x *= 0.98;
        this.lifetime -= timeDelta;
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }

    render() {
        const progress = this.lifetime / this.maxLifetime;
        const alpha = progress;
        const setting = this.settings[this.type];
        const scale = setting.scale * (0.8 + progress * 0.4);

        // Pop-in effect at start
        const popScale = this.lifetime > this.maxLifetime - 0.1 ?
            1 + (this.maxLifetime - this.lifetime) * 3 : 1;

        const finalScale = scale * popScale;
        const text = setting.prefix + this.damageValue.toString();

        // Draw each digit
        const digitWidth = 0.25 * finalScale;
        const startX = this.pos.x - (text.length * digitWidth) / 2;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const digitPos = vec2(startX + i * digitWidth + digitWidth / 2, this.pos.y);

            // Outer glow for crits
            if (this.type === 'crit') {
                drawRect(digitPos, vec2(0.35 * finalScale, 0.45 * finalScale),
                    new Color(1, 0.7, 0, alpha * 0.3));
            }

            // Draw digit
            this.drawDigit(char, digitPos, finalScale, setting.color, alpha);
        }
    }

    drawDigit(char, pos, scale, color, alpha) {
        const s = 0.08 * scale;
        const c = new Color(color.r, color.g, color.b, alpha);

        // Simple block-based digit patterns
        const patterns = {
            '0': [[0,2],[1,2],[2,2],[0,1],[2,1],[0,0],[2,0],[0,-1],[2,-1],[0,-2],[1,-2],[2,-2]],
            '1': [[1,2],[1,1],[1,0],[1,-1],[1,-2]],
            '2': [[0,2],[1,2],[2,2],[2,1],[0,0],[1,0],[2,0],[0,-1],[0,-2],[1,-2],[2,-2]],
            '3': [[0,2],[1,2],[2,2],[2,1],[1,0],[2,0],[2,-1],[0,-2],[1,-2],[2,-2]],
            '4': [[0,2],[2,2],[0,1],[2,1],[0,0],[1,0],[2,0],[2,-1],[2,-2]],
            '5': [[0,2],[1,2],[2,2],[0,1],[0,0],[1,0],[2,0],[2,-1],[0,-2],[1,-2],[2,-2]],
            '6': [[0,2],[1,2],[2,2],[0,1],[0,0],[1,0],[2,0],[0,-1],[2,-1],[0,-2],[1,-2],[2,-2]],
            '7': [[0,2],[1,2],[2,2],[2,1],[2,0],[2,-1],[2,-2]],
            '8': [[0,2],[1,2],[2,2],[0,1],[2,1],[0,0],[1,0],[2,0],[0,-1],[2,-1],[0,-2],[1,-2],[2,-2]],
            '9': [[0,2],[1,2],[2,2],[0,1],[2,1],[0,0],[1,0],[2,0],[2,-1],[0,-2],[1,-2],[2,-2]],
            '+': [[1,1],[0,0],[1,0],[2,0],[1,-1]],
            '-': [[0,0],[1,0],[2,0]]
        };

        const pattern = patterns[char];
        if (pattern) {
            for (let p of pattern) {
                drawRect(pos.add(vec2(p[0] * s - s, p[1] * s)), vec2(s * 0.9, s * 0.9), c);
            }
        }
    }
}

// ============================================
// DEATH EFFECT CLASS
// ============================================

class DeathEffect extends EngineObject {
    constructor(pos, color, size, enemyType) {
        super(pos, vec2(size, size));
        this.particles = [];
        this.effectColor = color;
        this.enemyType = enemyType;

        // Different effects per enemy type
        const particleCount = this.getParticleCount(enemyType, size);
        const colors = this.getColors(enemyType, color);

        // Create burst of particles
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 0.08 + Math.random() * 0.12;
            const colorIndex = Math.floor(Math.random() * colors.length);

            this.particles.push({
                pos: pos.copy(),
                vel: vec2(Math.cos(angle) * speed, Math.sin(angle) * speed),
                size: 0.12 + Math.random() * 0.15,
                maxLife: 0.5 + Math.random() * 0.4,
                life: 0.5 + Math.random() * 0.4,
                color: colors[colorIndex],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3
            });
        }

        // Add center flash
        this.flashLife = 0.15;
        this.lifetime = 1.2;
        this.renderOrder = 18;
    }

    getParticleCount(type, size) {
        const counts = {
            imp: 10,
            skeleton: 14,
            zombie: 12,
            demonKnight: 18,
            lich: 16
        };
        return (counts[type] || 12) + Math.floor(size * 3);
    }

    getColors(type, baseColor) {
        const colorSets = {
            imp: [new Color(1, 0.4, 0.1), new Color(1, 0.6, 0.2), new Color(1, 0.2, 0)],
            skeleton: [new Color(0.9, 0.9, 0.85), new Color(0.7, 0.7, 0.65), new Color(1, 1, 0.95)],
            zombie: [new Color(0.3, 0.7, 0.3), new Color(0.4, 0.5, 0.2), new Color(0.2, 0.6, 0.2)],
            demonKnight: [new Color(0.6, 0.1, 0.1), new Color(0.4, 0.1, 0.2), new Color(0.8, 0.2, 0.1)],
            lich: [new Color(0.6, 0.3, 0.8), new Color(0.4, 0.2, 0.6), new Color(0.8, 0.5, 1)]
        };
        return colorSets[type] || [baseColor, baseColor.lerp ? baseColor.lerp(new Color(1,1,1), 0.3) : baseColor];
    }

    update() {
        super.update();

        // Update flash
        if (this.flashLife > 0) {
            this.flashLife -= timeDelta;
        }

        // Update particles
        for (let p of this.particles) {
            p.pos = p.pos.add(p.vel);
            p.vel = p.vel.scale(0.94);
            p.vel.y -= 0.002; // Slight gravity
            p.life -= timeDelta;
            p.rotation += p.rotSpeed;
        }

        this.particles = this.particles.filter(p => p.life > 0);
        this.lifetime -= timeDelta;

        if (this.lifetime <= 0 || this.particles.length === 0) {
            this.destroy();
        }
    }

    render() {
        // Initial flash
        if (this.flashLife > 0) {
            const flashAlpha = this.flashLife / 0.15;
            const flashSize = 1.5 * (1 - flashAlpha) + 0.5;
            drawRect(this.pos, vec2(flashSize, flashSize), new Color(1, 1, 1, flashAlpha * 0.6));
        }

        // Draw particles
        for (let p of this.particles) {
            const alpha = p.life / p.maxLife;
            const size = p.size * (0.5 + alpha * 0.5);
            const c = p.color;

            // Outer glow
            drawRect(p.pos, vec2(size * 1.5, size * 1.5), new Color(c.r, c.g, c.b, alpha * 0.2));

            // Main particle
            drawRect(p.pos, vec2(size, size), new Color(c.r, c.g, c.b, alpha));

            // Inner bright spot
            if (alpha > 0.5) {
                drawRect(p.pos, vec2(size * 0.4, size * 0.4), new Color(1, 1, 1, (alpha - 0.5) * 0.8));
            }
        }
    }
}

// ============================================
// HIT PARTICLE CLASS
// ============================================

class HitParticle extends EngineObject {
    constructor(pos, color) {
        super(pos, vec2(0.15, 0.15));
        this.particleColor = color;
        this.velocity = vec2(
            (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.15 + 0.05
        );
        this.lifetime = 0.3 + Math.random() * 0.2;
        this.maxLifetime = this.lifetime;
        this.renderOrder = 20;
    }

    update() {
        super.update();
        this.pos = this.pos.add(this.velocity);
        this.velocity = this.velocity.scale(0.95);
        this.lifetime -= timeDelta;
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }

    render() {
        const alpha = this.lifetime / this.maxLifetime;
        const size = 0.15 * alpha;
        const c = this.particleColor;
        drawRect(this.pos, vec2(size, size), new Color(c.r, c.g, c.b, alpha));
    }
}

// ============================================
// PICKUP CLASSES
// ============================================

class XPOrb extends EngineObject {
    constructor(pos, value) {
        super(pos, vec2(0.3, 0.3));
        this.value = value;
        this.color = new Color(0.2, 1, 0.2);
        this.bobOffset = Math.random() * Math.PI * 2;
        pickups.push(this);
    }

    collect() {
        player.gainXP(this.value);
        const index = pickups.indexOf(this);
        if (index > -1) pickups.splice(index, 1);
        this.destroy();
    }

    render() {
        const bob = Math.sin(time * 5 + this.bobOffset) * 0.05;
        const drawPos = this.pos.add(vec2(0, bob));

        // Size based on value
        const baseSize = 0.2 + Math.min(this.value / 10, 0.15);
        const pulse = 1 + Math.sin(time * 6 + this.bobOffset) * 0.15;
        const size = baseSize * pulse;

        // Outer glow
        drawRect(drawPos, vec2(size * 2.5, size * 2.5), new Color(0.2, 1, 0.3, 0.1));
        drawRect(drawPos, vec2(size * 1.8, size * 1.8), new Color(0.3, 1, 0.4, 0.2));

        // Main orb
        drawRect(drawPos, vec2(size, size), new Color(0.3, 0.95, 0.4, 1));

        // Inner bright core
        drawRect(drawPos, vec2(size * 0.5, size * 0.5), new Color(0.7, 1, 0.8, 1));
        drawRect(drawPos, vec2(size * 0.25, size * 0.25), new Color(1, 1, 1, 0.9));
    }
}

class GoldPickup extends EngineObject {
    constructor(pos, value) {
        super(pos, vec2(0.35, 0.35));
        this.value = value;
        this.color = new Color(1, 0.85, 0);
        this.bobOffset = Math.random() * Math.PI * 2;
        this.rotation = Math.random() * Math.PI * 2;
        pickups.push(this);
    }

    collect() {
        goldCollected += this.value;
        metaUpgrades.gold += this.value;
        saveProgress();
        updateHUD();
        const index = pickups.indexOf(this);
        if (index > -1) pickups.splice(index, 1);
        this.destroy();
    }

    render() {
        const bob = Math.sin(time * 4 + this.bobOffset) * 0.06;
        this.rotation += timeDelta * 0.8;
        const drawPos = this.pos.add(vec2(0, bob));

        // Size based on value
        const baseSize = 0.25 + Math.min(this.value / 20, 0.15);
        const pulse = 1 + Math.sin(time * 5 + this.bobOffset) * 0.1;
        const size = baseSize * pulse;

        // Outer glow
        drawRect(drawPos, vec2(size * 2.2, size * 2.2), new Color(1, 0.8, 0, 0.12));
        drawRect(drawPos, vec2(size * 1.6, size * 1.6), new Color(1, 0.85, 0.1, 0.25));

        // Coin shape (rotating)
        const coinWidth = size * (0.6 + Math.abs(Math.cos(this.rotation)) * 0.4);
        drawRect(drawPos, vec2(coinWidth, size), new Color(1, 0.8, 0.1, 1));

        // Coin shine
        const shineOffset = Math.cos(this.rotation) * size * 0.2;
        drawRect(drawPos.add(vec2(shineOffset, 0)), vec2(size * 0.15, size * 0.6), new Color(1, 0.95, 0.5, 0.8));

        // Sparkle
        const sparkleAlpha = 0.5 + Math.sin(time * 8 + this.bobOffset) * 0.5;
        drawRect(drawPos.add(vec2(0, size * 0.3)), vec2(0.08, 0.08), new Color(1, 1, 0.8, sparkleAlpha));
    }
}

class HealthPickup extends EngineObject {
    constructor(pos) {
        super(pos, vec2(0.4, 0.4));
        this.color = new Color(1, 0.3, 0.3);
        pickups.push(this);
    }

    collect() {
        player.hp = Math.min(player.maxHp, player.hp + 20);
        updateHUD();
        const index = pickups.indexOf(this);
        if (index > -1) pickups.splice(index, 1);
        this.destroy();
    }

    render() {
        // Heart shape
        const pulse = 1 + Math.sin(time * 4) * 0.1;
        const size = 0.35 * pulse;

        // Glow
        drawRect(this.pos, vec2(size * 2, size * 2), new Color(1, 0.3, 0.3, 0.2));

        // Heart body
        drawRect(this.pos, vec2(size, size), new Color(1, 0.2, 0.2, 1));
        drawRect(this.pos.add(vec2(0, size * 0.2)), vec2(size * 0.6, size * 0.6), new Color(1, 0.4, 0.4, 1));
    }
}

// ============================================
// TREASURE CHEST (3% drop - free upgrade)
// ============================================

class TreasureChest extends EngineObject {
    constructor(pos) {
        super(pos, vec2(0.6, 0.6));
        this.bobOffset = Math.random() * Math.PI * 2;
        this.sparkleTimer = 0;
        this.renderOrder = 8;
        pickups.push(this);
    }

    collect() {
        // Give player a free upgrade
        showLevelUp();

        // Spawn celebration particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const particleColor = new Color(1, 0.85, 0.2);
            new HitParticle(this.pos.add(vec2(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3)), particleColor);
        }

        const index = pickups.indexOf(this);
        if (index > -1) pickups.splice(index, 1);
        this.destroy();
    }

    render() {
        // Floating bob effect
        const bob = Math.sin(time * 3 + this.bobOffset) * 0.1;
        const drawPos = this.pos.add(vec2(0, bob));

        // Outer crystal glow (bright and pulsing)
        const glowPulse = 0.7 + Math.sin(time * 4) * 0.3;
        drawRect(drawPos, vec2(1.4 * glowPulse, 1.4 * glowPulse), new Color(1, 0.85, 0.1, 0.15));
        drawRect(drawPos, vec2(1.0 * glowPulse, 1.0 * glowPulse), new Color(1, 0.9, 0.3, 0.25));

        // Chest body (golden)
        drawRect(drawPos, vec2(0.55, 0.4), new Color(0.7, 0.5, 0.1, 1));
        drawRect(drawPos.add(vec2(0, 0.05)), vec2(0.5, 0.35), new Color(0.85, 0.65, 0.15, 1));

        // Chest lid
        drawRect(drawPos.add(vec2(0, 0.22)), vec2(0.55, 0.15), new Color(0.75, 0.55, 0.1, 1));

        // Chest lock/gem
        drawRect(drawPos.add(vec2(0, 0.05)), vec2(0.12, 0.12), new Color(1, 0.9, 0.4, 1));
        drawRect(drawPos.add(vec2(0, 0.05)), vec2(0.06, 0.06), new Color(1, 1, 0.8, 1));

        // Sparkle effects
        const sparkleCount = 4;
        for (let i = 0; i < sparkleCount; i++) {
            const sparkleAngle = time * 2 + (i / sparkleCount) * Math.PI * 2;
            const sparkleRadius = 0.4 + Math.sin(time * 5 + i) * 0.1;
            const sparklePos = drawPos.add(vec2(
                Math.cos(sparkleAngle) * sparkleRadius,
                Math.sin(sparkleAngle) * sparkleRadius + bob
            ));
            const sparkleAlpha = 0.5 + Math.sin(time * 8 + i * 2) * 0.5;
            drawRect(sparklePos, vec2(0.08, 0.08), new Color(1, 1, 0.8, sparkleAlpha));
        }

        // Light rays
        for (let i = 0; i < 4; i++) {
            const rayAngle = time * 0.5 + (i / 4) * Math.PI * 2;
            const rayEnd = drawPos.add(vec2(Math.cos(rayAngle) * 0.6, Math.sin(rayAngle) * 0.6));
            drawLine(drawPos, rayEnd, 0.03, new Color(1, 0.95, 0.5, 0.3 * glowPulse));
        }
    }
}

// ============================================
// VACUUM CRYSTAL (2% drop - sucks all pickups)
// ============================================

class VacuumCrystal extends EngineObject {
    constructor(pos) {
        super(pos, vec2(0.5, 0.5));
        this.bobOffset = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.renderOrder = 8;
        pickups.push(this);
    }

    collect() {
        // Start vacuum animation - pickups flow toward player
        for (let pickup of pickups) {
            if (pickup !== this && pickup.pos) {
                // Add to vacuum animation list
                vacuumPickups.push({
                    pickup: pickup,
                    startPos: pickup.pos.copy(),
                    progress: 0,
                    delay: Math.random() * 0.3 // Stagger the animations
                });
            }
        }

        // Big particle burst
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const dist = 0.5 + Math.random() * 0.3;
            const particleColor = new Color(0.5, 0.8, 1);
            new HitParticle(this.pos.add(vec2(Math.cos(angle) * dist, Math.sin(angle) * dist)), particleColor);
        }

        const index = pickups.indexOf(this);
        if (index > -1) pickups.splice(index, 1);
        this.destroy();
    }

    render() {
        // Floating and rotating
        const bob = Math.sin(time * 2.5 + this.bobOffset) * 0.15;
        this.rotation += timeDelta * 1.5;
        const drawPos = this.pos.add(vec2(0, bob));

        // Outer vacuum glow (cyan/blue)
        const glowPulse = 0.6 + Math.sin(time * 5) * 0.4;
        drawRect(drawPos, vec2(1.6 * glowPulse, 1.6 * glowPulse), new Color(0.3, 0.7, 1, 0.1));
        drawRect(drawPos, vec2(1.2 * glowPulse, 1.2 * glowPulse), new Color(0.4, 0.8, 1, 0.2));

        // Crystal shape (diamond)
        const crystalSize = 0.35;
        const points = 4;
        for (let i = 0; i < points; i++) {
            const angle1 = this.rotation + (i / points) * Math.PI * 2;
            const angle2 = this.rotation + ((i + 1) / points) * Math.PI * 2;
            const p1 = drawPos.add(vec2(Math.cos(angle1) * crystalSize, Math.sin(angle1) * crystalSize));
            const p2 = drawPos.add(vec2(Math.cos(angle2) * crystalSize, Math.sin(angle2) * crystalSize));

            // Crystal facets
            drawLine(drawPos, p1, 0.15, new Color(0.5, 0.85, 1, 0.9));
            drawLine(p1, p2, 0.1, new Color(0.7, 0.95, 1, 1));
        }

        // Inner bright core
        drawRect(drawPos, vec2(0.2, 0.2), new Color(0.8, 0.95, 1, 1));
        drawRect(drawPos, vec2(0.1, 0.1), new Color(1, 1, 1, 1));

        // Suction swirl particles
        const swirlCount = 6;
        for (let i = 0; i < swirlCount; i++) {
            const swirlAngle = time * 3 + (i / swirlCount) * Math.PI * 2;
            const swirlRadius = 0.5 + Math.sin(time * 4 + i) * 0.15;
            const swirlPos = drawPos.add(vec2(
                Math.cos(swirlAngle) * swirlRadius,
                Math.sin(swirlAngle) * swirlRadius
            ));
            const swirlAlpha = 0.4 + Math.sin(time * 6 + i * 1.5) * 0.4;
            drawRect(swirlPos, vec2(0.06, 0.06), new Color(0.6, 0.9, 1, swirlAlpha));
        }

        // Inward arrows/lines (showing suction)
        for (let i = 0; i < 4; i++) {
            const arrowAngle = time * -1 + (i / 4) * Math.PI * 2;
            const arrowStart = drawPos.add(vec2(Math.cos(arrowAngle) * 0.7, Math.sin(arrowAngle) * 0.7));
            const arrowEnd = drawPos.add(vec2(Math.cos(arrowAngle) * 0.35, Math.sin(arrowAngle) * 0.35));
            drawLine(arrowStart, arrowEnd, 0.04, new Color(0.5, 0.8, 1, 0.4 * glowPulse));
        }
    }
}

// ============================================
// VISUAL EFFECTS
// ============================================

class MeleeEffect extends EngineObject {
    constructor(pos, dir, range, arc, color) {
        super(pos, vec2(range * 2, range * 2));
        this.dir = dir;
        this.range = range;
        this.arc = arc;
        this.effectColor = color;
        this.lifetime = 0.2;
        this.maxLifetime = 0.2;
        this.renderOrder = 15;
    }

    update() {
        super.update();
        this.lifetime -= timeDelta;
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }

    render() {
        const progress = 1 - (this.lifetime / this.maxLifetime);
        const alpha = (1 - progress) * 0.8;
        const c = this.effectColor;

        // Expanding arc effect
        const currentRange = this.range * (0.3 + progress * 0.7);
        const segments = 12;
        const halfArc = this.arc / 2;

        // Draw filled arc segments
        for (let i = 0; i < segments; i++) {
            const angleOffset1 = -halfArc + (this.arc * i / segments);
            const angleOffset2 = -halfArc + (this.arc * (i + 1) / segments);

            const innerRange = currentRange * 0.3;
            const p1Inner = this.pos.add(this.dir.rotate(angleOffset1).scale(innerRange));
            const p2Inner = this.pos.add(this.dir.rotate(angleOffset2).scale(innerRange));
            const p1Outer = this.pos.add(this.dir.rotate(angleOffset1).scale(currentRange));
            const p2Outer = this.pos.add(this.dir.rotate(angleOffset2).scale(currentRange));

            // Gradient from inner to outer
            const innerAlpha = alpha * 0.6;
            const outerAlpha = alpha * 0.2;

            // Draw segment lines
            drawLine(p1Inner, p1Outer, 0.08, new Color(c.r, c.g, c.b, alpha * 0.5));
            drawLine(p1Outer, p2Outer, 0.12, new Color(c.r, c.g, c.b, alpha));
        }

        // Outer glow edge
        for (let i = 0; i < segments; i++) {
            const angleOffset1 = -halfArc + (this.arc * i / segments);
            const angleOffset2 = -halfArc + (this.arc * (i + 1) / segments);
            const p1 = this.pos.add(this.dir.rotate(angleOffset1).scale(currentRange));
            const p2 = this.pos.add(this.dir.rotate(angleOffset2).scale(currentRange));
            drawLine(p1, p2, 0.2, new Color(1, 1, 1, alpha * 0.3));
        }

        // Impact sparkles
        if (progress < 0.5) {
            const sparkleCount = 4;
            for (let i = 0; i < sparkleCount; i++) {
                const sparkleAngle = -halfArc + (this.arc * (i + 0.5) / sparkleCount);
                const sparklePos = this.pos.add(this.dir.rotate(sparkleAngle).scale(currentRange * 0.8));
                const sparkleSize = 0.1 * (1 - progress * 2);
                drawRect(sparklePos, vec2(sparkleSize, sparkleSize), new Color(1, 1, 1, alpha));
            }
        }
    }
}

class LightningEffect extends EngineObject {
    constructor(start, end) {
        super(start.lerp(end, 0.5), vec2(1, 1));
        this.start = start;
        this.end = end;
        this.lifetime = 0.2;
        this.renderOrder = 20;
    }

    update() {
        super.update();
        this.lifetime -= timeDelta;
        if (this.lifetime <= 0) {
            this.destroy();
        }
    }

    render() {
        const alpha = this.lifetime / 0.2;
        drawLine(this.start, this.end, 0.15, new Color(0.5, 0.5, 1, alpha));
    }
}

// ============================================
// ENEMY SPAWNING
// ============================================

function spawnEnemies() {
    spawnTimer -= timeDelta;

    // Spawn REAPER at 15 minutes (900 seconds)
    if (gameTime >= 900 && !reaperSpawned) {
        reaperSpawned = true;

        // Spawn reaper from a random direction
        const angle = Math.random() * Math.PI * 2;
        const distance = 20;
        const spawnPos = player.pos.add(vec2(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance
        ));

        const reaper = new Enemy(spawnPos, 'reaper');
        enemies.push(reaper);

        // Show warning message (flash screen)
        showReaperWarning();
    }

    if (spawnTimer <= 0) {
        // Determine spawn rate based on wave and time
        const minutes = gameTime / 60;
        const baseSpawnTime = Math.max(0.3, 2 - currentWave * 0.1 - minutes * 0.05);
        spawnTimer = baseSpawnTime;

        // Get available enemy types for current wave (exclude reaper)
        const availableTypes = Object.entries(ENEMY_TYPES)
            .filter(([type, data]) => data.minWave <= currentWave && !data.isBoss)
            .map(([type, _]) => type);

        // Spawn count increases over time
        const spawnCount = Math.min(5, 1 + Math.floor(currentWave / 3) + Math.floor(minutes / 5));

        for (let i = 0; i < spawnCount; i++) {
            // Random type weighted toward weaker enemies
            let type;
            const roll = Math.random();
            if (roll < 0.5) {
                type = availableTypes[0]; // Most common
            } else if (roll < 0.8) {
                type = availableTypes[Math.min(1, availableTypes.length - 1)];
            } else {
                type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            }

            // Spawn at edge of screen
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 5;
            const spawnPos = player.pos.add(vec2(
                Math.cos(angle) * distance,
                Math.sin(angle) * distance
            ));

            const enemy = new Enemy(spawnPos, type);
            enemies.push(enemy);
        }
    }
}

// Reaper warning effect
let reaperWarningTime = 0;

function showReaperWarning() {
    reaperWarningTime = 3; // 3 second warning
}

// ============================================
// UI FUNCTIONS
// ============================================

function showMainMenu() {
    gameState = 'menu';
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('classSelect').style.display = 'none';
    document.getElementById('upgradeShop').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('statsPanel').style.display = 'none';
    document.getElementById('weaponBar').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('druidForms').style.display = 'none';
}

function showClassSelect() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('classSelect').style.display = 'block';
    document.getElementById('gameOver').style.display = 'none';
    // Auto-select warrior by default
    selectClass('warrior');
}

function selectClass(classType) {
    selectedClass = classType;
    document.querySelectorAll('.class-card').forEach(card => card.classList.remove('selected'));
    document.getElementById('card-' + classType).classList.add('selected');
}

function showUpgradeShop() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('upgradeShop').style.display = 'block';
    document.getElementById('shopGold').textContent = metaUpgrades.gold;

    // Generate shop items
    const shopItems = document.getElementById('shopItems');
    shopItems.innerHTML = '';

    const upgrades = [
        { id: 'maxHp', name: '+10 Max HP', cost: 50 + metaUpgrades.maxHp * 25 },
        { id: 'damage', name: '+5% Damage', cost: 75 + metaUpgrades.damage * 50 },
        { id: 'speed', name: '+5% Speed', cost: 100 + metaUpgrades.speed * 75 },
        { id: 'xpGain', name: '+10% XP Gain', cost: 150 + metaUpgrades.xpGain * 100 }
    ];

    upgrades.forEach(upgrade => {
        const btn = document.createElement('button');
        btn.className = 'menu-btn';
        btn.textContent = `${upgrade.name} (${upgrade.cost}g) [Lv.${metaUpgrades[upgrade.id]}]`;
        btn.onclick = () => buyUpgrade(upgrade.id, upgrade.cost);
        if (metaUpgrades.gold < upgrade.cost) {
            btn.style.opacity = '0.5';
        }
        shopItems.appendChild(btn);
    });
}

function buyUpgrade(id, cost) {
    if (metaUpgrades.gold >= cost) {
        metaUpgrades.gold -= cost;
        metaUpgrades[id]++;
        saveProgress();
        showUpgradeShop();
    }
}

function startGame() {
    try {
        console.log('Starting game with class:', selectedClass);

        if (!selectedClass) {
            selectClass('warrior');
        }

        // Reset game state
        gameState = 'playing';
        gameTime = 0;
        killCount = 0;
        goldCollected = 0;
        currentWave = 1;
        spawnTimer = 0;
        pendingLevelUps = 0;
        reaperSpawned = false;
        reaperWarningTime = 0;
        vacuumPickups = [];

        // Clear existing entities
        enemies.forEach(e => e.destroy());
        projectiles.forEach(p => p.destroy());
        pickups.forEach(p => p.destroy());
        enemies = [];
        projectiles = [];
        pickups = [];

        console.log('Creating player at', WORLD_SIZE.scale(0.5));

        // Create player
        player = new Player(WORLD_SIZE.scale(0.5), selectedClass);

        console.log('Player created:', player);

        // Hide menus, show HUD
        document.getElementById('classSelect').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('statsPanel').style.display = 'block';

        // Show druid forms if druid
        if (selectedClass === 'druid') {
            document.getElementById('druidForms').style.display = 'flex';
            updateFormButtons();
        } else {
            document.getElementById('druidForms').style.display = 'none';
        }

        updateHUD();
        console.log('Game started successfully');
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Error starting game: ' + error.message);
    }
}

function updateHUD() {
    if (!player) return;

    let maxHp = player.maxHp;
    let currentHp = player.hp;

    // Apply form HP modifier for druid
    if (player.classType === 'druid') {
        const formData = player.classData.forms[player.currentForm];
        maxHp *= formData.hpMod;
    }

    const hpPercent = Math.max(0, (currentHp / maxHp) * 100);
    const xpPercent = (player.xp / player.xpToLevel) * 100;

    document.getElementById('hpBar').style.width = hpPercent + '%';
    document.getElementById('xpBar').style.width = xpPercent + '%';
    document.getElementById('levelText').textContent = player.level;
    document.getElementById('killsText').textContent = killCount;
    document.getElementById('goldText').textContent = goldCollected;

    // Format time
    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    document.getElementById('timeText').textContent =
        minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

    // Update stats panel
    updateStatsPanel();

    // Update weapon bar
    updateWeaponBar();
}

function updateStatsPanel() {
    if (!player) return;

    const dmgEl = document.getElementById('statDamage');
    const spdEl = document.getElementById('statSpeed');
    const atkEl = document.getElementById('statAttackSpeed');
    const armEl = document.getElementById('statArmor');
    const critEl = document.getElementById('statCrit');
    const regenEl = document.getElementById('statRegen');

    // Update values
    dmgEl.textContent = Math.round(player.damageMult * 100) + '%';
    spdEl.textContent = Math.round(player.speedMult * 100) + '%';
    atkEl.textContent = Math.round(player.attackSpeedMult * 100) + '%';
    armEl.textContent = Math.round(player.armor * 100) + '%';
    critEl.textContent = Math.round(player.critChance * 100) + '%';
    regenEl.textContent = player.regen.toFixed(1) + '/s';

    // Highlight buffed stats (above base)
    dmgEl.className = player.damageMult > 1 ? 'stat-value buffed' : 'stat-value';
    spdEl.className = player.speedMult > 1 ? 'stat-value buffed' : 'stat-value';
    atkEl.className = player.attackSpeedMult > 1 ? 'stat-value buffed' : 'stat-value';
    armEl.className = player.armor > 0 ? 'stat-value buffed' : 'stat-value';
    critEl.className = player.critChance > 0 ? 'stat-value buffed' : 'stat-value';
    regenEl.className = player.regen > 0 ? 'stat-value buffed' : 'stat-value';
}

function updateWeaponBar() {
    if (!player) return;

    const bar = document.getElementById('weaponBar');
    const weaponIds = ['holyOrbit', 'garlicAura', 'boomerang', 'lightning', 'throwingAxe'];

    // Check if player has any passive weapons
    const hasWeapons = weaponIds.some(id => player.passiveWeapons[id]);

    if (!hasWeapons) {
        bar.style.display = 'none';
        return;
    }

    bar.style.display = 'flex';

    // Build weapon slots with real-time cooldowns
    let html = '';
    for (let weaponId of weaponIds) {
        if (player.passiveWeapons[weaponId]) {
            const level = player.passiveWeapons[weaponId];
            const weapon = WEAPONS[weaponId];
            const iconInfo = getWeaponIcon(weaponId);

            // Calculate cooldown percentage for weapons with timers
            let cooldownPercent = 0;
            let isFiring = false;

            if (weaponId === 'boomerang' && weapon.cooldown) {
                const maxCooldown = weapon.cooldown / (1 + (level - 1) * 0.1);
                cooldownPercent = Math.max(0, player.boomerangTimer / maxCooldown * 100);
                isFiring = player.boomerangTimer <= 0.1;
            } else if (weaponId === 'lightning' && weapon.cooldown) {
                const maxCooldown = weapon.cooldown / (1 + (level - 1) * 0.15);
                cooldownPercent = Math.max(0, player.lightningTimer / maxCooldown * 100);
                isFiring = player.lightningTimer <= 0.1;
            } else if (weaponId === 'throwingAxe' && weapon.cooldown) {
                const maxCooldown = weapon.cooldown / (1 + (level - 1) * 0.12);
                cooldownPercent = Math.max(0, player.axeTimer / maxCooldown * 100);
                isFiring = player.axeTimer <= 0.1;
            }

            const firingClass = isFiring ? ' firing' : '';

            html += `
                <div class="weapon-slot${firingClass}" id="slot-${weaponId}">
                    <div style="font-size: 20px; color: ${iconInfo.color};">${iconInfo.icon}</div>
                    <span class="level-badge">${level}</span>
                    <span class="weapon-name">${iconInfo.name}</span>
                    ${cooldownPercent > 0 ? `<div class="cooldown-overlay" style="height: ${cooldownPercent}%;"></div>` : ''}
                </div>
            `;
        }
    }

    bar.innerHTML = html;
}

function getWeaponIcon(weaponId) {
    const icons = {
        holyOrbit: { icon: '&#10041;', name: 'Orbit', color: '#ffd700' },
        garlicAura: { icon: '&#9678;', name: 'Aura', color: '#44ff44' },
        boomerang: { icon: '&#10554;', name: 'Boom', color: '#aa7744' },
        lightning: { icon: '&#9889;', name: 'Bolt', color: '#4488ff' },
        throwingAxe: { icon: '&#9876;', name: 'Axe', color: '#888888' }
    };
    return icons[weaponId] || { icon: '?', name: '???', color: '#fff' };
}

function updateFormButtons() {
    if (!player || player.classType !== 'druid') return;

    const forms = ['human', 'bear', 'wolf', 'lunar'];
    forms.forEach(form => {
        const btn = document.getElementById('form-' + form);
        btn.classList.remove('active', 'cooldown');
        if (player.currentForm === form) {
            btn.classList.add('active');
        }
        if (player.shapeshiftCooldown > 0) {
            btn.classList.add('cooldown');
        }
    });
}

function shapeshift(form) {
    if (player && player.classType === 'druid') {
        player.shapeshift(form);
    }
}

function showLevelUp() {
    gameState = 'levelup';
    document.getElementById('levelUp').style.display = 'block';

    // Update header to show pending level-ups
    const header = document.querySelector('#levelUp h2');
    if (header) {
        if (pendingLevelUps > 1) {
            header.textContent = `LEVEL UP! (${pendingLevelUps} remaining)`;
        } else {
            header.textContent = 'LEVEL UP!';
        }
    }

    // Get random upgrades
    const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, 3);

    const container = document.getElementById('upgradeOptions');
    container.innerHTML = '';

    options.forEach(upgrade => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';

        // Show current level for weapons player already has
        let levelText = '';
        if (upgrade.isWeapon && player.passiveWeapons[upgrade.value]) {
            levelText = ` <span style="color:#44ff44;">(Lv.${player.passiveWeapons[upgrade.value]})</span>`;
        }

        card.innerHTML = `<h4>${upgrade.name}${levelText}</h4><p>${upgrade.desc}</p>`;
        card.onclick = () => chooseLevelUpgrade(upgrade);
        container.appendChild(card);
    });
}

function chooseLevelUpgrade(upgrade) {
    player.applyUpgrade(upgrade);

    // Decrement pending level-ups
    pendingLevelUps--;

    // Check if there are more pending level-ups
    if (pendingLevelUps > 0) {
        // Show next level-up after a brief delay
        setTimeout(() => {
            if (gameState === 'levelup') {
                showLevelUp();
            }
        }, 100);
    } else {
        document.getElementById('levelUp').style.display = 'none';
        gameState = 'playing';
    }
}

function gameOver() {
    gameState = 'gameover';

    document.getElementById('hud').style.display = 'none';
    document.getElementById('statsPanel').style.display = 'none';
    document.getElementById('weaponBar').style.display = 'none';
    document.getElementById('druidForms').style.display = 'none';
    document.getElementById('gameOver').style.display = 'block';

    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    document.getElementById('finalTime').textContent =
        minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    document.getElementById('finalKills').textContent = killCount;
    document.getElementById('finalGold').textContent = goldCollected;

    // Clean up
    if (player) {
        // Clean up orbiting projectiles
        for (let orb of player.orbitingProjectiles) {
            orb.destroy();
        }
        player.orbitingProjectiles = [];
        player.destroy();
        player = null;
    }
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pauseMenu').style.display = 'block';
    }
}

function resumeGame() {
    gameState = 'playing';
    document.getElementById('pauseMenu').style.display = 'none';
}

function quitToMenu() {
    if (player) {
        // Clean up orbiting projectiles
        for (let orb of player.orbitingProjectiles) {
            orb.destroy();
        }
        player.orbitingProjectiles = [];
        player.destroy();
        player = null;
    }
    enemies.forEach(e => e.destroy());
    projectiles.forEach(p => p.destroy());
    pickups.forEach(p => p.destroy());
    enemies = [];
    projectiles = [];
    pickups = [];

    showMainMenu();
}

// ============================================
// SAVE/LOAD
// ============================================

function saveProgress() {
    localStorage.setItem('pixelSurvivors', JSON.stringify(metaUpgrades));
}

function loadProgress() {
    const saved = localStorage.getItem('pixelSurvivors');
    if (saved) {
        metaUpgrades = JSON.parse(saved);
    }
}

// ============================================
// LITTLEJS ENGINE FUNCTIONS
// ============================================

function gameInit() {
    console.log('gameInit called');

    // Initialize LittleJS-dependent constants
    WORLD_SIZE = vec2(100, 100);

    // Enable pixelated rendering for crisp sprites
    tilesPixelated = true;

    // Generate sprite sheet
    spriteSheet = generateSpriteSheet();
    spriteTexture = new TextureInfo(spriteSheet);
    console.log('Sprite sheet generated');

    initClassStats();
    initEnemyTypes();

    // Set up canvas
    canvasFixedSize = vec2(1280, 720);
    cameraScale = 32;

    // Load saved progress
    loadProgress();

    // Show main menu
    showMainMenu();
    console.log('gameInit complete');
}

function gameUpdate() {
    if (gameState === 'playing') {
        gameTime += timeDelta;

        // Update wave
        currentWave = 1 + Math.floor(gameTime / 30);

        // Spawn enemies
        spawnEnemies();

        // Update vacuum pickups animation
        updateVacuumPickups();

        // Update HUD periodically
        updateHUD();
    }

    // Pause on Escape
    if (keyWasPressed('Escape')) {
        if (gameState === 'playing') {
            pauseGame();
        } else if (gameState === 'paused') {
            resumeGame();
        }
    }
}

// Update vacuum pickup animations
function updateVacuumPickups() {
    if (!player || vacuumPickups.length === 0) return;

    const toRemove = [];

    for (let i = 0; i < vacuumPickups.length; i++) {
        const vp = vacuumPickups[i];

        // Handle delay
        if (vp.delay > 0) {
            vp.delay -= timeDelta;
            continue;
        }

        // Update progress
        vp.progress += timeDelta * 3; // Speed of vacuum

        if (vp.progress >= 1) {
            // Collect the pickup
            if (vp.pickup && vp.pickup.collect) {
                // Remove from vacuum list before collecting
                toRemove.push(i);

                // Check if pickup still exists
                const pickupIndex = pickups.indexOf(vp.pickup);
                if (pickupIndex > -1) {
                    vp.pickup.collect();
                }
            }
        } else {
            // Animate toward player with easing
            const easeProgress = 1 - Math.pow(1 - vp.progress, 3); // Ease out cubic
            const targetPos = player.pos;

            // Curved path with slight spiral
            const spiralOffset = vec2(
                Math.sin(vp.progress * Math.PI * 4) * (1 - vp.progress) * 0.5,
                Math.cos(vp.progress * Math.PI * 4) * (1 - vp.progress) * 0.5
            );

            vp.pickup.pos = vp.startPos.lerp(targetPos, easeProgress).add(spiralOffset);

            // Spawn trail particles
            if (Math.random() < 0.3) {
                new HitParticle(vp.pickup.pos, new Color(0.4, 0.8, 1));
            }
        }
    }

    // Remove collected pickups from vacuum list (in reverse order)
    for (let i = toRemove.length - 1; i >= 0; i--) {
        vacuumPickups.splice(toRemove[i], 1);
    }
}

function gameUpdatePost() {
    // Post update logic if needed
}

function gameRender() {
    // Draw solid ground background
    const groundColor = new Color(0.15, 0.1, 0.2);
    drawRect(cameraPos, vec2(50, 50), groundColor);

    // Draw grid pattern - snap to grid coordinates to prevent flickering
    const gridColor = new Color(0.2, 0.15, 0.25);
    const gridSize = 4;
    const startX = Math.floor((cameraPos.x - 30) / gridSize) * gridSize;
    const startY = Math.floor((cameraPos.y - 20) / gridSize) * gridSize;

    for (let x = startX; x < cameraPos.x + 30; x += gridSize) {
        for (let y = startY; y < cameraPos.y + 20; y += gridSize) {
            // Checkerboard pattern based on fixed world position
            if (((x / gridSize) + (y / gridSize)) % 2 === 0) {
                drawRect(vec2(x, y), vec2(gridSize, gridSize), gridColor);
            }
        }
    }
}

function gameRenderPost() {
    if (gameState !== 'playing' || !player) return;

    // Draw visual barriers at top and bottom
    drawBarriers();

    // Draw reaper warning if active
    if (reaperWarningTime > 0) {
        drawReaperWarning();
        reaperWarningTime -= timeDelta;
    }

    // Draw minimap
    drawMinimap();
}

// Visual barriers at top and bottom
function drawBarriers() {
    const centerY = WORLD_SIZE.y / 2;
    const verticalLimit = 25;
    const topY = centerY + verticalLimit;
    const bottomY = centerY - verticalLimit;

    // Get camera-relative positions
    const screenTop = cameraPos.y + 12;
    const screenBottom = cameraPos.y - 12;

    // Draw top barrier if visible
    if (topY < screenTop + 5) {
        const barrierY = topY;
        const pulse = 0.5 + Math.sin(time * 3) * 0.2;

        // Warning zone gradient
        for (let i = 0; i < 5; i++) {
            const alpha = (0.15 - i * 0.03) * pulse;
            const y = barrierY - i * 0.5;
            drawRect(vec2(cameraPos.x, y), vec2(50, 0.5), new Color(1, 0.2, 0.2, alpha));
        }

        // Main barrier line
        drawRect(vec2(cameraPos.x, barrierY), vec2(50, 0.15), new Color(1, 0.3, 0.3, 0.8));

        // Barrier pattern
        for (let x = -25; x < 25; x += 2) {
            const xPos = cameraPos.x + x + Math.sin(time * 2 + x) * 0.2;
            drawRect(vec2(xPos, barrierY), vec2(0.3, 0.4), new Color(1, 0.4, 0.4, 0.6 * pulse));
        }
    }

    // Draw bottom barrier if visible
    if (bottomY > screenBottom - 5) {
        const barrierY = bottomY;
        const pulse = 0.5 + Math.sin(time * 3 + Math.PI) * 0.2;

        // Warning zone gradient
        for (let i = 0; i < 5; i++) {
            const alpha = (0.15 - i * 0.03) * pulse;
            const y = barrierY + i * 0.5;
            drawRect(vec2(cameraPos.x, y), vec2(50, 0.5), new Color(1, 0.2, 0.2, alpha));
        }

        // Main barrier line
        drawRect(vec2(cameraPos.x, barrierY), vec2(50, 0.15), new Color(1, 0.3, 0.3, 0.8));

        // Barrier pattern
        for (let x = -25; x < 25; x += 2) {
            const xPos = cameraPos.x + x + Math.sin(time * 2 + x) * 0.2;
            drawRect(vec2(xPos, barrierY), vec2(0.3, 0.4), new Color(1, 0.4, 0.4, 0.6 * pulse));
        }
    }
}

// Reaper warning screen effect
function drawReaperWarning() {
    const alpha = Math.min(1, reaperWarningTime) * 0.3;
    const flash = Math.sin(time * 10) > 0 ? 0.2 : 0;

    // Red screen flash
    drawRect(cameraPos, vec2(50, 30), new Color(0.5, 0, 0, alpha + flash));

    // Warning text position (center of screen)
    const textPos = cameraPos.add(vec2(0, 3));

    // Pulsing warning box
    const boxPulse = 1 + Math.sin(time * 8) * 0.1;
    drawRect(textPos, vec2(8 * boxPulse, 1.5 * boxPulse), new Color(0.3, 0, 0, 0.9));
    drawRect(textPos, vec2(7.5 * boxPulse, 1.2 * boxPulse), new Color(0.1, 0, 0, 1));

    // Skull icon representation
    const skullPos = textPos.add(vec2(-2.5, 0));
    drawRect(skullPos, vec2(0.6, 0.5), new Color(1, 1, 1, 0.9)); // Skull
    drawRect(skullPos.add(vec2(-0.15, 0.1)), vec2(0.12, 0.12), new Color(0, 0, 0, 1)); // Eye
    drawRect(skullPos.add(vec2(0.15, 0.1)), vec2(0.12, 0.12), new Color(0, 0, 0, 1)); // Eye
}

// Minimap in top-right corner
function drawMinimap() {
    // Minimap is drawn in screen space using the overlay canvas
    // Check if LittleJS overlay context exists
    if (typeof overlayContext === 'undefined' || !overlayContext) return;
    if (typeof overlayCanvas === 'undefined' || !overlayCanvas) return;

    const ctx = overlayContext;
    const mapSize = 120;
    const mapX = overlayCanvas.width - mapSize - 15;
    const mapY = 15;
    const mapScale = 3; // How many game units per pixel

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Calculate map center based on player position
    const centerX = mapX + mapSize / 2;
    const centerY = mapY + mapSize / 2;

    // Draw boundary indicators
    const centerGameY = WORLD_SIZE.y / 2;
    const verticalLimit = 25;
    const topBoundaryY = centerY - (player.pos.y - (centerGameY + verticalLimit)) / mapScale;
    const bottomBoundaryY = centerY - (player.pos.y - (centerGameY - verticalLimit)) / mapScale;

    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.lineWidth = 1;
    if (topBoundaryY > mapY && topBoundaryY < mapY + mapSize) {
        ctx.beginPath();
        ctx.moveTo(mapX, topBoundaryY);
        ctx.lineTo(mapX + mapSize, topBoundaryY);
        ctx.stroke();
    }
    if (bottomBoundaryY > mapY && bottomBoundaryY < mapY + mapSize) {
        ctx.beginPath();
        ctx.moveTo(mapX, bottomBoundaryY);
        ctx.lineTo(mapX + mapSize, bottomBoundaryY);
        ctx.stroke();
    }

    // Draw pickups (rare items only)
    for (let pickup of pickups) {
        const dx = (pickup.pos.x - player.pos.x) / mapScale;
        const dy = -(pickup.pos.y - player.pos.y) / mapScale;

        if (Math.abs(dx) < mapSize / 2 && Math.abs(dy) < mapSize / 2) {
            const px = centerX + dx;
            const py = centerY + dy;

            // Different colors for different pickups
            if (pickup instanceof TreasureChest) {
                ctx.fillStyle = '#ffd700'; // Gold for chests
                ctx.fillRect(px - 3, py - 3, 6, 6);
            } else if (pickup instanceof VacuumCrystal) {
                ctx.fillStyle = '#00ffff'; // Cyan for vacuum
                ctx.fillRect(px - 3, py - 3, 6, 6);
            } else if (pickup instanceof HealthPickup) {
                ctx.fillStyle = '#ff4444'; // Red for health
                ctx.fillRect(px - 2, py - 2, 4, 4);
            } else if (pickup instanceof XPOrb) {
                ctx.fillStyle = 'rgba(100, 255, 100, 0.5)'; // Faint green for XP
                ctx.fillRect(px - 1, py - 1, 2, 2);
            }
        }
    }

    // Draw enemies
    for (let enemy of enemies) {
        const dx = (enemy.pos.x - player.pos.x) / mapScale;
        const dy = -(enemy.pos.y - player.pos.y) / mapScale;

        if (Math.abs(dx) < mapSize / 2 && Math.abs(dy) < mapSize / 2) {
            const px = centerX + dx;
            const py = centerY + dy;

            if (enemy.isBoss) {
                // Reaper - large red dot
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Regular enemies - small red dots
                ctx.fillStyle = 'rgba(255, 80, 80, 0.7)';
                ctx.fillRect(px - 1, py - 1, 2, 2);
            }
        }
    }

    // Draw player (center, green triangle pointing up)
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 4);
    ctx.lineTo(centerX - 3, centerY + 3);
    ctx.lineTo(centerX + 3, centerY + 3);
    ctx.closePath();
    ctx.fill();

    // Minimap label
    ctx.fillStyle = '#888';
    ctx.font = '10px Courier New';
    ctx.fillText('MAP', mapX + 5, mapY + mapSize - 5);
}

// Start the engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
