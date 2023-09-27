import { LumenSystem } from '../LumenSystem.mjs'

export default class LumenItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: [ LumenSystem.SYSTEM, 'sheet', 'item' ]
    });
  }
  
  get template() {
    return `systems/lumen/templates/sheets/${this.document.type}-sheet.hbs`;
  }

  async getData() {
    const data = super.getData()
    
    data.config = CONFIG.lumen
    
    return data
  }
}
