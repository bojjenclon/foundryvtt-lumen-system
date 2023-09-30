export const registerGameSettings = function (systemName = 'lumen') {
  game.settings.register(systemName, 'supportShields', {
    name: 'Support Shields',
    hint:  'Track shields as an additional resource (in addition to health and energy)',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
}
