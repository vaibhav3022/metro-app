import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function WebQRScanner({ onScan }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Only initialize once
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scannerRef.current.render(
        (decodedText) => {
          if (scannerRef.current) {
            scannerRef.current.clear();
          }
          onScan(decodedText);
        },
        (error) => {
          // ignore error logs
        }
      );
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.log('Failed to clear scanner', e));
        scannerRef.current = null;
      }
    };
  }, [onScan]);

  return <div id="qr-reader" style={{ width: '100%', height: '100%', backgroundColor: '#000' }}></div>;
}
