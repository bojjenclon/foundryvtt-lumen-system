import { LumenSystem } from "../LumenSystem.mjs"

const createDialog = async () => {
  const clientStorage = game.settings.storage.get('client')
  const essence = JSON.parse(clientStorage.getItem('essence') || '[]')
  
  if (essence.length === 0) {
    return
  }

  const { user } = game
  const template = await renderTemplate(
    'systems/lumen/templates/applications/essence-dialog.hbs',
    {
      essence,
      userId: user.id
    }
  )

  const html = $.parseHTML(template)
  $(html)
    .find('.c-badge')
    .click(async (evt) => {
      evt.preventDefault()

      const el = evt.currentTarget
      const idx = el.dataset.idx
      const type = el.dataset.type
      
      const { user } = game
      const { character } = user

      if (character) {
        const propPath = `system.${type}.value`

        const curVal = getProperty(character, propPath)
        const maxVal = getProperty(character, `system.${type}.max`)

        if (curVal + 1 <= maxVal) {
          LumenSystem.toggleClaimOnEssence(idx, user.id)

          // await character.update({
          //   [propPath]: (getProperty(character, propPath) + 1)
          // })

          // LumenSystem.removeEssence(idx)
        }
      }
    })
  
  $('#interface').append(html)
}

const showDialog = async () => {
  const el = $('.essence-dialog')
  if (el.length) {
    el.remove()
  }

  createDialog()
}

const hideDialog = async () => {
  const el = $('.essence-dialog')
  if (el.length) {
    el.remove()
  }
}

const refreshDialog = async () => {
  const el = $('.essence-dialog')
  if (el.length) {
    showDialog()
  }
}

export default {
  createDialog,
  showDialog,
  hideDialog,
  refreshDialog
}
