const template = `
  <header class="layout-header">
    <div class="page-inner">
      <h1>{{ title }}</h1>
    </div>
  </header>
`

export const LayoutHeader = {
  template,
  props: ['title']
}

export default LayoutHeader
