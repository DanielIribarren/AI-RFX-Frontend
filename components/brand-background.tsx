"use client"

export function BrandBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base background */}
      <div className="absolute inset-0 bg-brand-bg" />
      
      {/* Indigo blobs - difuminados y sutiles */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-brand-indigo/[0.08] rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-brand-indigo/[0.06] rounded-full blur-[140px]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-brand-indigo/[0.05] rounded-full blur-[130px]" />
      
      {/* Grid tenue */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(2, 6, 23, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(2, 6, 23, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px'
        }}
      />
      
      {/* Noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px'
        }}
      />
    </div>
  )
}
