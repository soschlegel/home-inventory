import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useTranslation } from 'react-i18next';
import { searchProducts } from '../api/products';
import { Camera, X } from 'lucide-react';

type ScanState = 'idle' | 'scanning' | 'found' | 'not_found' | 'error';

export default function QRScannerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const [state, setState] = useState<ScanState>('idle');
  const [lastBarcode, setLastBarcode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const stopScan = () => {
    try { controlsRef.current?.stop(); } catch (_) { /* ignore */ }
    controlsRef.current = null;
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  const startScan = async () => {
    setState('scanning');
    setLastBarcode('');
    setErrorMsg('');

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const backCamera = devices.find((d) =>
        /back|rear|environment/i.test(d.label)
      ) ?? devices[0];

      if (!backCamera) throw new Error('no_camera');

      const controls = await reader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current!,
        async (result, _err) => {
          if (!result) return;
          const code = result.getText();
          stopScan();
          setLastBarcode(code);

          try {
            const products = await searchProducts(code);
            const match = products.find((p) => p.barcode === code);
            if (match) {
              setState('found');
              setTimeout(() => navigate(`/products/${match.id}`), 800);
            } else {
              setState('not_found');
            }
          } catch {
            setState('not_found');
          }
        }
      );
      controlsRef.current = controls as unknown as { stop: () => void };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setState('error');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('qrscanner.title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('qrscanner.subtitle')}</p>

      {/* Video preview */}
      <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden mb-4">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

        {state !== 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            {state === 'idle' && (
              <button
                type="button"
                onClick={startScan}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Camera size={20} /> {t('qrscanner.start_btn')}
              </button>
            )}
            {state === 'found' && (
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-white font-medium">{t('qrscanner.found', { code: lastBarcode })}</p>
              </div>
            )}
            {state === 'not_found' && (
              <div className="text-center px-6">
                <div className="text-4xl mb-2">❓</div>
                <p className="text-white mb-1">{t('qrscanner.not_found', { code: lastBarcode })}</p>
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  <button
                    type="button"
                    onClick={startScan}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    {t('qrscanner.retry_btn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/products', { state: { prefillBarcode: lastBarcode } })}
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
                  >
                    {t('qrscanner.create_product_btn')}
                  </button>
                </div>
              </div>
            )}
            {state === 'error' && (
              <div className="text-center px-6">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-red-300 mb-3">{t('qrscanner.error')}</p>
                <p className="text-gray-400 text-xs mb-4">{errorMsg}</p>
                <button
                  type="button"
                  onClick={startScan}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  {t('qrscanner.retry_btn')}
                </button>
              </div>
            )}
          </div>
        )}

        {state === 'scanning' && (
          <>
            {/* Scan target overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-white/60 rounded-lg relative">
                <span className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl" />
                <span className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr" />
                <span className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl" />
                <span className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => { stopScan(); setState('idle'); }}
              className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
              aria-label={t('common.cancel')}
            >
              <X size={18} />
            </button>
            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm opacity-75">
              {t('qrscanner.scanning_hint')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
