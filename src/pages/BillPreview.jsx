import { Download, Printer, ArrowLeft, Check, Sparkles, Users } from 'lucide-react';
import { useRef, useState, useMemo } from 'react';
import { getSavedHotelLocation, formatHotelAddress } from '../utils/indiaLocations';
import BillSplitterModal from '../components/BillSplitterModal';

export default function BillPreview({ order, orderMetadata, onNavigate, tableNo = 'Table 01' }) {
  const receiptRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isSplitterOpen, setIsSplitterOpen] = useState(false);
  const hotelLocation = useMemo(() => getSavedHotelLocation(), []);

  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const orderId = order?.id || 1042;
  const orderDate = order?.date || new Date().toLocaleDateString('en-GB');
  const orderTime = order?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const subtotal = Number(orderMetadata?.subtotal ?? orderItems.reduce((s, i) => s + (Number(i.price) * Number(i.quantity || 0)), 0));
  const loyaltyDiscount = Number(orderMetadata?.loyaltyDiscount ?? 0);
  const loyaltyMember = orderMetadata?.loyaltyMember || null;
  const sgst = Number(orderMetadata?.sgst ?? (subtotal * 0.05));
  const cgst = Number(orderMetadata?.cgst ?? (subtotal * 0.05));
  const grandTotal = Number(orderMetadata?.grandTotal ?? (subtotal + sgst + cgst));

  const invoiceNumber = useMemo(() => `INV-2026-${String(orderId).padStart(5, '0')}`, [orderId]);

  const securityHash = useMemo(() => {
    const raw = `${orderId}-${orderDate}-${grandTotal}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `PLT-SEC-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  }, [orderId, orderDate, grandTotal]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      setPdfSuccess(false);

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = document.getElementById('thermal-bill-container');
      if (!element) throw new Error('Receipt container not found');

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, Math.max(170, (canvas.height * 80) / canvas.width)],
      });

      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${invoiceNumber}.pdf`);

      setIsGenerating(false);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto w-full animate-fadeIn select-none">
      {/* Top Toolbar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-graphite-800">
        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('operations')}
              className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft size={14} /> Console
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-ivory-50">Official Tax Receipt</h1>
            <p className="text-xs text-graphite-400 font-mono">Single-Page Thermal Output (80mm)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            id="preview-split-bill-btn"
            onClick={() => setIsSplitterOpen(true)}
            className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-xs font-bold text-accent border-accent/40"
            title="Split bill with friends via UPI QR"
          >
            <Users size={14} /> Split Bill (UPI)
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-secondary py-2 px-3.5 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Printer size={15} /> Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className={`btn-primary py-2 px-3.5 flex items-center gap-1.5 text-xs font-bold shadow-md shadow-accent/20 ${
              isGenerating ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {pdfSuccess ? <Check size={15} className="text-graphite-950" /> : <Download size={15} />}
            {isGenerating ? 'Generating...' : pdfSuccess ? 'Downloaded!' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* ─── Strictly Compact Bill (Single Page Thermal Format) ─────────────── */}
      <div className="flex justify-center items-center py-2 sm:py-6">
        <div
          id="thermal-bill-container"
          ref={receiptRef}
          className="w-full max-w-[340px] bg-white text-zinc-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-zinc-200 font-sans select-none"
          style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}
        >
          {/* Header Brand */}
          <div className="text-center space-y-1.5 pb-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-amber-600 text-lg">◆</span>
              <h2 className="text-xl font-black tracking-widest text-amber-600 uppercase">
                PLATEFLOW
              </h2>
            </div>
            <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              FINE DINING • RESTAURANT OPERATIONS
            </div>
            <div className="text-[10px] font-mono text-zinc-400 tracking-wide">
              GSTIN: 33AAAAA0000A1Z5
            </div>
          </div>

          {/* Metadata Section */}
          <div className="py-3 border-t border-dashed border-zinc-300 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Invoice</span>
              <span className="font-bold text-zinc-900">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Order ID</span>
              <span className="font-bold text-zinc-900">#{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Date</span>
              <span className="text-zinc-800">{orderDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Time</span>
              <span className="text-zinc-800">{orderTime}</span>
            </div>
          </div>

          {/* Items Header */}
          <div className="py-2.5 border-t border-dashed border-zinc-300">
            <div className="flex justify-between text-[11px] font-bold text-zinc-600 uppercase tracking-wider pb-1.5 font-mono">
              <span className="flex-1">ITEM</span>
              <span className="w-16 text-center">QTY</span>
              <span className="w-16 text-right">AMOUNT</span>
            </div>

            {/* Item Rows */}
            <div className="space-y-1.5 py-1">
              {orderItems.length > 0 ? (
                orderItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between items-center text-xs font-mono">
                    <span className="flex-1 font-medium text-zinc-900 truncate pr-2">
                      {item.name}
                    </span>
                    <span className="w-16 text-center text-zinc-500 text-[11px]">
                      {item.quantity}×₹{item.price}
                    </span>
                    <span className="w-16 text-right font-bold text-zinc-900">
                      ₹{(Number(item.price) * Number(item.quantity)).toFixed(0)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-xs text-zinc-400 font-mono">
                  No items in this order
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="py-3 border-t border-dashed border-zinc-300 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-bold text-zinc-900">₹{subtotal.toFixed(0)}</span>
            </div>

            {/* Loyalty Discount Line (only if VIP patron applied) */}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between items-center" style={{ color: '#059669' }}>
                <span style={{ fontWeight: 'bold' }}>
                  ★ {loyaltyMember?.name || 'VIP'} Loyalty ({loyaltyMember?.tier || 'VIP'})
                </span>
                <span style={{ fontWeight: 'bold' }}>- ₹{loyaltyDiscount.toFixed(0)}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-zinc-600">SGST (5%)</span>
              <span className="text-zinc-700">₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">CGST (5%)</span>
              <span className="text-zinc-700">₹{cgst.toFixed(2)}</span>
            </div>

            {/* Thick line before Grand Total */}
            <div className="border-t-2 border-zinc-900 pt-2 mt-2 flex justify-between items-center">
              <span className="text-sm font-black tracking-wide text-zinc-900 uppercase">
                GRAND TOTAL
              </span>
              <span className="text-base font-black text-zinc-900 font-mono">
                ₹{grandTotal.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Security Checksum */}
          <div className="pt-2 pb-3 text-center text-[10px] font-mono text-zinc-400">
            Checksum: {securityHash}
          </div>

          {/* ─── Food Quote & Complementary Dining Perk (100% visible on PDF) ─── */}
          <div className="pt-4 border-t border-dashed border-zinc-300 text-center space-y-2">
            <div style={{ color: '#d97706', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span>Thank you for dining with us!</span>
              <span>🙏</span>
            </div>

            {/* Clear Solid Dining Quote & Perk Card */}
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1.5px solid #f59e0b',
                borderRadius: '10px',
                padding: '8px 10px',
                margin: '6px auto',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  color: '#78350f',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  fontWeight: '600',
                  lineHeight: '1.4',
                  marginBottom: '4px',
                }}
              >
                &ldquo;Good food is the foundation of genuine happiness.&rdquo;
              </div>
              <div
                style={{
                  color: '#92400e',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  letterSpacing: '0.2px',
                }}
              >
                {loyaltyMember ? (
                  <>
                    {loyaltyMember.tier === 'PLATINUM' && '👑 Platinum Perk: Free Appetizer + Dedicated Chef Table'}
                    {loyaltyMember.tier === 'GOLD' && '🥇 Gold Perk: Chef Special Gulab Jamun & Priority Prep'}
                    {loyaltyMember.tier === 'SILVER' && '🥈 Silver Perk: Complimentary Kumbakonam Filter Coffee'}
                    {loyaltyMember.tier === 'BRONZE' && '🥉 Perk: Fresh Mints & Royal Mouth Freshener'}
                  </>
                ) : (
                  <>★ Complementary: Fresh Mints &amp; Royal Mouth Freshener</>
                )}
              </div>
            </div>

            <div className="text-[10px] text-zinc-500 pt-1 font-mono">
              Powered by PlateFlow Billing Engine
            </div>
            {/* Hotel Location & Pin Code (Auto-generated from state/city selection) */}
            <div className="text-[10px] font-medium text-zinc-700 font-mono">
              {formatHotelAddress(hotelLocation)}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Payer Bill Splitter Modal */}
      <BillSplitterModal
        isOpen={isSplitterOpen}
        onClose={() => setIsSplitterOpen(false)}
        order={order}
        orderMetadata={orderMetadata}
        tableNo={tableNo}
      />
    </div>
  );
}
