import Phaser from 'phaser'

export default class MainScene extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Sprite

  keys!: any
  dashKey!: Phaser.Input.Keyboard.Key

  bullets!: Phaser.Physics.Arcade.Group
  enemies!: Phaser.Physics.Arcade.Group

  hp: number = 100
  score: number = 0
  gameOver: boolean = false

  hpText!: Phaser.GameObjects.Text
  scoreText!: Phaser.GameObjects.Text
  gameOverText!: Phaser.GameObjects.Text

  isShooting: boolean = false
  lastFired: number = 0

  constructor() {
    super('main-scene')
  }

  preload() {
    this.load.image('player', 'src/assets/player.png')
    this.load.image('enemy', 'src/assets/enemy.png')
    this.load.image('bullet', 'src/assets/bullet.png')
  }

  create() {
    // =========================
    // WORLD
    // =========================

    this.physics.world.setBounds(0, 0, 3000, 3000)

    // =========================
    // FOREST BACKGROUND
    // =========================

    this.cameras.main.setBackgroundColor('#1a2e1a')

    const bg = this.add.graphics()

    // GROUND
    bg.fillStyle(0x2d4a2d, 1)
    bg.fillRect(0, 0, 3000, 3000)

    // GRASS PATCHES
    for (let i = 0; i < 2000; i++) {
      const x = Phaser.Math.Between(0, 3000)
      const y = Phaser.Math.Between(0, 3000)

      const color = Phaser.Utils.Array.GetRandom([
        0x3a5f3a,
        0x4b7a4b,
        0x355e35,
        0x587d58
      ])

      bg.fillStyle(color, 0.35)

      bg.fillCircle(
        x,
        y,
        Phaser.Math.Between(2, 6)
      )
    }

    // TREES
    for (let i = 0; i < 180; i++) {
      const x = Phaser.Math.Between(0, 3000)
      const y = Phaser.Math.Between(0, 3000)

      // SHADOW
      bg.fillStyle(0x000000, 0.2)
      bg.fillCircle(x + 8, y + 8, 35)

      // TREE LEAVES
      const treeColor =
        Phaser.Utils.Array.GetRandom([
          0x1f4d1f,
          0x2f6b2f,
          0x3b7d3b,
          0x285728
        ])

      bg.fillStyle(treeColor, 1)

      bg.fillCircle(
        x,
        y,
        Phaser.Math.Between(25, 40)
      )

      // TREE CENTER
      bg.fillStyle(0x3b2a1a, 1)
      bg.fillCircle(x, y, 8)
    }

    // ROCKS
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, 3000)
      const y = Phaser.Math.Between(0, 3000)

      bg.fillStyle(0x666666, 0.7)

      bg.fillEllipse(
        x,
        y,
        Phaser.Math.Between(20, 40),
        Phaser.Math.Between(15, 30)
      )
    }

    // BUSHES
    for (let i = 0; i < 300; i++) {
      const x = Phaser.Math.Between(0, 3000)
      const y = Phaser.Math.Between(0, 3000)

      const bushColor =
        Phaser.Utils.Array.GetRandom([
          0x2f5d2f,
          0x3d7a3d,
          0x4f8a4f
        ])

      bg.fillStyle(bushColor, 0.8)

      bg.fillCircle(
        x,
        y,
        Phaser.Math.Between(10, 20)
      )
    }

    // DIRT PATHS
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, 3000)
      const y = Phaser.Math.Between(0, 3000)

      bg.fillStyle(0x5a4a32, 0.25)

      bg.fillEllipse(
        x,
        y,
        Phaser.Math.Between(80, 200),
        Phaser.Math.Between(40, 100)
      )
    }

    // FOG
    for (let i = 0; i < 40; i++) {
      const fog = this.add.circle(
        Phaser.Math.Between(0, 3000),
        Phaser.Math.Between(0, 3000),
        Phaser.Math.Between(100, 250),
        0xffffff,
        0.03
      )

      this.tweens.add({
        targets: fog,
        alpha: 0.08,
        duration: Phaser.Math.Between(
          2000,
          5000
        ),
        yoyo: true,
        repeat: -1
      })
    }

    // =========================
    // PLAYER
    // =========================

    this.player = this.physics.add.sprite(
      400,
      300,
      'player'
    )

    this.player.setScale(1)

    this.player.setOrigin(0.5, 0.5)

    this.player.setCollideWorldBounds(true)

    // SMOOTH MOVEMENT
    this.player.setDamping(true)

    this.player.setDrag(0.95)

    this.player.setMaxVelocity(400)

    // =========================
    // CAMERA
    // =========================

    this.cameras.main.startFollow(
      this.player
    )

    this.cameras.main.setZoom(0.8)

    this.cameras.main.roundPixels = true

    // =========================
    // CURSOR
    // =========================

    this.input.setDefaultCursor('crosshair')

    // =========================
    // INPUT
    // =========================

    this.keys = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })

    // DASH
    this.dashKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )

    // =========================
    // GROUPS
    // =========================

    this.bullets = this.physics.add.group()

    this.enemies = this.physics.add.group()

    // =========================
    // AUTO FIRE
    // =========================

    this.input.on('pointerdown', () => {
      this.isShooting = true
    })

    this.input.on('pointerup', () => {
      this.isShooting = false
    })

    // =========================
    // SPAWN ENEMY
    // =========================

    this.time.addEvent({
      delay: 700,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    })

    // =========================
    // COLLISION
    // =========================

    // BULLET HIT
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.hitEnemy as any,
      undefined,
      this
    )

    // PLAYER HIT
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.playerHit as any,
      undefined,
      this
    )

    // =========================
    // UI
    // =========================

    this.hpText = this.add.text(
      20,
      20,
      'HP: 100',
      {
        fontSize: '28px',
        color: '#00ff88',
        fontStyle: 'bold'
      }
    )

    this.scoreText = this.add.text(
      20,
      60,
      'Score: 0',
      {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )

    this.gameOverText = this.add.text(
      window.innerWidth / 2,
      window.innerHeight / 2,
      '',
      {
        fontSize: '64px',
        color: '#ff0000',
        align: 'center',
        fontStyle: 'bold'
      }
    )

    this.gameOverText.setOrigin(0.5)

    // FIX UI
    this.hpText.setScrollFactor(0)

    this.scoreText.setScrollFactor(0)

    this.gameOverText.setScrollFactor(0)
  }

  // =========================
  // SPAWN ENEMY
  // =========================

  spawnEnemy() {
    if (this.gameOver) return

    const side = Phaser.Math.Between(0, 3)

    let x = 0
    let y = 0

    // TOP
    if (side === 0) {
      x = Phaser.Math.Between(0, 3000)
      y = 0
    }

    // RIGHT
    if (side === 1) {
      x = 3000
      y = Phaser.Math.Between(0, 3000)
    }

    // BOTTOM
    if (side === 2) {
      x = Phaser.Math.Between(0, 3000)
      y = 3000
    }

    // LEFT
    if (side === 3) {
      x = 0
      y = Phaser.Math.Between(0, 3000)
    }

    const enemy = this.enemies.create(
      x,
      y,
      'enemy'
    ) as Phaser.Physics.Arcade.Sprite

    enemy.setScale(1)

    enemy.setCollideWorldBounds(true)
  }

  // =========================
  // SHOOT
  // =========================

  shoot(pointer: Phaser.Input.Pointer) {
    // FIRE RATE
    if (this.time.now < this.lastFired) return

    this.lastFired = this.time.now + 120

    const bullet = this.bullets.create(
      this.player.x,
      this.player.y,
      'bullet'
    ) as Phaser.Physics.Arcade.Image

    bullet.setScale(0.5)

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      pointer.worldX,
      pointer.worldY
    )

    const speed = 1000

    bullet.setRotation(angle)

    bullet.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    )

    // RECOIL
    this.player.setVelocity(
      -Math.cos(angle) * 80,
      -Math.sin(angle) * 80
    )

    // SHOOT SHAKE
    this.cameras.main.shake(30, 0.001)

    // TRAIL
    const trail = this.add.circle(
      bullet.x,
      bullet.y,
      6,
      0xffff00,
      0.4
    )

    this.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0,
      duration: 200,
      onComplete: () => trail.destroy()
    })

    // DESTROY BULLET
    this.time.delayedCall(2000, () => {
      if (bullet.active) {
        bullet.destroy()
      }
    })
  }

  // =========================
  // HIT ENEMY
  // =========================

  hitEnemy(
    bulletObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject
  ) {
    const bullet =
      bulletObj as Phaser.Physics.Arcade.Image

    const enemy =
      enemyObj as Phaser.Physics.Arcade.Sprite

    bullet.destroy()

    // HIT FLASH
    const flash = this.add.circle(
      enemy.x,
      enemy.y,
      20,
      0xff0000,
      0.5
    )

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 3,
      duration: 200,
      onComplete: () => flash.destroy()
    })

    enemy.destroy()

    // SCORE
    this.score += 10

    this.scoreText.setText(
      `Score: ${this.score}`
    )

    // BIG SHAKE
    this.cameras.main.shake(100, 0.003)
  }

  // =========================
  // PLAYER HIT
  // =========================

  playerHit(
    _: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject
  ) {
    const enemy =
      enemyObj as Phaser.Physics.Arcade.Sprite

    enemy.destroy()

    this.hp -= 10

    this.hpText.setText(
      `HP: ${this.hp}`
    )

    // HIT FLASH
    this.cameras.main.flash(
      100,
      255,
      0,
      0
    )

    if (this.hp <= 0) {
      this.endGame()
    }
  }

  // =========================
  // GAME OVER
  // =========================

  endGame() {
    this.gameOver = true

    this.player.setTint(0xff0000)

    this.gameOverText.setText(
      'GAME OVER\n\nPress R to Restart'
    )

    this.input.keyboard?.on(
      'keydown-R',
      () => {
        this.scene.restart()
      }
    )
  }

  // =========================
  // UPDATE
  // =========================

  update() {
    if (this.gameOver) return

    const speed = 300

    // MOVEMENT
    if (this.keys.left.isDown) {
      this.player.setVelocityX(-speed)
    }

    if (this.keys.right.isDown) {
      this.player.setVelocityX(speed)
    }

    if (this.keys.up.isDown) {
      this.player.setVelocityY(-speed)
    }

    if (this.keys.down.isDown) {
      this.player.setVelocityY(speed)
    }

    // AIM
    const pointer = this.input.activePointer

    this.player.rotation =
      Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        pointer.worldX,
        pointer.worldY
      )

    // AUTO SHOOT
    if (this.isShooting) {
      this.shoot(pointer)
    }

    // DASH
    if (
      Phaser.Input.Keyboard.JustDown(
        this.dashKey
      )
    ) {
      const angle = this.player.rotation

      this.player.setVelocity(
        Math.cos(angle) * 800,
        Math.sin(angle) * 800
      )
    }

    // ENEMY FOLLOW
    this.enemies.getChildren().forEach(
      (enemyObj) => {
        const enemy =
          enemyObj as Phaser.Physics.Arcade.Sprite

        if (!enemy) return

        this.physics.moveTo(
          enemy,
          this.player.x,
          this.player.y,
          140 + this.score * 0.2
        )

        enemy.rotation =
          Phaser.Math.Angle.Between(
            enemy.x,
            enemy.y,
            this.player.x,
            this.player.y
          )
      }
    )
  }
}