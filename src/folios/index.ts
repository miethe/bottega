import type { FolioModule } from '../shell/types';
import { folio1 } from './folio1';
import { folio2 } from './folio2';
import { folio3 } from './folio3';
import { folio4 } from './folio4';
import { folio5 } from './folio5';
import { folio6 } from './folio6';
import { folio7 } from './folio7';

/** The pages that are drawn, in order. A folio joins the notebook by being added here. */
export const folios: FolioModule[] = [folio1, folio2, folio3, folio4, folio5, folio6, folio7];
