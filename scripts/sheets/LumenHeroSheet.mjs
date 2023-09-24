import { LumenSystem } from '../LumenSystem.mjs'

export default class LumenHeroSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: `systems/${LumenSystem.SYSTEM}/templates/sheets/hero-sheet.hbs`,
      classes: [ LumenSystem.SYSTEM, 'sheet', 'hero' ]
    });
  }

  async getData() {
    const data = super.getData()
    
    data.config = CONFIG.lumen
    
    data.data.system.owner = this.actor.isOwner
    data.data.system.equipment = data.data.items.filter(item => { return item.type === 'equipment' })
    data.data.system.gear = data.data.items.filter(item => { return item.type === 'gear' })
    data.data.system.powers = data.data.items.filter(item => { return item.type === 'power' })

    return data
  }
  
  activateListeners(html) {
    super.activateListeners(html)
    
    console.log('lumen | activating listeners')
  }
}
