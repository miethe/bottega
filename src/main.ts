import '@fontsource/im-fell-english/latin-400.css';
import '@fontsource/im-fell-english/latin-400-italic.css';
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-400-italic.css';
import '@fontsource/eb-garamond/latin-500.css';
import './styles/base.css';
import { folios } from './folios';
import { mountFolio } from './shell/folio';
import { mountColophon, mountCover } from './shell/pages';

const app = document.getElementById('notebook');
if (app) {
  app.append(mountCover(folios));
  const main = document.createElement('main');
  folios.forEach((f, i) => main.append(mountFolio(f, i + 1)));
  app.append(main, mountColophon());
  document.documentElement.dataset.ready = 'true';
}
