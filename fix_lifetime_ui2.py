import re
with open('src/components/SubscriptionPage.tsx', 'r') as f:
    content = f.read()

old_block = """              {daysRemaining > 3650 ? (
                <>
                  <p className="text-xl font-black font-display text-brand-primary">LIFETIME</p>
                  <p className="text-[9px] text-brand-primary font-bold uppercase tracking-wider mt-0.5">Lisensi Aktif</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black font-display text-brand-primary">{daysRemaining}</p>
                  <p className="text-[9px] text-brand-primary font-bold uppercase tracking-wider mt-0.5">Hari Tersisa</p>
                </>
              )}"""

new_block = """                <>
                  <p className="text-2xl font-black font-display text-brand-primary">{daysRemaining}</p>
                  <p className="text-[9px] text-brand-primary font-bold uppercase tracking-wider mt-0.5">Hari Tersisa</p>
                </>"""

content = content.replace(old_block, new_block)

with open('src/components/SubscriptionPage.tsx', 'w') as f:
    f.write(content)
