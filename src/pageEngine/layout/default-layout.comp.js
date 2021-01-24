const template = `
  <main class="default-layout">
    <default-layout-header v-bind:title="content.title" />
    <slot />
  </main>
`

module.exports = {
  template,
  props: ['content']
}
