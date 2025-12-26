import nextConfig from 'eslint-config-next'

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  ...nextConfig,
  {
    rules: {},
  },
]

export default config
