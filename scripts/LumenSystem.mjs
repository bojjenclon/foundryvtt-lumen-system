import { lumen } from './config.mjs'
import { registerGameSettings } from './settings.mjs'
import Essence from './helpers/essence.mjs'
import LumenHeroSheet from './sheets/LumenHeroSheet.mjs'
import LumenCharacterSheet from './sheets/LumenCharacterSheet.mjs'
import LumenEnemySheet from './sheets/LumenEnemySheet.mjs'
import LumenItemSheet from './sheets/LumenItemSheet.mjs'

export class LumenSystem {
  static SYSTEM = 'lumen'

  static socket

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
    Actors.registerSheet(
      LumenSystem.SYSTEM,
      LumenCharacterSheet,
      {
        types: ["character"]
      }
    )
    Actors.registerSheet(
      LumenSystem.SYSTEM,
      LumenEnemySheet,
      {
        types: ["enemy"]
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
    
    const templatePaths = [
      'systems/lumen/templates/partials/roll-result.hbs',
      'systems/lumen/templates/partials/tag-editor.hbs',
      'systems/lumen/templates/partials/tag-list.hbs'
    ]
    loadTemplates(templatePaths)

    Handlebars.registerHelper('contains', (arr, val) => {
      return arr.includes(val)
    })

    Handlebars.registerHelper('empty', str => !str.length)

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

    Handlebars.registerHelper('itemName', id => {
      return game.items.find(gi => gi.id === id).name
    })

    Handlebars.registerHelper('allItemNames', ids => {
      return game.items.filter(gi => ids.includes(gi.id)).map(gi => gi.name)
    })

    Handlebars.registerHelper('claimedByAny', ess => {
      return Object.values(ess.claimed).some(v => !!v)
    })

    Handlebars.registerHelper('claimedByUser', (ess, userId) => {
      const { claimed } = ess
      for (let id in claimed) {
        if (claimed[id] && id === userId) {
          return true
        }
      }
      return false
    })
  }

  static async ready() {
    console.log('LUMEN | ready')
    
    document
      .querySelector('html')
      .classList
      .add('t-dark')
  }
  
  static socketlib() {
    const socket = socketlib.registerSystem('lumen')
    
    socket.register('addEssence', (type, amount) => {
      let typeName = ''
      switch (type) {
        case 'health':
          typeName = 'Health'
          break

        case 'energy':
          typeName = 'Energy'
          break
      }

      const userIds = game.users.map(u => u.id)
      const claimedTemplate = {}
      userIds.forEach(id => claimedTemplate[id] = false)

      const clientStorage = game.settings.storage.get('client')
      const essence = JSON.parse(clientStorage.getItem('essence') || '[]')

      for (let i = 0; i < amount; i++) {
        essence.push({
          name: typeName,
          is: {
            health: type === 'health',
            energy: type === 'energy'
          },
          claimed: Object.assign({}, claimedTemplate)
        })
      }
      clientStorage.setItem('essence', JSON.stringify(essence))

      Essence.showDialog()
    })
    
    socket.register('toggleClaimOnEssence', (idx, userId) => {
      const clientStorage = game.settings.storage.get('client')
      const essence = JSON.parse(clientStorage.getItem('essence') || '[]')
      const propPath = `${idx}.claimed.${userId}`;
      setProperty(essence, propPath, !getProperty(essence, propPath))
      clientStorage.setItem('essence', JSON.stringify(essence))

      Essence.refreshDialog()
    })

    socket.register('removeEssence', idx => {
      const clientStorage = game.settings.storage.get('client')
      const essence = JSON.parse(clientStorage.getItem('essence') || '[]')
      essence.splice(idx, 1)
      clientStorage.setItem('essence', JSON.stringify(essence))

      Essence.refreshDialog()
    })
    
    socket.register('clearEssence', () => {
      const clientStorage = game.settings.storage.get('client')
      clientStorage.setItem('essence', '[]')

      Essence.hideDialog()
    })

    socket.register('showEssenceDialog', () => {
      Essence.showDialog()
    })

    socket.register('hideEssenceDialog', () => {
      Essence.hideDialog()
    })
    
    LumenSystem.socket = socket
  }
  
  static async renderSidebarTab(_dir, html, _opts) {
    if (!game.user.isGM) {
      return
    }
    
    if (html.find('.action-bar').length) {
      return
    }
  
    const actionBar = await renderTemplate('systems/lumen/templates/partials/action-bar.hbs')
    html.prepend(actionBar)
    
    html
      .find('.show-dialog')
      .click(evt => {
        evt.preventDefault()
        LumenSystem.showEssenceDialog()
      })
  
    html
      .find('.add-essence')
      .click(async (evt) => {
        evt.preventDefault()
        
        const essenceTables = await game.tables.filter(t => t.folder.name === 'Essence')
        const options = essenceTables.map(et => `<option value="${et.id}">${et.name}</option>`)
        
        let amount = 0
        let tableId = ''
        
        await Dialog.prompt({
          title: 'Generate Essence',
          img: 'icons/containers/bags/sack-leather-brown-green.webp',
          content: [
            `<p style="text-align: center;"><select name="table">${options.join('')}</select></p>`,
            `<p><input name="amount" type="number" min="1" step="1" value="1"></p>`,
          ].join(''),
          render: (html) => {
            setTimeout(
              () => {
                const input = html.find('input[name="amount"]')
                input.focus()
                input.select()
              },
              0
            )
          },
          callback: (html) => {
            amount = html.find('input[name="amount"]').val()
            tableId = html.find('select[name="table"]').val()
          }
        })
        
        if (amount < 1 || tableId.length === 0) {
          return
        }
  
        const table = game.tables.find(t => t.id === tableId)
        const { results } = await table.drawMany(amount, { displayChat: false })
        
        for (let res of results) {
          const { text } = res
          switch (text) {
            case 'Health':
              LumenSystem.addEssence('health', 1)
              break
  
            case 'Energy':
              LumenSystem.addEssence('energy', 1)
              break
          }
        }
      })
  
    html
      .find('.clear-essence')
      .click(evt => {
        evt.preventDefault()
        LumenSystem.clearEssence()
      })
  
    html
      .find('.apply-essence')
      .click(async (evt) => {
        evt.preventDefault()
  
        const clientStorage = game.settings.storage.get('client')
        const essence = JSON.parse(clientStorage.getItem('essence') || '[]')
        
        for (let idx = essence.length - 1; idx >= 0; idx--) {
          const ess = essence[idx]
          const { claimed } = ess
          const claimedIds = Object.keys(claimed)
  
          const amountClaimed = Object
            .values(claimed)
            .reduce((accum, val) => accum + (val ? 1 : 0), 0)
          if (amountClaimed === 0) {
            continue
          }
          
          const addEssence = async (id) => {
            const user = game.users.get(id)
            if (!user) {
              return
            }
  
            const { character } = user
            if (!character) {
              return
            }
            
            let essProp = ''
            if (ess.is.health) {
              essProp = 'health'
            } else if (ess.is.energy) {
              essProp = 'energy'
            }
            const propPath = `system.${essProp}.value`
            await character.update({ [propPath]: getProperty(character, propPath) + 1 })
  
            LumenSystem.removeEssence(idx)
          }
          
          let randoIds = []
          for (let id of claimedIds) {
            if (amountClaimed === 1) {
              await addEssence(id)
            } else {
              randoIds.push(id)
            }
          }
          
          const percent = 1.0 / randoIds.length
          for (let id of randoIds) {
            if (Math.random() < percent) {
              addEssence(id)
              break
            }
          }
        }
      })
  }
  
  static addEssence(type, amount) {
    const { socket } = LumenSystem 
    socket.executeForEveryone('addEssence', type, amount)
  }

  static toggleClaimOnEssence(idx, userId) {
    const { socket } = LumenSystem 
    socket.executeForEveryone('toggleClaimOnEssence', idx, userId)
  }
  
  static removeEssence(idx) {
    const { socket } = LumenSystem 
    socket.executeForEveryone('removeEssence', idx)
  }
  
  static clearEssence() {
    const { socket } = LumenSystem 
    socket.executeForEveryone('clearEssence')
  }
  
  static showEssenceDialog() {
    const { socket } = LumenSystem 
    socket.executeForEveryone('showEssenceDialog')
  }
  
  static hideEssenceDialog() {
    const { socket } = LumenSystem 
    socket.executeForEveryone('hideEssenceDialog')
  }
}

Hooks.once('init', LumenSystem.init)
Hooks.once('ready', LumenSystem.ready)
Hooks.once('socketlib.ready', LumenSystem.socketlib)

Hooks.on('renderSidebarTab', LumenSystem.renderSidebarTab)
