import { LumenSystem } from "../LumenSystem.mjs"

export default class EssenceDialog extends Application {
  constructor(opts) {
    super(opts)
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
        id: 'essence-dialog',
        title: 'Essence',
        template: 'systems/lumen/templates/applications/essence-dialog.hbs',
        classes: [ LumenSystem.SYSTEM, 'essence-dialog' ],
        minimizable: false,
        popout: false,
        width: 200,
        height: 250,
        buttons: []
    })
  }
  
  async getData() {
    const data = super.getData()
    
    data.config = CONFIG.lumen
    
    const clientStorage = game.settings.storage.get('client')
    const essenceMap = JSON.parse(clientStorage.getItem('essence')) || { 'health': 0, 'energy': 0 }

    const essence = []
    Object.keys(essenceMap).forEach(key => {
      const isEnergy = key === 'energy';
      
      const amount = essenceMap[key]
      for (let i = 0; i < amount; i++) {
        essence.push({
          name: isEnergy ? 'Energy' : 'Health',
          is: {
            energy: isEnergy,
            health: !isEnergy
          }
        })
      }
    })

    data.essence = essence
    
    return data
  }

  activateListeners(html) {
    super.activateListeners(html)
    
    html
      .find('.header-button.close')
      .remove()
  }

}
