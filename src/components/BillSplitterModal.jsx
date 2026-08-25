import { useState, useMemo, useEffect } from 'react';
import {
  X, Users, QrCode, CheckCircle2, Copy, Check,
  CreditCard, Smartphone, ArrowRight, Share2, Sparkles, Percent
} from 'lucide-react';
import { generateUpiUrl, generateQrSvg, RESTAURANT_UPI_VPA } from '../utils/upiQrGenerator';

export default function BillSplitterModal({
  isOpen,
  onClose,
  order,
  orderMetadata,
  tableNo = 'Table 01',
  onSettleAll,
  addToast,
}) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const grandTotal = Number(orderMetadata?.grandTotal || items.reduce((s, i) => s + (Number(i.price) * (Number(i.quantity) || 0) * 1.1), 0));
  const subtotal = Number(orderMetadata?.subtotal || items.reduce((s, i) => s + (Number(i.price) * (Number(i.quantity) || 0)), 0));
  const taxRatio = subtotal > 0 ? (grandTotal / subtotal) : 1.1;

  const [splitMode, setSplitMode] = useState('equal'); // 'equal' | 'item'
  const [payerCount, setPayerCount] = useState(2);
  const [selectedPayerIndex, setSelectedPayerIndex] = useState(0);
  const [copiedPayerId, setCopiedPayerId] = useState(null);

  // Equal split payers state
  const [equalPayers, setEqualPayers] = useState(() => [
    { id: 1, name: 'Payer 1', isPaid: false, paymentMethod: 'upi' },
    { id: 2, name: 'Payer 2', isPaid: false, paymentMethod: 'upi' },
  ]);

  // Item split state: mapping item index -> payer index
  const [itemAssignments, setItemAssignments] = useState({});

  // Sync payer count with equalPayers array
  useEffect(() => {
    setEqualPayers((prev) => {
      const next = [];
      for (let i = 0; i < payerCount; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({ id: i + 1, name: `Payer ${i + 1}`, isPaid: false, paymentMethod: 'upi' });
        }
      }
      return next;
    });
  }, [payerCount]);

  // Calculate shares based on split mode
  const payersData = useMemo(() => {
    if (splitMode === 'equal') {
      const share = Math.round(grandTotal / payerCount);
      return equalPayers.map((p, idx) => {
        // Handle rounding difference on the last payer
        const amount = idx === equalPayers.length - 1
          ? grandTotal - share * (equalPayers.length - 1)
          : share;
        return {
          ...p,
          amount: Math.max(0, amount),
        };
      });
    } else {
      // Split by item
      const payers = Array.from({ length: payerCount }, (_, i) => ({
        id: i + 1,
        name: equalPayers[i]?.name || `Payer ${i + 1}`,
        isPaid: equalPayers[i]?.isPaid || false,
        paymentMethod: equalPayers[i]?.paymentMethod || 'upi',
        items: [],
        subtotal: 0,
        amount: 0,
      }));

      // Distribute assigned items
      items.forEach((item, itemIdx) => {
        const assignedPayerIdx = itemAssignments[itemIdx] ?? 0;
        const targetPayer = payers[assignedPayerIdx] || payers[0];
        const itemTotal = Number(item.price) * (Number(item.quantity) || 1);
        targetPayer.items.push(item);
        targetPayer.subtotal += itemTotal;
      });

      // Apply tax proportional to items
      return payers.map((p) => ({
        ...p,
        amount: Math.round(p.subtotal * taxRatio),
      }));
    }
  }, [splitMode, payerCount, equalPayers, grandTotal, items, itemAssignments, taxRatio]);

  // Progress metrics
  const totalSettledAmount = payersData.filter((p) => p.isPaid).reduce((s, p) => s + p.amount, 0);
  const percentSettled = grandTotal > 0 ? Math.min(100, Math.round((totalSettledAmount / grandTotal) * 100)) : 0;
  const isFullySettled = percentSettled >= 100 || payersData.every((p) => p.isPaid);

  const activePayer = payersData[selectedPayerIndex] || payersData[0];

  // Generate UPI payload and QR SVG for currently viewed payer
  const upiUrl = useMemo(() => {
    if (!activePayer) return '';
    return generateUpiUrl({
      vpa: RESTAURANT_UPI_VPA,
      name: 'PlateFlow Fine Dining',
      amount: activePayer.amount,
      orderId: order?.id,
      tableNo,
      payerName: activePayer.name,
    });
  }, [activePayer, order?.id, tableNo]);

  const qrSvgData = useMemo(() => {
    if (!upiUrl) return null;
    return generateQrSvg(upiUrl, 160);
  }, [upiUrl]);

  const handleTogglePayerPaid = (index) => {
    setEqualPayers((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, isPaid: !p.isPaid } : p))
    );
  };

  const handleCopyUpi = (payerId) => {
    navigator.clipboard.writeText(upiUrl);
    setCopiedPayerId(payerId);
    if (addToast) addToast(`UPI Payment link copied for ${activePayer.name}`, 'success');
    setTimeout(() => setCopiedPayerId(null), 2500);
  };

  const handleAssignItem = (itemIdx, newPayerIdx) => {
    setItemAssignments((prev) => ({ ...prev, [itemIdx]: Number(newPayerIdx) }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn select-none">
      <div className="card-base max-w-2xl w-full bg-graphite-900 border border-graphite-700 shadow-2xl rounded-2xl overflow-hidden my-auto flex flex-col max-h-[92dvh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-graphite-800/80 border-b border-graphite-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/20 text-accent">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ivory-50 flex items-center gap-2">
                <span>Multi-Payer Bill Splitter</span>
                <span className="text-xs px-2 py-0.5 rounded bg-accent/15 text-accent font-mono font-semibold">
                  {tableNo} • #{order?.id || '0000'}
                </span>
              </h2>
              <p className="text-xs text-graphite-400">
                Split total bill (₹{grandTotal}) across multiple diners with individual dynamic UPI QRs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-graphite-400 hover:text-ivory-100 hover:bg-graphite-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          
          {/* Split Mode & Payer Count Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-graphite-800/60 border border-graphite-700">
            {/* Split Mode Pills */}
            <div className="flex items-center gap-1.5 bg-graphite-900 p-1 rounded-lg border border-graphite-700 text-xs font-semibold">
              <button
                onClick={() => setSplitMode('equal')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  splitMode === 'equal'
                    ? 'bg-accent text-graphite-950 font-bold shadow'
                    : 'text-graphite-400 hover:text-ivory-100'
                }`}
              >
                Split Equally
              </button>
              <button
                onClick={() => setSplitMode('item')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  splitMode === 'item'
                    ? 'bg-accent text-graphite-950 font-bold shadow'
                    : 'text-graphite-400 hover:text-ivory-100'
                }`}
              >
                Split by Dishes
              </button>
            </div>

            {/* Diners Counter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-graphite-400 font-mono">Diners:</span>
              <div className="flex items-center gap-1 bg-graphite-900 px-2 py-1 rounded-lg border border-graphite-700">
                <button
                  disabled={payerCount <= 2}
                  onClick={() => setPayerCount((c) => Math.max(2, c - 1))}
                  className="w-6 h-6 rounded bg-graphite-800 text-ivory-100 font-bold hover:bg-graphite-700 disabled:opacity-30 disabled:hover:bg-graphite-800"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold text-accent font-mono text-sm">{payerCount}</span>
                <button
                  disabled={payerCount >= 10}
                  onClick={() => setPayerCount((c) => Math.min(10, c + 1))}
                  className="w-6 h-6 rounded bg-graphite-800 text-ivory-100 font-bold hover:bg-graphite-700 disabled:opacity-30 disabled:hover:bg-graphite-800"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* If Split By Item: Assignment Matrix */}
          {splitMode === 'item' && (
            <div className="space-y-2.5 p-3.5 rounded-xl bg-graphite-800/40 border border-graphite-700">
              <div className="text-[11px] font-mono font-bold text-graphite-400 uppercase tracking-wider">
                Assign Dishes to Diners ({items.length} items)
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const assignedPayer = itemAssignments[idx] ?? 0;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-graphite-900 border border-graphite-700/80 text-xs">
                      <div>
                        <span className="font-semibold text-ivory-100">{item.name}</span>
                        <span className="text-graphite-400 ml-1.5 font-mono">({item.quantity}×₹{item.price})</span>
                      </div>
                      <select
                        value={assignedPayer}
                        onChange={(e) => handleAssignItem(idx, e.target.value)}
                        className="bg-graphite-800 border border-graphite-600 rounded px-2.5 py-1 text-accent font-semibold font-mono text-xs focus:outline-none focus:border-accent"
                      >
                        {Array.from({ length: payerCount }, (_, pIdx) => (
                          <option key={pIdx} value={pIdx}>
                            Payer {pIdx + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payers Tabs / Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {payersData.map((payer, idx) => {
              const isSelected = selectedPayerIndex === idx;
              return (
                <button
                  key={payer.id}
                  onClick={() => setSelectedPayerIndex(idx)}
                  className={`p-3 rounded-xl text-left border transition-all relative ${
                    isSelected
                      ? 'bg-accent/15 border-accent ring-1 ring-accent text-ivory-100 shadow-md'
                      : 'bg-graphite-800/80 border-graphite-700 text-graphite-300 hover:border-graphite-600'
                  }`}
                >
                  {payer.isPaid && (
                    <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                      <Check size={10} /> Paid
                    </span>
                  )}
                  <div className="text-xs font-semibold text-graphite-400 font-mono truncate">
                    {payer.name}
                  </div>
                  <div className="text-lg font-black text-accent font-mono mt-1">
                    ₹{payer.amount}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Payer UPI & Settlement Card */}
          {activePayer && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-graphite-800 to-graphite-900 border border-accent/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite-700/80 pb-3">
                <div>
                  <div className="text-xs text-graphite-400 font-mono uppercase font-bold">
                    Payment Share for:
                  </div>
                  <div className="text-xl font-bold text-ivory-50 flex items-center gap-2">
                    <span>{activePayer.name}</span>
                    <span className="text-2xl font-black text-accent font-mono">₹{activePayer.amount}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTogglePayerPaid(selectedPayerIndex)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                    activePayer.isPaid
                      ? 'bg-emerald-500 text-graphite-950 hover:bg-emerald-400'
                      : 'btn-secondary text-graphite-200 border-graphite-500 hover:border-accent'
                  }`}
                >
                  <CheckCircle2 size={15} />
                  <span>{activePayer.isPaid ? 'Paid in Full ✓' : 'Mark as Paid'}</span>
                </button>
              </div>

              {/* QR Code & Pay Deep Link */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-1">
                {/* SVG QR */}
                {qrSvgData && (
                  <div
                    className="shrink-0"
                    dangerouslySetInnerHTML={{ __html: qrSvgData.svg }}
                  />
                )}

                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-ivory-100 flex items-center justify-center sm:justify-start gap-1.5">
                      <Smartphone size={14} className="text-accent" /> Scan with Any UPI App
                    </div>
                    <p className="text-[11px] text-graphite-400">
                      GPay, PhonePe, Paytm, CRED or BHIM. Pre-filled with ₹{activePayer.amount}.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <a
                      href={upiUrl}
                      className="btn-primary py-2 px-3 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Smartphone size={13} /> Open UPI App
                    </a>
                    <button
                      onClick={() => handleCopyUpi(activePayer.id)}
                      className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
                    >
                      {copiedPayerId === activePayer.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedPayerId === activePayer.id ? 'Copied' : 'Copy UPI Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table Settlement Progress Bar */}
          <div className="space-y-2 p-3.5 rounded-xl bg-graphite-800/70 border border-graphite-700">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-graphite-400">Table Settlement Progress:</span>
              <span className="font-bold text-accent">
                ₹{totalSettledAmount} / ₹{grandTotal} ({percentSettled}%)
              </span>
            </div>
            <div className="w-full bg-graphite-900 h-2 rounded-full overflow-hidden border border-graphite-700">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  isFullySettled ? 'bg-emerald-400' : 'bg-accent'
                }`}
                style={{ width: `${percentSettled}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-graphite-800/80 border-t border-graphite-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4"
          >
            Close
          </button>

          {isFullySettled && onSettleAll && (
            <button
              onClick={() => {
                onSettleAll();
                onClose();
              }}
              className="bg-emerald-400 text-graphite-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-400/20 animate-pulse"
            >
              <CheckCircle2 size={15} /> Complete &amp; Print Bill (All Settled)
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
