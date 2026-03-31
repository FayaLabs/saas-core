import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'components/index': 'src/components/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'stores/index': 'src/stores/index.ts',
    'server/index': 'src/server/index.ts',
    'config/index': 'src/config/index.ts',
    'lib/index': 'src/lib/index.ts',
    'types/index': 'src/types/index.ts',
    'plugins/financial/index': 'src/plugins/financial/index.ts',
    'plugins/inventory/index': 'src/plugins/inventory/index.ts',
    'plugins/crm/index': 'src/plugins/crm/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false,
  splitting: true,
  clean: true,
  external: ['react', 'react-dom', 'express'],
  sourcemap: true,
  treeshake: true,
})
