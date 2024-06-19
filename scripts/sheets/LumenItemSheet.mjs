import { LumenSystem } from '../LumenSystem.mjs'

export default class LumenItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [LumenSystem.SYSTEM, 'sheet', 'item']
    });
  }

  get template() {
    return `systems/lumen/templates/sheets/${this.document.type}-sheet.hbs`;
  }

  async getData() {
    const data = super.getData()

    data.config = CONFIG.lumen

    const { item } = this

    const { tags } = item.system
    if (tags) {
      data.data.system.tags = game.items.filter(gi => tags.includes(gi.id))
    }

    return data
  }

  activateListeners(html) {
    super.activateListeners(html)

    const { item } = this
    const { tags } = item.system

    if (tags) {
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

    html
      .find('.add-tag')
      .click(async (evt) => {
        evt.preventDefault()

        const gameTags = game.items.filter(gi => gi.type === 'tag')
        Dialog.prompt({
          title: 'Tag Editor',
          content: await renderTemplate(
            'systems/lumen/templates/partials/tag-editor.hbs',
            {
              itemId: item._id,
              itemTags: tags ?? [],
              gameTags
            }
          ),
          render: html => {
            html
              .find('.tag-badge')
              .click(async (evt) => {
                evt.preventDefault()

                const el = evt.currentTarget
                const tagId = el.dataset.id
                const hasTag = el.dataset.has === 'true'

                const existingTags = item.system.tags ?? []
                if (hasTag) {
                  el.dataset.has = 'false'
                  el.classList.remove('c-badge--success')

                  existingTags.splice(existingTags.findIndex(t => t.id === tagId), 1)
                } else {
                  el.dataset.has = 'true'
                  el.classList.add('c-badge--success')

                  existingTags.push(tagId)
                }

                await item.update({ 'system.tags': existingTags })
              })
          }
        })
      })
  }
}
