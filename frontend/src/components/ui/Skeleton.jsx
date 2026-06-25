import React from 'react';

export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden="true"
      style={{ borderRadius: 'var(--radius-sm)', ...style }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      className="overflow-hidden"
      aria-label="Loading product"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
    >
      <Skeleton className="w-full aspect-[4/5]" style={{ borderRadius: 0 }} />
      <div className="p-5 space-y-3">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-5 w-1/2 mt-1" />
        <Skeleton className="h-10 w-full mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-2 py-2">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div
      className="p-5 space-y-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
    >
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="w-16 h-16 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

export function OrderListCardSkeleton() {
  return (
    <div className="p-5 sm:p-6 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
      <div className="flex justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-20" />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex -space-x-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="w-14 h-14" />)}
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

export function WishlistSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
          aria-hidden="true"
        >
          <Skeleton className="w-full aspect-square" style={{ borderRadius: 0 }} />
          <div className="p-4 space-y-2.5">
            <Skeleton className="h-2.5 w-1/3" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="min-h-screen pt-32 pb-24" style={{ background: 'var(--bg)' }} aria-label="Loading order details">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        <Skeleton className="h-3 w-24 mb-4" />
        {/* Header card */}
        <div
          className="p-6 space-y-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-3.5 w-full" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-9" />)}
          </div>
        </div>
        {/* Tracking */}
        <Skeleton className="h-72 w-full" />
        {/* Items */}
        <Skeleton className="h-52 w-full" />
        {/* 2-col */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    </div>
  );
}

export function TrackOrderSkeleton() {
  return (
    <div className="min-h-screen pt-32 pb-24" style={{ background: 'var(--bg)' }} aria-label="Loading tracking information">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        <Skeleton className="h-3 w-24 mb-4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center space-y-4">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ borderColor: 'var(--border-strong)', borderTopColor: 'transparent' }}
        />
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--text-4)', fontFamily: 'var(--font-body)' }}
        >
          Loading Metro…
        </p>
      </div>
    </div>
  );
}

export default Skeleton;
