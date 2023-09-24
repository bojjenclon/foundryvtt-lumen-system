import { lumen } from './config.mjs'
import registerGameSettings from './settings.mjs'
import LumenHeroSheet from './sheets/LumenHeroSheet.mjs'

export class LumenSystem {
  static SYSTEM = 'lumen'
  static SOCKET = 'system.lumen'

  static init() {
    console.log(`LUMEN - initializing system`)

    CONFIG.lumen = lumen

    Actors.unregisterSheet('core', ActorSheet)
    Actors.registerSheet(LumenSystem.SYSTEM, LumenHeroSheet, { makeDefault: true, types: ["hero"] })

    registerGameSettings(SYSTEM)
  }

  static ready() {
    console.log('LUMEN | ready')
  }
}

Hooks.once('init', LumenSystem.init())
Hooks.once('ready', LumenSystem.ready())
