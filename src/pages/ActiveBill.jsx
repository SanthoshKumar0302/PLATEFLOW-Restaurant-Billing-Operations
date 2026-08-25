import { useState, useMemo } from 'react';
import { FileText, ArrowRight, Calculator, CheckCircle2, ShoppingBag, Clock, Receipt, Users, Phone, Crown, Sparkles, Star } from 'lucide-react';
import BillItem from '../components/BillItem';
import BillSummary from '../components/BillSummary';
import QuantityGuard from '../components/QuantityGuard';
import BillSplitterModal from '../components/BillSplitterModal';
import { findPatronByPhone, LOYALTY_TIERS, recordPatronVisit } from '../utils/customerLoyaltyEngine';
import { getOrderMetadata } from '../utils/billingEngine';

export default function ActiveBill({
  order,
  orderMetadata,
  onUpdateQuantity,
  onRemoveItem,
  onGenerateBill,
  onNavigate,
  addToast,
  tableNo = 'Table 01',
}) {
  const [guardModalData, setGuardModalData] = useState(null);
  const [isSplitterOpen, setIsSplitterOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');

  const items = Array.isArray(order?.items) ? order.items : [];
  const itemCount = items.length;

  // Active loyalty member lookup by phone
  const loyaltyMember = useMemo(() => {
    return findPatronByPhone(customerPhone);
  }, [customerPhone]);

  // Recalculate metadata with loyalty discount if patron is found
  const dynamicMetadata = useMemo(() => {
    return getOrderMetadata(order, 'standard', loyaltyMember);
  }, [order, loyaltyMember]);

  const activeTierMeta = loyaltyMember ? LOYALTY_TIERS[loyaltyMember.tier] || LOYALTY_TIERS.BRONZE : null;

  const handleRemoveClick = (item) => {
    setGuardModalData({
      available: item.quantity,
      requested: item.quantity,
      itemName: item.name,
      reason: `Confirm removing all ${item.quantity} plate(s) of "${item.name}" from active bill.`,
      targetItemId: item.id,
    });
  };

  const handleConfirmRemove = () => {
    if (guardModalData?.targetItemId) {
      onRemoveItem(guardModalData.targetItemId);
    }
    setGuardModalData(null);
  };

  const handleQuantityChange = (item, change) => {
    const nextQty = item.quantity + change;
    if (nextQty < 0) {
      setGuardModalData({
        available: item.quantity,
        requested: Math.abs(nextQty),
        itemName: item.name,
        reason: `Cannot set negative plates (-${Math.abs(nextQty)}) for "${item.name}". Protected by InvalidQuantity rule.`,
      });
      return;
    }
    if (nextQty === 0) {
      handleRemoveClick(item);
      return;
    }
    if (nextQty > 99) {
      setGuardModalData({
        available: 99,
        requested: nextQty,
        itemName: item.name,
        reason: `Maximum plate threshold (99) reached for "${item.name}".`,
      });
      return;
    }
    onUpdateQuantity(item.id, nextQty);
  };

  const handleCalculateTotal = () => {
    if (addToast) {
      addToast(
        `Verified bill total: ₹${orderMetadata.grandTotal.toFixed(0)} (Subtotal: ₹${orderMetadata.subtotal.toFixed(0)} + SGST: ₹${orderMetadata.sgst.toFixed(0)} + CGST: ₹${orderMetadata.cgst.toFixed(0)})`,
        'success'
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-graphite-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-mono font-bold border border-accent/30">
              ACTIVE BILL
            </span>
            <span className="text-xs text-graphite-400 font-mono">
              Live Session #{order?.id || '---'}
            </span>
          </div>
          <h1 className="heading-md text-xl sm:text-2xl text-ivory-50">
            Current Order Compilation
          </h1>
          <p className="text-xs sm:text-sm text-graphite-400">
            Active plates in progress. Generating the bill archives it into Order History.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              title="View completed order history archive"
            >
              <Clock size={14} className="text-accent" />
              <span>Order History</span>
            </button>
          )}

          {itemCount > 0 && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('dishes')}
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <ShoppingBag size={14} />
              <span>Add Dishes</span>
            </button>
          )}
        </div>
      </div>

      {itemCount > 0 ? (
        <div className="space-y-6">
          {/* Order Items List Card */}
          <div className="card-base overflow-hidden border-graphite-700/80 shadow-lg shadow-graphite-950/30">
            <div className="px-5 sm:px-6 py-4 border-b border-graphite-700/80 bg-graphite-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-accent" />
                <h3 className="heading-sm text-sm sm:text-base font-bold">
                  Active Selected Dishes ({itemCount})
                </h3>
              </div>
              <span className="text-xs font-mono text-graphite-400">
                {orderMetadata?.plateCount || 0} Total Plates
              </span>
            </div>

            <div className="divide-y divide-graphite-700/60 bg-graphite-900/40">
              {items.map((item) => (
                <BillItem
                  key={item.id}
                  item={item}
                  onQuantityChange={(change) => handleQuantityChange(item, change)}
                  onRemove={() => handleRemoveClick(item)}
                  onGuardTrigger={(data) => setGuardModalData(data)}
                />
              ))}
            </div>
          </div>

          {/* Customer Loyalty & Taste DNA Lookup Card */}
          <div className="card-base p-4 sm:p-5 bg-gradient-to-br from-graphite-900 via-graphite-900 to-accent/5 border border-graphite-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/20 text-accent">
                  <Crown size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-ivory-100 uppercase tracking-wider">
                    Customer Loyalty &amp; Taste DNA
                  </h4>
                  <p className="text-[11px] text-graphite-400">
                    Lookup member mobile number to auto-apply VIP discount &amp; complimentary perks
                  </p>
                </div>
              </div>

              {/* Phone Input */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Phone size={13} className="absolute left-2.5 top-2.5 text-graphite-400" />
                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 bg-graphite-800 border border-graphite-600 rounded-lg text-xs text-ivory-100 placeholder-graphite-500 font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerPhone('9876543210')}
                  className="px-2 py-1.5 bg-graphite-800 hover:bg-graphite-700 text-[10px] font-mono text-accent rounded-lg border border-graphite-700 whitespace-nowrap"
                  title="Load demo VIP patron"
                >
                  VIP Demo
                </button>
              </div>
            </div>

            {/* If Patron Found: VIP Profile Card */}
            {loyaltyMember && (
              <div className="p-3 rounded-xl bg-graphite-800/80 border border-accent/40 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{activeTierMeta?.icon}</span>
                    <span className="font-bold text-sm text-ivory-100">{loyaltyMember.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${activeTierMeta?.badgeClass}`}>
                      {activeTierMeta?.name} ({activeTierMeta?.discountPercent}% OFF)
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">
                    ✓ {activeTierMeta?.discountPercent}% Loyalty Discount Applied
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1 text-graphite-300">
                  <div>
                    <span className="text-graphite-500">Taste DNA: </span>
                    <span className="text-accent font-semibold">{loyaltyMember.tasteDna}</span>
                  </div>
                  <div>
                    <span className="text-graphite-500">VIP Perk: </span>
                    <span className="text-emerald-300 font-semibold">{activeTierMeta?.perk}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bill Summary Card (Subtotal, Loyalty Discount, SGST 5%, CGST 5%, Grand Total) */}
          <BillSummary orderMetadata={dynamicMetadata} />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
            <button
              type="button"
              id="split-bill-btn"
              onClick={() => setIsSplitterOpen(true)}
              className="btn-secondary py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 hover:bg-graphite-800 border-accent/40 text-accent"
              title="Split this bill across multiple diners with individual UPI QRs"
            >
              <Users size={18} />
              <span>Split Bill (UPI QR)</span>
            </button>
            <button
              type="button"
              onClick={handleCalculateTotal}
              className="btn-secondary py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 hover:bg-graphite-800"
            >
              <Calculator size={18} />
              <span>Verify Total</span>
            </button>
            <button
              type="button"
              onClick={onGenerateBill}
              className="flex-1 btn-primary py-3 text-sm sm:text-base font-extrabold uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-accent/20"
            >
              <CheckCircle2 size={18} />
              <span>Generate &amp; Archive Bill</span>
            </button>
          </div>

          {/* Multi-Payer Bill Splitter Modal */}
          <BillSplitterModal
            isOpen={isSplitterOpen}
            onClose={() => setIsSplitterOpen(false)}
            order={order}
            orderMetadata={orderMetadata}
            tableNo={tableNo}
            onSettleAll={onGenerateBill}
            addToast={addToast}
          />
        </div>
      ) : (
        /* Empty State with Working Links */
        <div className="card-base p-10 sm:p-14 text-center space-y-5 border-graphite-700/60 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-graphite-800/80 border border-graphite-700 flex items-center justify-center mx-auto text-accent">
            <ShoppingBag size={28} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-ivory-100">No active dishes in current session</h3>
            <p className="text-xs sm:text-sm text-graphite-400 leading-relaxed">
              When dishes are selected in Dish Explorer, they appear here in your Active Bill. Once generated, completed bills are archived in Order History.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('dishes')}
              className="btn-primary py-2.5 px-6 text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-accent/15"
            >
              <span>Explore Dishes Menu</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('history')}
              className="btn-secondary py-2.5 px-5 text-sm font-semibold inline-flex items-center gap-2"
            >
              <Clock size={16} className="text-accent" />
              <span>View Completed History</span>
            </button>
          </div>
        </div>
      )}

      {/* Quantity Guard Modal */}
      {guardModalData && (
        <QuantityGuard
          guardData={guardModalData}
          onClose={() => setGuardModalData(null)}
          onConfirm={handleConfirmRemove}
        />
      )}
    </div>
  );
}
