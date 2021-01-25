const template = `
  <main class="layout">
    <layout-header v-bind:title="layout && layout.title" />
    <slot></slot>
  </main>
`

export default {
  template,
  props: ['layout']
}
