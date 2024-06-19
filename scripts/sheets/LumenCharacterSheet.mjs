import { LumenSystem } from '../LumenSystem.mjs'
import Editor from '../helpers/editor.mjs'

export default class LumenCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: `systems/lumen/templates/sheets/character-sheet.hbs`,
      classes: [ LumenSystem.SYSTEM, 'sheet', 'character' ]
    });
  }

  async getData() {
    const data = super.getData()
    
    data.config = CONFIG.lumen
    
    const { actor } = this
    
    data.data.system.supportShields = game.settings.get(LumenSystem.SYSTEM, 'supportShields')
    
    data.notesHTML = await TextEditor.enrichHTML(
      actor.system.notes,
      {
        secrets: actor.isOwner,
        async: true
      }
    )

    return data
  }

  activateListeners(html) {
    super.activateListeners(html)
    
    console.log('lumen | activating listeners')
    
    const { actor } = this
    html
      .find('.edit-notes')
      .click(() => {
        const d = Editor.richTextEditor(this.key, actor.system.notes, async (content) => {
          actor.update({
            'system.notes': content
          })
        })
        d.render(true)
      })
  }
}
