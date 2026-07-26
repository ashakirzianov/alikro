import * as migration_20260726_231934_initial from './20260726_231934_initial';

export const migrations = [
  {
    up: migration_20260726_231934_initial.up,
    down: migration_20260726_231934_initial.down,
    name: '20260726_231934_initial'
  },
];
