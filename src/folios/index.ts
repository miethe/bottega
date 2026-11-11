import type { FolioModule } from '../shell/types';
import { folio1 } from './folio1';
import { folio4 } from './folio4';
import { folio6 } from './folio6';
import { folio7 } from './folio7';

/** The pages that are drawn, in order. A folio joins the notebook by being added here. */
export const folios: FolioModule[] = [folio1, folio4, folio6, folio7];
