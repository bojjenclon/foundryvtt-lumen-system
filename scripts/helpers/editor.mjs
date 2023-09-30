// Taken from Custom System Builder
const richTextEditor = (key, content, callback) => {
  const dialogContent = `<textarea id='lumen-editor-${key}' class='lumen-editor'>${content}</textarea><input type="hidden" class="closeAction" value="save" />`
  return new Dialog(
    {
      title: 'Rich Text Editor',
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
            $(`#lumen-editor-${key.replace(/\./g, '\\.')}`)
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
          callback(tinymce.get(`lumen-editor-${key}`).getContent())
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

const simpleTextEditor = (content, callback) => {
  const dialogContent = [
   `<div class="u-display-flex u-flex-1">`,
   `<textarea class="lumen-editor c-field u-flex-1">${content}</textarea>`,
   `<input type="hidden" class="closeAction" value="save" />`,
   `</div>` 
  ].join('')
  return new Dialog(
    {
      title: 'Simple Text Editor',
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
      close: (html) => {
        const action = $(html).find('.closeAction').val()
        if (action === 'save') {
          callback(html.find(`.lumen-editor`).val())
        }
      }
    },
    {
      classes: ['simple-text-editor'],
      width: 400,
      height: 300,
      resizable: true
    }
  )
}

const attackEditor = async (data, callback) => {
  const gameTags = game.items.filter(gi => gi.type === 'tag')
  const attack = data || {
    harm: 1,
    range: {
      near: false,
      mid: false,
      far: false
    },
    tags: []
  }

  Dialog.confirm({
    title: 'Add Attack',
    content: await renderTemplate(`systems/lumen/templates/partials/attack-editor.hbs`, { attack, gameTags }),
    render: html => {
      html
        .find('.tag-badge')
        .click(evt => {
          evt.preventDefault()

          const el = evt.currentTarget
          const tagId = el.dataset.id
          const hasTag = el.dataset.has === 'true'
          
          const existingTags = attack.tags
          if (hasTag) {
            el.dataset.has = 'false'
            el.classList.remove('c-badge--success')
            
            existingTags.splice(existingTags.findIndex(t => t.id === tagId), 1)
          } else {
            el.dataset.has = 'true'
            el.classList.add('c-badge--success')

            existingTags.push(tagId)
          }
        })
    },
    yes: html => {
      attack.harm = html.find('input[name="harm"]').val()
      attack.range = {
        near: html.find('input[name="range.near"]').is(':checked'),
        mid: html.find('input[name="range.mid"]').is(':checked'),
        far: html.find('input[name="range.far"]').is(':checked')
      }

      callback(attack)
    }
  })
}

export default {
  richTextEditor,
  simpleTextEditor,
  attackEditor
}
