import { LumenSystem } from '../LumenSystem.mjs'
import Editor from '../helpers/editor.mjs'

export default class LumenHeroSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: `systems/lumen/templates/sheets/hero-sheet.hbs`,
      classes: [ LumenSystem.SYSTEM, 'sheet', 'hero' ]
    });
  }

  async getData() {
    const data = super.getData()
    
    data.config = CONFIG.lumen
    
    const { actor } = this
    
    data.data.system.owner = actor.isOwner
    data.data.system.weapons = data.data.items.filter(item => { return item.type === 'weapon' })
    data.data.system.gear = data.data.items.filter(item => { return item.type === 'gear' })
    data.data.system.powers = data.data.items.filter(item => { return item.type === 'power' })
    
    data.data.system.supportShields = game.settings.get(LumenSystem.SYSTEM, 'supportShields')
    
    data.notesHTML = await TextEditor.enrichHTML(
      actor.system.notes,
      {
        secrets: actor.isOwner,
        async: true
      }
    )
    data.data.system.tab = actor.system.tab

    return data
  }
  
  activateListeners(html) {
    super.activateListeners(html)
    
    console.log('lumen | activating listeners')
    
    const { actor } = this
    html
      .find('.c-tab-heading')
      .click(evt => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const idx = parseInt(el.dataset.idx, 10)

        actor.update({ 'system.tab': idx })
      })
    
    switch (actor.system.tab) {
      case 0:
        this.coreTabListeners(html)
        break;

      case 1:
        this.powersTabListeners(html)
        break;

      case 2:
        this.itemsTabListeners(html)
        break;

      case 3:
        this.referencesTabListeners(html)
        break;
    
      default:
        break;
    }
  }
  
  coreTabListeners(html) {
    const { actor } = this
    
    const performRoll = async (dieCount, approach) => {
      const result = await new Roll(`${dieCount}d6kh`, {})
        .evaluate({ 'async': true })
      const { terms, total } = result
      const dice = terms[0].results

      const renderedRoll = await renderTemplate(
        `systems/lumen/templates/partials/roll-result.hbs`,
        {
          resultText: approach,
          dice,
          highestValue: total,
          highestIdx: dice.findIndex(die => die.result === total)
        }
      )

      result.toMessage({
        speaker: ChatMessage.getSpeaker(),
        content: renderedRoll
      })
    }
    
    html
      .find('.roll-force')
      .click(() => {
        performRoll(actor.system.force, 'Force')
      })

    html
      .find('.roll-flow')
      .click(() => {
        performRoll(actor.system.flow, 'Flow')
      })

    html
      .find('.roll-focus')
      .click(() => {
        performRoll(actor.system.focus, 'Focus')
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
  }
  
  powersTabListeners(html) {
    const { actor } = this
    
    html
      .find('.open-power')
      .click(async (evt) => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const powerId = el.dataset.id
        const powerItem = actor.items.find(item => item.id === powerId)
        if (powerItem) {
          powerItem.sheet.render(true)
        }
      })

    html
      .find('.delete-power')
      .click(async (evt) => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const powerId = el.dataset.id
        const powerItem = actor.items.find(item => item.id === powerId)
        if (powerItem) {
          Dialog.confirm({
            title: 'Delete Power',
            content: `<p class="c-paragraph">Are you sure you wish to delete <span class="u-text--loud">${powerItem.name}</span>? This cannot be undone.</p>`,
            yes: () => {
              powerItem.delete()
            }
          })
        }
      })

    html
      .find('.use-power')
      .click(async (evt) => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const powerName = el.dataset.name
        const powerCost = el.dataset.cost
        const energy = actor.system.energy.value
        
        if (energy >= powerCost) {
          ChatMessage.create({
            content: [
             `<p class="u-paragraph align-center">`,
              `<i class="fa-solid fa-bolt"></i> `,
              `<span class="u-text--loud">${actor.name}</span> `,
              `burns ${powerCost} `,
              `<span class="u-text--loud">Energy</span> `,
              `to use `,
              `<span class="u-text--loud">${powerName}</span> `,
              `<i class="fa-solid fa-bolt"></i>`,
             `</p>` 
            ].join('')
          })

          actor.update({ 'system.energy.value': (energy - powerCost) })
        }
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

  itemsTabListeners(html) {
    const { actor } = this
    
    html
      .find('.open-item')
      .click(async (evt) => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const itemId = el.dataset.id
        const itemItem = actor.items.find(item => item.id === itemId)
        if (itemItem) {
          itemItem.sheet.render(true)
        }
      })

    html
      .find('.delete-item')
      .click(async (evt) => {
        evt.preventDefault()
        
        const el = evt.currentTarget
        const itemId = el.dataset.id
        const itemItem = actor.items.find(item => item.id === itemId)
        if (itemItem) {
          Dialog.confirm({
            title: 'Delete Item',
            content: `<p class="c-paragraph">Are you sure you wish to delete <span class="u-text--loud">${itemItem.name}</span>? This cannot be undone.</p>`,
            yes: () => {
              itemItem.delete()
            }
          })
        }
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
  
  referencesTabListeners(html) {
    html
      .find('.tag-list')
      .click(async (evt) => {
        evt.preventDefault()
        
        const tags = game.items
          .filter(gi => gi.type === 'tag')
          .sort((a, b) => a.name.localeCompare(b.name))
        
        var tagListDialog = new Dialog(
          {
            title: 'Tag List',
            content: await renderTemplate('systems/lumen/templates/partials/tag-list.hbs', { tags }),
            buttons: []
          },
          {
            width: 400,
            height: 300,
            popOut: true,
            resizable: true,
          }
        )
        tagListDialog.render(true)
      })
  }
}
