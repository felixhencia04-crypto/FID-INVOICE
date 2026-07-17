import re
with open('src/components/SubscriptionPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "{daysRemaining > 3650 ? 'Seumur Hidup (Lifetime)' : formatDateIndonesian(user.subscription.expiryDate)}",
    "{formatDateIndonesian(user.subscription.expiryDate)}"
)

content = content.replace(
    """              {daysRemaining > 3650 ? (
                <div className="flex flex-col items-end">
                  <p className="text-xl font-black font-display text-brand-primary">LIFETIME</p>
                  <p className="text-[10px] text-gray-400 font-medium tracking-wide">LISENSI AKTIF</p>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <p className="text-xl font-black font-display text-brand-primary">{daysRemaining}</p>
                  <p className="text-[10px] text-gray-400 font-medium tracking-wide">HARI TERSISA</p>
                </div>
              )}""",
    """                <div className="flex flex-col items-end">
                  <p className="text-xl font-black font-display text-brand-primary">{daysRemaining}</p>
                  <p className="text-[10px] text-gray-400 font-medium tracking-wide">HARI TERSISA</p>
                </div>"""
)

with open('src/components/SubscriptionPage.tsx', 'w') as f:
    f.write(content)
