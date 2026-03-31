import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus } from 'lucide-react'

// ---------------------------------------------------------------------------
// Reusable search combobox with keyboard navigation + optional create
// ---------------------------------------------------------------------------

export interface ComboboxOption {
  id: string
  label: string
  subtitle?: string
  price?: number
}

interface SearchComboboxProps {
  value: string
  onChange: (value: string) => void
  onSelect: (option: ComboboxOption) => void
  options: ComboboxOption[]
  placeholder?: string
  autoFocus?: boolean
  onBlurEmpty?: () => void
  renderRight?: (option: ComboboxOption) => React.ReactNode
  /** Show a "+ Create ..." option when search has no exact match */
  allowCreate?: boolean
  /** Called when user clicks the create option. Receives the current search text. */
  onCreateNew?: (searchText: string) => void
  /** Label for the create option (default: 'Create') */
  createLabel?: string
  className?: string
}

export function SearchCombobox({
  value, onChange, onSelect, options, placeholder, autoFocus, onBlurEmpty,
  renderRight, allowCreate, onCreateNew, createLabel = 'Create', className,
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Show create option only when dropdown is open, has text, and no exact match
  const showCreate = open && allowCreate && onCreateNew && value.trim().length > 0 &&
    !options.some((o) => o.label.toLowerCase() === value.trim().toLowerCase())

  const totalItems = options.length + (showCreate ? 1 : 0)

  useEffect(() => { setActiveIndex(-1) }, [options])
  useEffect(() => { if ((options.length > 0 || showCreate) && value) setOpen(true) }, [options, value, showCreate])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open || totalItems === 0) {
      if (e.key === 'ArrowDown' && totalItems > 0) {
        e.preventDefault()
        setOpen(true)
        setActiveIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < options.length) {
          onSelect(options[activeIndex])
          setOpen(false)
          setActiveIndex(-1)
        } else if (showCreate && activeIndex === options.length) {
          onCreateNew?.(value.trim())
          setOpen(false)
          setActiveIndex(-1)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }, [open, options, totalItems, activeIndex, onSelect, showCreate, onCreateNew, value])

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const items = listRef.current.children
    if (items[activeIndex]) (items[activeIndex] as HTMLElement).scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function handleBlur() {
    setTimeout(() => {
      setOpen(false)
      setActiveIndex(-1)
      if (!value && onBlurEmpty) onBlurEmpty()
    }, 200)
  }

  const hasDropdown = open && (options.length > 0 || showCreate)

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => (options.length > 0 || showCreate) && setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        role="combobox"
        aria-expanded={hasDropdown}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `combobox-opt-${activeIndex}` : undefined}
      />
      {hasDropdown && (
        <div ref={listRef} role="listbox"
          className="absolute top-full left-0 z-50 mt-1 min-w-full w-max max-w-[340px] max-h-40 overflow-y-auto rounded-lg border bg-popover shadow-lg py-0.5">
          {options.map((opt, i) => (
            <div key={opt.id} id={`combobox-opt-${i}`} role="option" aria-selected={i === activeIndex}
              onMouseDown={(e) => { e.preventDefault(); onSelect(opt); setOpen(false) }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                i === activeIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              }`}>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{opt.label}</p>
                {opt.subtitle && <p className="truncate text-[11px] text-muted-foreground">{opt.subtitle}</p>}
              </div>
              {renderRight && <div className="shrink-0">{renderRight(opt)}</div>}
            </div>
          ))}
          {showCreate && (
            <div id={`combobox-opt-${options.length}`} role="option" aria-selected={activeIndex === options.length}
              onMouseDown={(e) => { e.preventDefault(); onCreateNew?.(value.trim()); setOpen(false) }}
              onMouseEnter={() => setActiveIndex(options.length)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors border-t ${
                activeIndex === options.length ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              }`}>
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>{createLabel} &ldquo;<span className="font-medium">{value.trim()}</span>&rdquo;</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
