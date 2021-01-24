const template = `
  <header class="app-layout-header">
    <div class="page-inner">
      <h1>{{ title }}</h1>
    </div>
  </header>
`

export default {
  template,
  props: ['title']
}
