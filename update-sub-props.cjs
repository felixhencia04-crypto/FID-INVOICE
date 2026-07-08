const fs = require('fs');
let content = fs.readFileSync('src/components/SubscriptionPage.tsx', 'utf8');

const oldProps = `interface SubscriptionPageProps {
  user: UserProfile;
  onUpgradePlan: (plan: 'starter' | 'professional' | 'enterprise', isYearly?: boolean) => void;
  onRenewSubscription: () => void;
  onSimulateExpiry: (expire: boolean) => void;
  onRefreshUserStatus?: () => void;
}

export default function SubscriptionPage({
  user, onUpgradePlan, onRenewSubscription, onSimulateExpiry, onRefreshUserStatus
}: SubscriptionPageProps) {`;

const newProps = `interface SubscriptionPageProps {
  user: UserProfile;
  currentClientCount?: number;
  currentInvoiceCount?: number;
  onUpgradePlan: (plan: 'starter' | 'professional' | 'enterprise', isYearly?: boolean) => void;
  onRenewSubscription: () => void;
  onSimulateExpiry: (expire: boolean) => void;
  onRefreshUserStatus?: () => void;
}

export default function SubscriptionPage({
  user, currentClientCount = 0, currentInvoiceCount = 0, onUpgradePlan, onRenewSubscription, onSimulateExpiry, onRefreshUserStatus
}: SubscriptionPageProps) {`;

content = content.replace(oldProps, newProps);

const oldQuotaUi = `            {/* Quota bar 1: Clients */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Kontak Klien Aktif</span>
                <span className="font-bold text-brand-dark">12 / {user.subscription.plan === 'starter' ? '1' : user.subscription.plan === 'professional' ? '50' : 'Unlimited'} Klien</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: \`\${user.subscription.plan === 'starter' ? 100 : user.subscription.plan === 'professional' ? 24 : 10}%\` }}
                  className="h-full bg-brand-primary"
                ></div>
              </div>
            </div>

            {/* Quota bar 2: Invoices */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Penerbitan Invoice Bulanan</span>
                <span className="font-bold text-brand-dark">{user.subscription.plan === 'starter' ? '3 / 5' : 'Tak Terbatas (Unlimited)'}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: \`\${user.subscription.plan === 'starter' ? 60 : 10}%\` }}
                  className="h-full bg-brand-primary"
                ></div>
              </div>
            </div>`;

const newQuotaUi = `            {/* Quota bar 1: Clients */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Kontak Klien Aktif</span>
                <span className="font-bold text-brand-dark">{currentClientCount} / {user.subscription.plan === 'starter' ? '1' : user.subscription.plan === 'professional' ? '50' : 'Unlimited'} Klien</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: \`\${user.subscription.plan === 'starter' ? Math.min((currentClientCount/1)*100, 100) : user.subscription.plan === 'professional' ? Math.min((currentClientCount/50)*100, 100) : 10}%\` }}
                  className="h-full bg-brand-primary transition-all duration-500"
                ></div>
              </div>
            </div>

            {/* Quota bar 2: Invoices */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Penerbitan Invoice Keseluruhan</span>
                <span className="font-bold text-brand-dark">{user.subscription.plan === 'starter' ? \`\${currentInvoiceCount} / 5\` : 'Tak Terbatas (Unlimited)'}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: \`\${user.subscription.plan === 'starter' ? Math.min((currentInvoiceCount/5)*100, 100) : 10}%\` }}
                  className="h-full bg-brand-primary transition-all duration-500"
                ></div>
              </div>
            </div>`;

content = content.replace(oldQuotaUi, newQuotaUi);

fs.writeFileSync('src/components/SubscriptionPage.tsx', content);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
const oldAppSub = `<SubscriptionPage 
            user={currentUser!}
            onUpgradePlan={(plan, isYearly) => {`;

const newAppSub = `<SubscriptionPage 
            user={currentUser!}
            currentClientCount={clients.length}
            currentInvoiceCount={invoices.length}
            onUpgradePlan={(plan, isYearly) => {`;

appContent = appContent.replace(oldAppSub, newAppSub);
fs.writeFileSync('src/App.tsx', appContent);

console.log('Fixed Subscription quotas');
