import { lumen } from './config.mjs'
import { registerGameSettings } from './settings.mjs'
import LumenHeroSheet from './sheets/LumenHeroSheet.mjs'
import LumenItemSheet from './sheets/LumenItemSheet.mjs'

export class LumenSystem {
  static SYSTEM = 'lumen'
  static SOCKET = 'system.lumen'

  static init() {
    console.log(`LUMEN - initializing system`)

    CONFIG.lumen = lumen

    Actors.unregisterSheet('core', ActorSheet)
    Actors.registerSheet(
      LumenSystem.SYSTEM,
      LumenHeroSheet,
      {
        makeDefault: true,
        types: ["hero"]
      }
    )

    Items.unregisterSheet('core', ItemSheet)
    Items.registerSheet(
      LumenSystem.SYSTEM,
      LumenItemSheet,
      {
        makeDefault: true,
      }
    )

    registerGameSettings(this.SYSTEM)

    Handlebars.registerHelper('face', value => {
      switch (value) {
        case 1:
            return 'fa-dice-one'
        case 2:
            return 'fa-dice-two'
        case 3:
            return 'fa-dice-three'
        case 4:
            return 'fa-dice-four'
        case 5:
            return 'fa-dice-five'
        case 6:
            return 'fa-dice-six'
      }
      return 'fa-dice-d6';
    })
    
    Handlebars.registerHelper('blazeTab', (text, idx, active) => {
      const cls = idx === active ? 'c-tab-heading c-tab-heading--active' : 'c-tab-heading'
      return `<button role="tab" class="${cls}" data-idx="${idx}">${text}</button>`
    })

    Handlebars.registerHelper('dieColor', (a, b) => {
      return a === b ? 'darkgreen' : 'black'
    })
  }

  static ready() {
    console.log('LUMEN | ready')
    
    document.querySelector('html').classList.add('t-dark')
  }
}

Hooks.once('init', LumenSystem.init)
Hooks.once('ready', LumenSystem.ready)
