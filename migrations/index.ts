import * as migration_20260726_231934_initial from './20260726_231934_initial';
import * as migration_20260727_221257_revert_modelling_to_flat_tags from './20260727_221257_revert_modelling_to_flat_tags';

export const migrations = [
  {
    up: migration_20260726_231934_initial.up,
    down: migration_20260726_231934_initial.down,
    name: '20260726_231934_initial',
  },
  {
    up: migration_20260727_221257_revert_modelling_to_flat_tags.up,
    down: migration_20260727_221257_revert_modelling_to_flat_tags.down,
    name: '20260727_221257_revert_modelling_to_flat_tags'
  },
];
