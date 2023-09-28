import { LumenSystem } from '../LumenSystem.mjs'

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
    
    data.data.system.supportShields = true
    
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
    
    // Taken from Custom System Builder
    const createExternalEditor = (content, prop) => {
      const dialogContent = `<textarea id='lumen-editor-${this.key}' class='lumen-editor'>${content}</textarea><input type="hidden" class="closeAction" value="save" />`
      return new Dialog(
          {
              title: 'Notes',
              content: dialogContent,
              buttons: {
                  validate: {
                      icon: '<i class="fas fa-check"></i>',
                      label: 'Save'
                  },
                  cancel: {
                      icon: '<i class="fas fa-times"></i>',
                      label: 'Cancel',
                      callback: (html) => {
                          $(html).find('.closeAction').val('cancel')
                      }
                  }
              },
              render: () => {
                  // Pre-emptively remove editors to guarantee init
                  tinymce.remove('textarea.lumen-editor')
                  tinymce.init({
                      ...CONFIG.TinyMCE,
                      selector: 'textarea.lumen-editor',
                      save_onsavecallback: (mce) => {
                          $(`#lumen-editor-${this.key.replace(/\./g, '\\.')}`)
                              .parents('.dialog')
                              .find('.dialog-button.validate')
                              .trigger('click');
                      },
                      init_instance_callback: function (editor) {
                          editor.on('drop', async function (e) {
                              e.preventDefault();
                              editor.execCommand(
                                  'InsertText',
                                  false,
                                  await TextEditor.getContentLink(TextEditor.getDragEventData(e))
                              )
                          })
                      }
                  })
              },
              close: (html) => {
                  const action = $(html).find('.closeAction').val()
                  if (action === 'save') {
                      actor.update({
                          [prop]: tinymce.get(`lumen-editor-${this.key}`).getContent()
                      })
                  }
              }
          },
          {
              width: 500,
              height: 480,
              resizable: true
          }
      )
    }

    html
      .find('.edit-notes')
      .click(() => {
        const d = createExternalEditor(actor.system.notes, 'system.notes')
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
              `burns ${powerCost} Energy to use `,
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
}
