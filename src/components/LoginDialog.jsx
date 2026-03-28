import React, { useState } from 'react';
import {
  CalciteDialog,
  CalciteButton,
  CalciteInput,
  CalciteLabel,
  CalciteNotice,
} from '@esri/calcite-components-react';
import IdentityManager from '@arcgis/core/identity/IdentityManager';

export default function LoginDialog({ open, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Brukernavn og passord er påkrevd.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        'https://beredskap.maps.arcgis.com/sharing/rest/generateToken',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            username,
            password,
            client: 'requestip',
            f: 'json',
          }),
        }
      );
      const data = await response.json();
      if (data.error) {
        console.error('[LoginDialog] ArcGIS generateToken error:', JSON.stringify(data.error));
        const msg = data.error.message || data.error.details?.[0] || 'Feil brukernavn eller passord.';
        setError(msg);
      } else {
        console.log('[LoginDialog] Token obtained successfully, expires:', new Date(data.expires).toISOString());
        IdentityManager.registerToken({
          server: 'https://beredskap.maps.arcgis.com/sharing/rest',
          token: data.token,
          expires: data.expires,
          userId: username,
        });
        setUsername('');
        setPassword('');
        onLoginSuccess(data);
      }
    } catch (err) {
      console.warn('[LoginDialog] generateToken error:', err);
      if (err instanceof TypeError) {
        setError('Nettverksfeil. Sjekk internettilkoblingen.');
      } else {
        setError('Pålogging mislyktes. Prøv igjen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <CalciteDialog
      open={open || undefined}
      heading="Logg inn til ArcGIS Online"
      onCalciteDialogClose={handleClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
        {error && (
          <CalciteNotice kind="danger" open icon="x-octagon">
            <div slot="message">{error}</div>
          </CalciteNotice>
        )}

        <CalciteLabel>
          Brukernavn
          <CalciteInput
            value={username}
            placeholder="ArcGIS brukernavn"
            disabled={loading || undefined}
            onCalciteInputInput={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </CalciteLabel>

        <CalciteLabel>
          Passord
          <CalciteInput
            type="password"
            value={password}
            placeholder="Passord"
            disabled={loading || undefined}
            onCalciteInputInput={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </CalciteLabel>
      </div>

      <CalciteButton
        slot="footer-end"
        loading={loading || undefined}
        disabled={loading || undefined}
        onClick={handleSubmit}
      >
        Logg inn
      </CalciteButton>
      <CalciteButton
        slot="footer-start"
        kind="neutral"
        appearance="outline"
        disabled={loading || undefined}
        onClick={handleClose}
      >
        Avbryt
      </CalciteButton>
    </CalciteDialog>
  );
}
