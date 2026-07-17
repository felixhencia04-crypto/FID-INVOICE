import re
with open('src/components/SubscriptionPage.tsx', 'r') as f:
    content = f.read()

# Replace date display
content = re.sub(
    r'Lisensi berlaku sampai dengan: <strong className="text-brand-dark">\{formatDateIndonesian\(user\.subscription\.expiryDate\)\}</strong>',
    r'Lisensi berlaku sampai dengan: <strong className="text-brand-dark">\n                  {daysRemaining > 3650 ? \'Seumur Hidup (Lifetime)\' : formatDateIndonesian(user.subscription.expiryDate)}\n                </strong>',
    content
)

# Replace Countdown Badge
badge_logic = """            <div className="p-4 rounded-xl bg-brand-primary-light/40 border border-brand-primary/5 text-center shrink-0 min-w-[100px] flex flex-col justify-center items-center">
              {daysRemaining > 3650 ? (
                <>
                  <p className="text-xl font-black font-display text-brand-primary">LIFETIME</p>
                  <p className="text-[9px] text-brand-primary font-bold uppercase tracking-wider mt-0.5">Lisensi Aktif</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black font-display text-brand-primary">{daysRemaining}</p>
                  <p className="text-[9px] text-brand-primary font-bold uppercase tracking-wider mt-0.5">Hari Tersisa</p>
                </>
              )}
            </div>"""

content = re.sub(
    r'<div className="p-4 rounded-xl bg-brand-primary-light/40 border border-brand-primary/5 text-center shrink-0 min-w-\[100px\]">\s*<p className="text-2xl font-black font-display text-brand-primary">\{daysRemaining\}</p>\s*<p className="text-\[9px\] text-brand-primary font-bold uppercase tracking-wider mt-0\.5">Hari Tersisa</p>\s*</div>',
    badge_logic,
    content,
    flags=re.DOTALL
)

with open('src/components/SubscriptionPage.tsx', 'w') as f:
    f.write(content)
