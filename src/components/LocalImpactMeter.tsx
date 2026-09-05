import { Heart } from 'lucide-react';

// Modeled assumption (stated, not sourced — see README limitations):
// this platform takes a flat 12% service fee, so the host keeps 88%.
// A typical third-party OTA commission for local activities/tours runs
// 20-30%; we use the midpoint (25%) as the comparison baseline.
const LOCAL_PLATFORM_FEE = 0.12;
const TYPICAL_OTA_FEE = 0.25;

export function LocalImpactMeter({ price }: { price: number }) {
  const localShare = Math.round((1 - LOCAL_PLATFORM_FEE) * 100);
  const otaShare = Math.round((1 - TYPICAL_OTA_FEE) * 100);
  const localAmount = Math.round(price * (1 - LOCAL_PLATFORM_FEE));
  const otaAmount = Math.round(price * (1 - TYPICAL_OTA_FEE));

  return (
    <div className="impact-meter">
      <div className="impact-meter-title"><Heart size={14} /> Local Impact Meter</div>
      <div className="impact-row">
        <span>On LocaLife</span>
        <div className="impact-bar"><div className="impact-fill local" style={{ width: `${localShare}%` }} /></div>
        <strong>₹{localAmount} ({localShare}%)</strong>
      </div>
      <div className="impact-row">
        <span>Typical OTA</span>
        <div className="impact-bar"><div className="impact-fill ota" style={{ width: `${otaShare}%` }} /></div>
        <strong>₹{otaAmount} ({otaShare}%)</strong>
      </div>
      <p className="impact-note">Modeled from a 12% LocaLife service fee vs. a ~25% typical OTA commission on local experiences.</p>
    </div>
  );
}
