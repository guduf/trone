const template = `
  <main class="layout">
    <layout-header v-bind:title="content.title" />
    <slot></slot>
  </main>
`

export const Layout = {
  template,
  props: ['content']
}

export default Layout
