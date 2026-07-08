const fs = require('fs');
let content = fs.readFileSync('src/components/SubscriptionPage.tsx', 'utf8');

const oldProps = `interface SubscriptionPageProps {
  user: UserProfile;
  currentClientCount?: number;
  currentInvoiceCount?: number;
  onUpgradePlan: (plan: 'starter' | 'professional' | 'enterprise', isYearly?: boolean) => void;
  onRenewSubscription: () => void;
  onSimulateExpiry: (expire: boolean) => void;
  onRefreshUserStatus?: () => void;
}`;

const newProps = `interface SubscriptionPageProps {
  user: UserProfile;
  currentClientCount?: number;
  currentInvoiceCount?: number;
  onUpgradePlan: (plan: 'starter' | 'professional' | 'enterprise', isYearly?: boolean) => void;
  onRenewSubscription: () => void;
  onSimulateExpiry: (expire: boolean) => void;
  onSimulateQuota?: (type: 'clients' | 'invoices', max: number) => void;
  onRefreshUserStatus?: () => void;
}`;

content = content.replace(oldProps, newProps);

const oldComp = `export default function SubscriptionPage({
  user, currentClientCount = 0, currentInvoiceCount = 0, onUpgradePlan, onRenewSubscription, onSimulateExpiry, onRefreshUserStatus
}: SubscriptionPageProps) {`;

const newComp = `export default function SubscriptionPage({
  user, currentClientCount = 0, currentInvoiceCount = 0, onUpgradePlan, onRenewSubscription, onSimulateExpiry, onSimulateQuota, onRefreshUserStatus
}: SubscriptionPageProps) {`;

content = content.replace(oldComp, newComp);

const oldSimulationBox = `            <p className="text-xs text-slate-300">
              Aktifkan opsi di bawah untuk mempercepat masa aktif lisensi ke masa lalu (Expired). Sistem akan **seketika mengunci akses** dan mengarahkan ke gerbang pembayaran perpanjangan!
            </p>
          </div>
          <button 
            onClick={toggleSimulateExpiry}
            className={\`px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer \${simulationStatus ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand-primary hover:bg-brand-primary-dark text-white'}\`}
          >
            {simulationStatus ? '🔴 Simulasikan Aktif Kembali' : '⚡ Simulasikan Lisensi Habis'}
          </button>
        </div>
      )}`;

const newSimulationBox = `            <p className="text-xs text-slate-300">
              Aktifkan opsi di bawah untuk menguji pembatasan fitur (Expiry / Kuota). Sistem akan merespon sesuai aturan paket yang sedang berjalan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={toggleSimulateExpiry}
              className={\`px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer \${simulationStatus ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand-primary hover:bg-brand-primary-dark text-white'}\`}
            >
              {simulationStatus ? '🔴 Simulasikan Aktif Kembali' : '⚡ Simulasikan Lisensi Habis'}
            </button>
            {onSimulateQuota && (
              <>
                <button 
                  onClick={() => onSimulateQuota('clients', user.subscription.plan === 'starter' ? 1 : user.subscription.plan === 'professional' ? 50 : 100)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer bg-slate-700 hover:bg-slate-600 text-white"
                >
                  👥 Penuhi Kuota Klien
                </button>
                <button 
                  onClick={() => onSimulateQuota('invoices', 5)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer bg-slate-700 hover:bg-slate-600 text-white"
                >
                  🧾 Penuhi Kuota Invoice (5)
                </button>
              </>
            )}
          </div>
        </div>
      )}`;

content = content.replace(oldSimulationBox, newSimulationBox);

fs.writeFileSync('src/components/SubscriptionPage.tsx', content);

console.log('Fixed SubscriptionPage simulation box');
