import { createContext, useContext, useCallback, useId, useRef, type ReactNode, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>')
  return ctx
}

// ---------------------------------------------------------------------------
// Tabs Root
// ---------------------------------------------------------------------------

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  const baseId = useId()
  return (
    <TabsContext.Provider value={{ value, onValueChange, baseId }}>
      <div className={cn('flex flex-col h-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// TabsList — horizontal glass bar with tab triggers
// ---------------------------------------------------------------------------

interface TabsListProps {
  children: ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const { onValueChange } = useTabsContext()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const tabs = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      if (!tabs || tabs.length === 0) return

      const currentIndex = Array.from(tabs).findIndex((t) => t === document.activeElement)
      if (currentIndex === -1) return

      let nextIndex: number | null = null

      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
      } else if (e.key === 'Home') {
        nextIndex = 0
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1
      }

      if (nextIndex !== null) {
        e.preventDefault()
        const nextTab = tabs[nextIndex]
        nextTab.focus()
        const tabValue = nextTab.getAttribute('data-value')
        if (tabValue) onValueChange(tabValue)
      }
    },
    [onValueChange]
  )

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center gap-0.5 p-1 rounded-xl glass-card mb-3 overflow-x-auto flex-shrink-0',
        className
      )}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TabsTrigger — individual tab button
// ---------------------------------------------------------------------------

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: activeValue, onValueChange, baseId } = useTabsContext()
  const isActive = activeValue === value

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      data-value={value}
      onClick={() => onValueChange(value)}
      className={cn(
        'flex-1 min-w-0 px-3 py-1.5 text-[13px] font-serif-display font-medium rounded-lg transition-all duration-200',
        isActive
          ? 'bg-primary/15 text-primary shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/30',
        className
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// TabsContent — panel shown when tab is active
// ---------------------------------------------------------------------------

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: activeValue, baseId } = useTabsContext()
  if (activeValue !== value) return null

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn('flex-1 min-h-0 overflow-y-auto space-y-3', className)}
    >
      {children}
    </div>
  )
}
