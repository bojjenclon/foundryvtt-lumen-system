import { LumenSystem } from '../LumenSystem.mjs'
import Editor from '../helpers/editor.mjs'

// Attack = Harm, Range, Tags

export default class LumenEnemySheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: `systems/lumen/templates/sheets/enemy-sheet.hbs`,
      classes: [ LumenSystem.SYSTEM, 'sheet', 'enemy' ]
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
      .find('.add-attack')
      .click(async (evt) => {
        evt.preventDefault()
        
        Editor.attackEditor(null, attack => {
          const allAttacks = actor.system.attacks
          allAttacks.push(attack)
          actor.update({ 'system.attacks': allAttacks })
        })
      })

    html
      .find('.edit-attack')
      .click(async (evt) => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const idx = el.dataset.idx
        const attack = actor.system.attacks[idx]
        
        Editor.attackEditor(attack, changed => {
          const allAttacks = actor.system.attacks
          allAttacks[idx] = changed
          actor.update({ 'system.attacks': allAttacks })
        })
      })

    html
      .find('.delete-attack')
      .click(evt => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const idx = el.dataset.idx

        Dialog.confirm({
          title: 'Delete Attack',
          content: `<p class="c-paragraph">Are you sure you wish to delete this attack? This cannot be undone.</p>`,
          yes: () => {
            const allAttacks = actor.system.attacks
            allAttacks.splice(idx, 1)
            actor.update({ 'system.attacks': allAttacks })
          }
        })
      })

    html
      .find('.add-move')
      .click(evt => {
        evt.preventDefault()

        const d = Editor.simpleTextEditor('', async (move) => {
          const allMoves = actor.system.moves
          allMoves.push(move)
          actor.update({ 'system.moves': allMoves })
        })
        d.render(true)
      })

    html
      .find('.edit-move')
      .click(evt => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const idx = el.dataset.idx
        
        const allMoves = actor.system.moves
        const d = Editor.simpleTextEditor(allMoves[idx], async (move) => {
          allMoves[idx] = move
          actor.update({ 'system.moves': allMoves })
        })
        d.render(true)
      })

    html
      .find('.delete-move')
      .click(evt => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const idx = el.dataset.idx

        Dialog.confirm({
          title: 'Delete Move',
          content: `<p class="c-paragraph">Are you sure you wish to delete this move? This cannot be undone.</p>`,
          yes: () => {
            const allMoves = actor.system.moves
            allMoves.splice(idx, 1)
            actor.update({ 'system.moves': allMoves })
          }
        })
      })

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
    
    html
      .find('.tag-badge')
      .click(evt => {
        evt.preventDefault()

        const el = evt.currentTarget
        const tagId = el.dataset.id
        const tagItem = game.items.find(gi => gi.id === tagId)
        
        if (tagItem) {
          tagItem.sheet.render(true)
        }
      })
  }
}

