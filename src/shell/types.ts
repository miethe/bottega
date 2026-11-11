/** The words on a folio. All copy lives in src/copy and is written by the author. */
export interface FolioCopy {
  numeral: string;
  title: string;
  /** Two or three sentences before the toy. Plain text, one string per paragraph. */
  setup: string[];
  /** What the unbroken seal says. */
  sealed: string;
  /** The law. A short imperative. */
  law: string;
  /** One optional line under the law. */
  lawNote?: string;
  /** Margin note: the model, with its numbers. */
  model: string[];
  /** Margin note: where this toy lies. */
  lies: string[];
}

/** What a folio's toy receives when it is mounted. */
export interface FolioCtx {
  /** The folio's <section>. */
  root: HTMLElement;
  /** Put the drawing here. */
  stage: HTMLElement;
  /** Put the levers here. */
  levers: HTMLElement;
  /** A free area under the result line (charts, tallies). */
  extras: HTMLElement;
  /** Set the result line. Limited inline HTML allowed (<b class="err">, <i>). */
  setResult(html: string): void;
  /** Break the seal: the player has produced the failure. Idempotent. */
  breakSeal(): void;
  /** True once the law has been revealed, by play or by asking. */
  lawRevealed(): boolean;
  /** Called when the law is revealed by either route. */
  onLaw(fn: () => void): void;
  /** True if the reader asked for reduced motion. */
  reducedMotion(): boolean;
}

export interface FolioModule {
  /** Lowercase roman numeral: 'i' .. 'vii'. Used for ids and storage. */
  id: string;
  copy: FolioCopy;
  mount(ctx: FolioCtx): void;
}
