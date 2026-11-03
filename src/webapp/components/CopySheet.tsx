'use client';

import { SheetHead } from './ui';

/** Shown when the browser refuses clipboard access: lets the user copy the text by hand. */
export function CopySheet({ text }: { text: string }) {
  return (
    <>
      <SheetHead title="Copy this text" />
      <div className="sheet-body">
        <textarea className="input" readOnly style={{ minHeight: 120 }} value={text} onFocus={(e) => e.currentTarget.select()} />
      </div>
    </>
  );
}
