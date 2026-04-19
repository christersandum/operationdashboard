/* ============================================================
   OperationPicker.jsx — Dialog for opening operations
   Only local file import is available.
   ============================================================ */

import React from 'react';
import {
  CalciteDialog,
  CalciteButton,
} from '@esri/calcite-components-react';

export default function OperationPicker({
  open,
  onClose,
  onOpenLocalFile,
}) {
  return (
    <CalciteDialog
      open={open || undefined}
      heading="Last inn operasjon"
      widthScale="s"
      onCalciteDialogClose={onClose}
    >
      <div>
        <CalciteButton
          kind="neutral"
          appearance="outline"
          width="full"
          iconStart="folder-open"
          onClick={onOpenLocalFile}
        >
          📂 Åpne lokal fil (JSON)
        </CalciteButton>
      </div>

      <CalciteButton slot="footer-start" kind="neutral" appearance="outline" onClick={onClose}>
        Avbryt
      </CalciteButton>
    </CalciteDialog>
  );
}
