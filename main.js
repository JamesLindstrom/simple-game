var gameTick = new CustomEvent('gameTick');

var keyPressed = {};
window.onkeyup = function(e) { keyPressed[e.keyCode] = false; }
window.onkeydown = function(e) { keyPressed[e.keyCode] = true; }

var SimpleGame = {
    space: document.getElementById('game-space'),
    tickSpacing: 33, // 30 TPS
    spaceWidth: 640,
    spaceHeight: 480,
    currentTick: 0,
    enemyCount: 0,
    enemySpacing: 150, // Spawn an enemy every 300 ticks or every 10 seconds
    enemySpeed: 5,
    paused: false,
    ended: false,

    init: function() {
        SimpleGame.enemyDiagonalSpeed = Math.round(Math.sqrt(Math.pow(SimpleGame.enemySpeed, 2) / 2));
        Player.init();
        Treasure.init();
        Score.init();
        SimpleGame.tick();

        // Pause if "P" is pressed.
        window.addEventListener('keydown', function(e){ if (e.keyCode == 80 && !SimpleGame.ended) { SimpleGame.pause(); } }, false );
    },

    tick: function() {
        if ( SimpleGame.paused || SimpleGame.ended ) {
            return false;
        }

        SimpleGame.currentTick++;

        SimpleGame.space.dispatchEvent(gameTick);

        if ( SimpleGame.enemyCount < Math.floor(SimpleGame.currentTick / SimpleGame.enemySpacing) ) {
            SimpleGame.createEnemy();
        }

        setTimeout(SimpleGame.tick, SimpleGame.tickSpacing);
    },

    checkCollision: function(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
    },

    distanceBetween: function(obj1, obj2) {
        var obj1CenterX = obj1.x + obj1.width / 2,
            obj1CenterY = obj1.y + obj1.height / 2,
            obj2CenterX = obj2.x + obj2.width / 2,
            obj2CenterY = obj2.y + obj2.height / 2;
        return Math.sqrt(Math.pow(obj2CenterX - obj1CenterX, 2) + Math.pow(obj2CenterY - obj1CenterY, 2));
    },

    createEnemy: function() {
        SimpleGame.enemyCount++;
        var enemyOptions = {};

        if ( SimpleGame.enemyCount % 3 === 0 ) {
            enemyOptions.xSpeed = SimpleGame.enemyDiagonalSpeed;
            enemyOptions.ySpeed = SimpleGame.enemyDiagonalSpeed;
        } else if ( SimpleGame.enemyCount % 2 ) {
            enemyOptions.xSpeed = SimpleGame.enemySpeed;
            enemyOptions.ySpeed = 0;
        } else {
            enemyOptions.xSpeed = 0;
            enemyOptions.ySpeed = SimpleGame.enemySpeed;
        }

        if ( SimpleGame.enemyCount > 10 ) {
            enemyOptions.xSpeed = Math.floor(enemyOptions.xSpeed * 1.3);
            enemyOptions.ySpeed = Math.floor(enemyOptions.ySpeed * 1.3);
        }

        var enemy = new Hazard(enemyOptions);
    },

    gameOver: function() {
        SimpleGame.ended = true;
        SimpleGame.space.className = 'game-over'
    },

    pause: function() {
        if ( SimpleGame.paused == false ) {
            SimpleGame.paused = true;
            SimpleGame.space.className = 'paused';
        } else {
            SimpleGame.paused = false;
            SimpleGame.space.className = '';
            SimpleGame.tick();
        }
    }
}

class Hazard {
    constructor(options) {
        this.id = SimpleGame.enemyCount;
        this.width = options['width'] || 60;
        this.height = options['height'] || 60;
        this.ySpeed = options['ySpeed'] || 0;
        this.xSpeed = options['xSpeed'] || 0;
        this.moveDirection = options['moveDirection'] || 'right';
        SimpleGame.space.innerHTML += '<div class="hazard" id="hazard-' + this.id + '"></div>';
        this.elem = document.getElementById('hazard-' + this.id);
        this.xPlacementRangeMax = SimpleGame.spaceWidth - this.width;
        this.yPlacementRangeMax = SimpleGame.spaceHeight - this.height;
        this.place();
        var myself = this;
        SimpleGame.space.addEventListener('gameTick', function(){ myself.tick(myself) }, false);
    }

    tick(object) {
        if ( object.destroyed ) { return false; } // Don't waste time on destroyed enemies
        object.elem = document.getElementById('hazard-' + object.id);
        if ( Player.bursting > 0 ) { object.burstResponse(object); }
        object.move(object);
        object.collide(object);
        object.draw(object);
    }

    burstResponse(object) {
        if( SimpleGame.distanceBetween(Player, object) < Player.burstRadius + object.width / 2 ) {
            object.elem.parentNode.removeChild(object.elem);
            object.destroy(object);
        }
    }

    collide(object) {
        if ( SimpleGame.checkCollision(object, Player) ) {
            SimpleGame.gameOver();
        }
    }

    destroy(object) {
        object.destroyed = true;
        object.x = -1000;
        object.y = -1000;
    }

    move(object) {
        if ( object.x >= object.xPlacementRangeMax || object.x < 0 ) { object.xSpeed *= -1; }
        if ( object.y >= object.yPlacementRangeMax || object.y < 0) { object.ySpeed *= -1; }

        object.x += object.xSpeed;
        object.y += object.ySpeed;
    }

    draw(object) {
        object.elem.style = 'top: ' + object.y + 'px; left: ' + object.x + 'px; width: ' + object.width + 'px; height: '+ object.height + 'px;';
    }

    place() {
        this.x = Math.floor(Math.random() * this.xPlacementRangeMax);
        this.y = Math.floor(Math.random() * this.yPlacementRangeMax);

        // Don't allow the hazard to be placed too close to the player.
        if ( SimpleGame.distanceBetween(Player, this) < 180 ) {
            this.place();
        }
    }
}

var Player = {
    x: 305,
    y: 225,
    width: 30,
    height: 30,
    speed: 10,
    charged: false,
    superCharged: false,
    boostMultiplier: 2, // How much the boost affects speed
    boostDuration: 15, // How long the boost lasts (15 means 15 ticks or 0.5 seconds)
    boostCountdown: 0, // How many ticks of boost are left
    burstRadius: 120,
    burstDuration: 3,
    bursting: 0,

    init: function() {
        SimpleGame.space.innerHTML += '<div id="player"></div>';
        Player.elem = document.getElementById('player');
        Player.diagonalSpeed = Math.round(Math.sqrt(Math.pow(Player.speed, 2) / 2));
        SimpleGame.space.addEventListener('gameTick', Player.tick, false);
    },

    tick: function() {
        Player.elem = document.getElementById('player');
        if ( Player.bursting > 0 ) { Player.bursting--; }
        if ( keyPressed[32] ) { Player.boost(); } // Boost if space is pressed
        Player.move();
        Player.draw();
    },

    boost: function() {
        if ( Player.charged && Player.boostCountdown == 0 ) { // Return false if the player is not charged or if boost has already begun
            Player.charged = false;
            Player.boostCountdown = Player.boostDuration;
            if ( Player.superCharged ) { Player.burst(); }
        }
    },

    burst: function() {
        Player.superCharged = false;
        Player.bursting = Player.burstDuration;
    },

    charge: function(superCharge) {
        Player.charged = true;
        if ( superCharge ) { Player.superCharged = true; }
    },

    draw: function() {
        Player.elem.style = 'top: ' + Player.y + 'px; left: ' + Player.x + 'px;';
        var classes = [];
        if ( Player.charged ) { classes.push('charged'); }
        if ( Player.superCharged ) { classes.push('super-charged'); }
        if ( Player.boostCountdown > 0 ) { classes.push('boosting'); }
        if ( Player.bursting > 0 ) { classes.push('bursting'); }
        Player.elem.className = classes.join(' ');
    },

    move: function() {
        var boostFactor = 1;
        if ( Player.boostCountdown > 0 ) {
            boostFactor = Player.boostMultiplier;
            Player.boostCountdown--;
        }

        if ( keyPressed['37'] && !keyPressed['38'] && !keyPressed['39'] && !keyPressed['40'] ) {
            // Left
            Player.x -= Player.speed * boostFactor;
        } else if ( keyPressed['37'] && keyPressed['38'] && !keyPressed['39'] && !keyPressed['40'] ) {
            // Left-Up
            Player.y -= Player.diagonalSpeed * boostFactor;
            Player.x -= Player.diagonalSpeed * boostFactor;
        } else if ( !keyPressed['37'] && keyPressed['38'] && !keyPressed['39'] && !keyPressed['40'] ) {
            // Up
            Player.y -= Player.speed * boostFactor;
        } else if ( !keyPressed['37'] && keyPressed['38'] && keyPressed['39'] && !keyPressed['40'] ) {
            // Right-Up
            Player.y -= Player.diagonalSpeed * boostFactor;
            Player.x += Player.diagonalSpeed * boostFactor;
        } else if ( !keyPressed['37'] && !keyPressed['38'] && keyPressed['39'] && !keyPressed['40'] ) {
            // Right
            Player.x += Player.speed * boostFactor;
        } else if ( !keyPressed['37'] && !keyPressed['38'] && keyPressed['39'] && keyPressed['40'] ) {
            // Right-Down
            Player.y += Player.diagonalSpeed * boostFactor;
            Player.x += Player.diagonalSpeed * boostFactor;
        } else if ( !keyPressed['37'] && !keyPressed['38'] && !keyPressed['39'] && keyPressed['40'] ) {
            // Down
            Player.y += Player.speed * boostFactor;
        } else if ( keyPressed['37'] && !keyPressed['38'] && !keyPressed['39'] && keyPressed['40'] ) {
            // Left-Down
            Player.y += Player.diagonalSpeed * boostFactor;
            Player.x -= Player.diagonalSpeed * boostFactor;
        }

        Player.warp();
    },

    warp: function() {
        if ( Player.x > SimpleGame.spaceWidth ) { Player.x = -1 * Player.width }
        if ( Player.x < -1 * Player.width ) { Player.x = SimpleGame.spaceWidth }
        if ( Player.y > SimpleGame.spaceHeight ) { Player.y = -1 * Player.height }
        if ( Player.y < -1 * Player.height ) { Player.y = SimpleGame.spaceHeight }
    }
}

var Treasure = {
    height: 30,
    width: 30,
    superCount: 1, // Steps counting to supercharge
    superInterval: 15, // Total steps between each supercharge

    init: function() {
        SimpleGame.space.innerHTML += '<div id="treasure"></div>';
        Treasure.elem = document.getElementById('treasure');
        Treasure.xPlacementRangeMax = SimpleGame.spaceWidth - Treasure.width;
        Treasure.yPlacementRangeMax = SimpleGame.spaceHeight - Treasure.height;
        Treasure.place();
        SimpleGame.space.addEventListener('gameTick', Treasure.tick, false);
    },

    tick: function() {
        Treasure.elem = document.getElementById('treasure');

        if( SimpleGame.checkCollision(Treasure, Player) ) {
            Score.value += 10;
            console.log(Treasure.superCount);

            if ( Treasure.superCount >= Treasure.superInterval ) {
                Player.charge(true);
                Treasure.superCount = 0;
            } else {
                Player.charge(false);
            }

            Treasure.superCount++;
            Treasure.place();
        }

        Treasure.draw();
    },

    draw: function() {
        Treasure.elem.style = 'top: ' + Treasure.y + 'px; left: ' + Treasure.x + 'px;';
    },

    place: function() {
        Treasure.x = Math.floor(Math.random() * Treasure.xPlacementRangeMax);
        Treasure.y = Math.floor(Math.random() * Treasure.yPlacementRangeMax);

        if ( Treasure.superCount >= Treasure.superInterval ) {
            Treasure.elem.className = 'super-charged';
        } else {
            Treasure.elem.className = '';
        }

        // Don't allow the treasure to be placed too close to the player.
        if ( SimpleGame.distanceBetween(Player, Treasure) < 150 ) {
            Treasure.place();
        }
    }
}

var Score = {
    value: 0,

    init: function() {
        SimpleGame.space.innerHTML += '<p id="score-text">Score: <span id="score"></span></p>';
        Score.draw();
        SimpleGame.space.addEventListener('gameTick', Score.tick, false);
    },

    tick: function() {
        Score.draw();
    },

    draw: function() {
        Score.elem = document.getElementById('score');
        Score.elem.innerHTML = Score.value;
    }
}

SimpleGame.init();
