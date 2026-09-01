'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function extractDomain(input: string): string | null {
  if (!input || !input.trim()) return null;
  try {
    const raw = input.includes('://') ? input : `https://${input}`;
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');
    if (host.includes('.') && host.split('.').every(Boolean)) return host;
    return null;
  } catch {
    const cleaned = input.trim().replace(/^www\./, '');
    if (cleaned.includes('.') && cleaned.split('.').every(Boolean)) {
      return cleaned;
    }
    return null;
  }
}

function getFaviconUrl(domain: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

export interface FaviconSearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> {
  /** Controlled value */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string, domain: string | null) => void;
  placeholder?: string;
  clearable?: boolean;
  /** Show loading spinner indicator */
  loading?: boolean;
  /** Custom fallback icon when no domain favicon is available */
  icon?: React.ReactNode;
  /** @default 64 */
  faviconSize?: 16 | 32 | 64 | 128;
  /** @default 350 */
  debounce?: number;
  className?: string;
  inputClassName?: string;
}

const FaviconSearch = React.forwardRef<HTMLInputElement, FaviconSearchProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      onSearch,
      placeholder = 'Enter a website URL or search term…',
      clearable = true,
      loading = false,
      icon,
      faviconSize = 64,
      debounce = 350,
      className,
      inputClassName,
      onFocus,
      onBlur,
      onKeyDown,
      autoFocus,
      disabled,
      ...rest
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const value = isControlled ? controlledValue : internalValue;

    const [domain, setDomain] = React.useState<string | null>(null);
    const [faviconReady, setFaviconReady] = React.useState(false);
    const [faviconError, setFaviconError] = React.useState(false);
    const prevDomainRef = React.useRef<string | null>(null);

    React.useEffect(() => {
      const id = setTimeout(() => {
        const d = extractDomain(value);
        if (d !== prevDomainRef.current) {
          prevDomainRef.current = d;
          setFaviconReady(false);
          setFaviconError(false);
          setDomain(d);
        }
      }, debounce);
      return () => clearTimeout(id);
    }, [value, debounce]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (!isControlled) setInternalValue(v);
      onChange?.(v);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch?.(value, domain);
      }
      onKeyDown?.(e);
    };

    const handleClear = () => {
      if (!isControlled) setInternalValue('');
      onChange?.('');
      setDomain(null);
      setFaviconReady(false);
      setFaviconError(false);
      prevDomainRef.current = null;
    };

    const showFavicon = Boolean(domain && faviconReady && !faviconError);

    return (
      <div
        className={cn(
          'relative flex items-center w-full group transition-all duration-200',
          className
        )}
      >
        {/* Left Icon / Favicon Container */}
        <div className="pointer-events-none absolute left-3.5 flex items-center justify-center size-5 z-10">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.span
                key="loading-spinner"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="flex items-center justify-center text-cyan-400"
              >
                <Loader2 className="size-[18px] animate-spin" />
              </motion.span>
            ) : showFavicon ? (
              <motion.img
                key={`favicon-${domain}`}
                src={getFaviconUrl(domain!, faviconSize)}
                alt={domain!}
                width={20}
                height={20}
                className="size-5 rounded-sm object-contain shadow-sm"
                initial={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                onLoad={() => setFaviconReady(true)}
                onError={() => setFaviconError(true)}
              />
            ) : (
              <motion.span
                key="search-icon"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors"
              >
                {icon ? (
                  icon
                ) : domain && !faviconError ? (
                  <Globe className="size-[18px] text-cyan-400" />
                ) : (
                  <Search className="size-[18px]" />
                )}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Preload img to detect load/error before showing the animated favicon */}
          {domain && !faviconReady && !faviconError && (
            <img
              src={getFaviconUrl(domain, faviconSize)}
              alt=""
              className="sr-only absolute"
              onLoad={() => setFaviconReady(true)}
              onError={() => setFaviconError(true)}
              aria-hidden
            />
          )}
        </div>

        {/* Text Input */}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'flex w-full rounded-xl border border-white/[0.1] bg-[#0c1018]/90 backdrop-blur-md',
            'pl-[48px] pr-10 py-2.5 text-sm text-white',
            'placeholder:text-slate-500',
            'outline-none transition-all duration-200',
            'focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-500/20 focus:bg-[#0e1320]',
            'hover:border-white/[0.2] shadow-inner',
            inputClassName
          )}
          {...rest}
        />

        {/* Clear Button */}
        <AnimatePresence>
          {clearable && value.length > 0 && !disabled && (
            <motion.button
              type="button"
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={cn(
                'absolute right-3 z-10 flex items-center justify-center',
                'size-6 rounded-lg text-slate-400 bg-white/[0.04] border border-white/[0.08]',
                'hover:text-white hover:bg-white/[0.12] hover:border-white/[0.2] transition-colors',
                'focus:outline-none focus:ring-1 focus:ring-cyan-400'
              )}
              aria-label="Clear input"
            >
              <X className="size-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
FaviconSearch.displayName = 'FaviconSearch';

export { FaviconSearch, extractDomain, getFaviconUrl };
