export default function BillSummary({ orderMetadata }) {
  const subtotal = Number(orderMetadata?.subtotal || 0);
  const loyaltyDiscount = Number(orderMetadata?.loyaltyDiscount || 0);
  const sgst = Number(orderMetadata?.sgst || 0);
  const cgst = Number(orderMetadata?.cgst || 0);
  const grandTotal = Number(orderMetadata?.grandTotal || 0);
  const loyaltyMember = orderMetadata?.loyaltyMember;

  return (
    <div className="card-base p-5 sm:p-6 space-y-4 shadow-lg shadow-graphite-950/40">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-graphite-300 font-mono">
          Financial Summary
        </h3>
        <span className="text-xs text-graphite-500 font-mono">Tax Breakdown (5% + 5%)</span>
      </div>

      <div className="divider"></div>

      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm sm:text-base">
        <span className="text-graphite-400 uppercase tracking-wider font-mono text-xs sm:text-sm">
          Subtotal
        </span>
        <span className="font-bold text-ivory-100 font-mono">
          ₹{subtotal.toFixed(0)}
        </span>
      </div>

      {/* Loyalty Discount Row (if applicable) */}
      {loyaltyDiscount > 0 && (
        <div className="flex items-center justify-between text-sm sm:text-base p-2.5 rounded-lg bg-accent/10 border border-accent/30">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-accent">
              ★ {loyaltyMember?.name || 'VIP Patron'} Loyalty Discount ({loyaltyMember?.tier || 'VIP'}):
            </span>
          </div>
          <span className="font-bold text-accent font-mono">
            - ₹{loyaltyDiscount.toFixed(0)}
          </span>
        </div>
      )}

      {/* SGST */}
      <div className="flex items-center justify-between text-sm sm:text-base">
        <div className="flex items-center gap-2">
          <span className="text-graphite-400 uppercase tracking-wider font-mono text-xs sm:text-sm">
            SGST
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-mono font-semibold">
            5%
          </span>
        </div>
        <span className="font-bold text-green-400 font-mono">
          ₹{sgst.toFixed(0)}
        </span>
      </div>

      {/* CGST */}
      <div className="flex items-center justify-between text-sm sm:text-base">
        <div className="flex items-center gap-2">
          <span className="text-graphite-400 uppercase tracking-wider font-mono text-xs sm:text-sm">
            CGST
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-mono font-semibold">
            5%
          </span>
        </div>
        <span className="font-bold text-green-400 font-mono">
          ₹{cgst.toFixed(0)}
        </span>
      </div>

      <div className="divider"></div>

      {/* Grand Total */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ivory-50 font-mono">
            Grand Total
          </span>
          <div className="text-[10px] text-graphite-400">Inclusive of all applicable taxes</div>
        </div>
        <span className="text-2xl sm:text-4xl font-black text-accent font-mono">
          ₹{grandTotal.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
