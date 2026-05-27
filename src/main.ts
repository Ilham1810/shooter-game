import Phaser from 'phaser'
import MainScene from './scenes/MainScene'

new Phaser.Game({
  type: Phaser.AUTO,

  width: window.innerWidth,
  height: window.innerHeight,

  backgroundColor: '#111111',

  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },

  scene: [MainScene]
})