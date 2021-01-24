const template = `
  <main class="default-layout">
    <default-layout-header v-bind:title="content.title" />
    <slot></slot>
  </main>
`

export default {
  template,
  props: ['content']
}
