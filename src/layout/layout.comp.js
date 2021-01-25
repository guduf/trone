const template = `
  <main class="layout">
    <layout-header v-bind:title="content.title" />
    <slot></slot>
  </main>
`

export default {
  template,
  props: ['content']
}
