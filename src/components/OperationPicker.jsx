/* ============================================================
   OperationPicker.jsx — Dialog for opening operations
   Shown when the user clicks "Last inn operasjon".
   When signed in: lists operations from ArcGIS Online + local file.
   When not signed in: only local file import is available.
   ============================================================ */

import React from 'react';
import {
  CalciteDialog,
  CalciteButton,
  CalciteList,
  CalciteListItem,
  CalciteNotice,
  CalciteIcon,
} from '@esri/calcite-components-react';

export default function OperationPicker({
  open,
  onClose,
  isSignedIn,
  operationFolders,      // [{ folderId, operationName }]
  loadingFolders,        // bool — while fetching folder list
  onSelectFolder,        // (folderId) => void
  onOpenLocalFile,       // () => void
}) {
  return (
    <CalciteDialog
      open={open || undefined}
      heading="Last inn operasjon"
      widthScale="s"
      onCalciteDialogClose={onClose}
    >
      {/* Local file option — always shown */}
      <div style={{ marginBottom: isSignedIn ? '16px' : 0 }}>
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

      {/* ArcGIS Online operations — only when signed in */}
      {isSignedIn && (
        <>
          <div style={{
            fontSize: '12px',
            color: 'var(--calcite-color-text-3)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Operasjoner i ArcGIS Online
          </div>

          {loadingFolders ? (
            <CalciteNotice open icon="information" kind="brand" scale="s">
              <span slot="message">Henter operasjoner fra ArcGIS Online…</span>
            </CalciteNotice>
          ) : operationFolders.length === 0 ? (
            <CalciteNotice open icon="information" scale="s">
              <span slot="message">Ingen lagrede operasjoner funnet i ArcGIS Online.</span>
            </CalciteNotice>
          ) : (
            <CalciteList>
              {operationFolders.map(folder => (
                <CalciteListItem
                  key={folder.folderId}
                  label={folder.operationName}
                  description={folder.folderTitle}
                  onClick={() => onSelectFolder(folder.folderId)}
                  style={{ cursor: 'pointer' }}
                >
                  <CalciteIcon slot="content-start" icon="map" scale="s" />
                </CalciteListItem>
              ))}
            </CalciteList>
          )}
        </>
      )}

      {!isSignedIn && (
        <CalciteNotice open icon="information" scale="s" style={{ marginTop: '12px' }}>
          <span slot="message">Logg inn for å laste operasjoner fra ArcGIS Online.</span>
        </CalciteNotice>
      )}

      <CalciteButton slot="footer-start" kind="neutral" appearance="outline" onClick={onClose}>
        Avbryt
      </CalciteButton>
    </CalciteDialog>
  );
}
