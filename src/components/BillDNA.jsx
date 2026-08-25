import { useMemo, useState } from 'react';
import { ChevronDown, Dna, Copy, Check } from 'lucide-react';
import { generateFingerprint } from '../utils/billingEngine';

export default function BillDNA({ order, orderMetadata }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const itemCount = Number(orderMetadata?.itemCount || order?.items?.length || 0);
  const plateCount = Number(orderMetadata?.plateCount || 0);
  const subtotal = Number(orderMetadata?.subtotal || 0);
  const grandTotal = Number(orderMetadata?.grandTotal || 0);

  const fingerprint = useMemo(() => {
    return generateFingerprint(order?.id, itemCount, plateCount, grandTotal);
  }, [order?.id, itemCount, plateCount, grandTotal]);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fingerprint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card-base overflow-hidden border-graphite-700/80 shadow-lg shadow-graphite-950/40">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 sm:px-6 py-4 flex items-center justify-between hover:bg-graphite-800/50 transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/15 text-accent border border-accent/30">
            <Dna size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-accent tracking-widest uppercase font-mono">
              BILL DNA
            </div>
            <div className="text-xs text-graphite-400">Transaction Fingerprint & Checksum</div>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-graphite-400 transition-transform duration-300 ${
            expanded ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-graphite-700/80 px-5 sm:px-6 py-4 space-y-4 bg-graphite-900/50 animate-fadeIn">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-graphite-800/70 p-2.5 rounded-lg border border-graphite-700/50">
              <div className="text-graphite-500 uppercase tracking-wider font-mono text-[10px]">Order Ref</div>
              <div className="font-mono font-bold text-ivory-100 text-sm mt-0.5">#{order?.id || 'NEW'}</div>
            </div>
            <div className="bg-graphite-800/70 p-2.5 rounded-lg border border-graphite-700/50">
              <div className="text-graphite-500 uppercase tracking-wider font-mono text-[10px]">State</div>
              <div className="font-mono font-bold text-green-400 text-sm mt-0.5">{order?.status || 'ACTIVE'}</div>
            </div>
            <div className="bg-graphite-800/70 p-2.5 rounded-lg border border-graphite-700/50">
              <div className="text-graphite-500 uppercase tracking-wider font-mono text-[10px]">Distinct Items</div>
              <div className="font-mono font-bold text-ivory-100 text-sm mt-0.5">{itemCount}</div>
            </div>
            <div className="bg-graphite-800/70 p-2.5 rounded-lg border border-graphite-700/50">
              <div className="text-graphite-500 uppercase tracking-wider font-mono text-[10px]">Total Plates</div>
              <div className="font-mono font-bold text-ivory-100 text-sm mt-0.5">{plateCount}</div>
            </div>
            <div className="bg-graphite-800/70 p-2.5 rounded-lg border border-graphite-700/50">
              <div className="text-graphite-500 uppercase tracking-wider font-mono text-[10px]">Subtotal</div>
              <div className="font-mono font-bold text-ivory-100 text-sm mt-0.5">₹{subtotal.toFixed(0)}</div>
            </div>
            <div className="bg-graphite-800/70 p-2.5 rounded-lg border border-graphite-700/50">
              <div className="text-graphite-500 uppercase tracking-wider font-mono text-[10px]">Grand Total</div>
              <div className="font-mono font-bold text-accent text-sm mt-0.5">₹{grandTotal.toFixed(0)}</div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Checksum Hash Display */}
          <div>
            <div className="flex items-center justify-between text-xs text-graphite-400 uppercase tracking-wider font-mono mb-1.5">
              <span>Live Checksum Hash</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-accent hover:underline font-mono"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                <span>{copied ? 'COPIED' : 'COPY HASH'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-accent p-2.5 bg-graphite-950 rounded-lg border border-accent/30 tracking-widest font-bold break-all flex items-center justify-between">
              <span>{fingerprint}</span>
              <span className="text-[10px] text-graphite-500 ml-2">SHA-MAP</span>
            </div>
          </div>

          {/* Dynamic 12-block Chromatic DNA Map */}
          <div>
            <div className="text-[10px] text-graphite-500 uppercase tracking-wider font-mono mb-1.5">
              Chromatic DNA Map
            </div>
            <div className="grid grid-cols-12 gap-1 sm:gap-1.5">
              {fingerprint.split('').map((char, i) => {
                const hexVal = parseInt(char, 16) || 7;
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-sm transition-all duration-500 transform hover:scale-110 shadow-sm"
                    style={{
                      backgroundColor: `hsl(${hexVal * 24}, 75%, 48%)`,
                    }}
                    title={`Block ${i + 1}: ${char}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
