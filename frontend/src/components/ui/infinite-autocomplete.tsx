"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { X, Check, Loader2 } from "lucide-react"

interface InfiniteAutocompleteProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    emptyMessage?: string
    disabled?: boolean
    className?: string
    loading?: boolean
    // Infinite scroll props
    options: Array<string | { value: string; label: string }>
    onLoadMore?: () => void
    hasMore?: boolean
    loadingMore?: boolean
    // Optional "All" option
    showAllOption?: boolean
    allOptionLabel?: string
    allValue?: string
    // Search
    searchValue?: string
    onSearchChange?: (value: string) => void
}

export function InfiniteAutocomplete({
    value,
    onValueChange,
    placeholder = "Search...",
    emptyMessage = "No results found",
    disabled = false,
    className,
    loading = false,
    options,
    onLoadMore,
    hasMore = false,
    loadingMore = false,
    showAllOption = true,
    allOptionLabel = "All Categories",
    allValue = "all",
    searchValue = "",
    onSearchChange,
}: InfiniteAutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const [internalSearch, setInternalSearch] = React.useState(searchValue)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLUListElement>(null)
    const ignoreNextFocusRef = React.useRef(false)

    const selectedLabel = React.useMemo(() => {
        if (!value || (showAllOption && value === allValue)) return ''
        for (const opt of options) {
            if (typeof opt === 'string') {
                if (opt === value) return opt
            } else {
                if (opt.value === value) return opt.label
            }
        }
        return value
    }, [options, value])

    // Sync internal search with external
    React.useEffect(() => {
        setInternalSearch(searchValue)
    }, [searchValue])

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setInternalSearch(newValue)
        onSearchChange?.(newValue)
        if (newValue.trim().length > 0) {
            setOpen(true)
            setHighlightedIndex(0)
        } else {
            setOpen(false)
            setHighlightedIndex(-1)
        }
    }

    const handleSelect = (option: string) => {
        onValueChange(option)
        setOpen(false)
        ignoreNextFocusRef.current = true
        inputRef.current?.focus()
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onValueChange(showAllOption ? allValue : "")
        setInternalSearch("")
        onSearchChange?.("")
        ignoreNextFocusRef.current = true
        inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
                if (internalSearch.trim().length > 0) {
                    setOpen(true)
                }
            }
            return
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setHighlightedIndex(prev => 
                    prev < options.length - 1 ? prev + 1 : prev
                )
                break
            case "ArrowUp":
                e.preventDefault()
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
                break
            case "Enter":
                e.preventDefault()
                if (highlightedIndex >= 0 && options[highlightedIndex]) {
                    const option = options[highlightedIndex]
                    const optValue = typeof option === 'string' ? option : option.value
                    handleSelect(optValue)
                }
                break
            case "Escape":
                setOpen(false)
                break
        }
    }

    // Infinite scroll detection
    const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
        const el = e.currentTarget
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
        if (nearBottom && hasMore && !loadingMore && onLoadMore) {
            onLoadMore()
        }
    }

    // Scroll highlighted item into view
    React.useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightedIndex] as HTMLElement
            item?.scrollIntoView({ block: "nearest" })
        }
    }, [highlightedIndex])

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    value={open ? internalSearch : (selectedLabel || internalSearch)}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (ignoreNextFocusRef.current) {
                            ignoreNextFocusRef.current = false
                            return
                        }
                        // Don't open dropdown on focus - only open when user types
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pr-8"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {selectedLabel && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {open && internalSearch.trim().length > 0 && (
                <ul
                    ref={listRef}
                    onScroll={handleScroll}
                    className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95"
                    style={{ maxHeight: "280px", overflowY: "auto" }}
                >
                    {showAllOption && (
                        <li
                            onClick={() => handleSelect(allValue)}
                            onMouseEnter={() => setHighlightedIndex(-1)}
                            className={cn(
                                "px-3 py-2 cursor-pointer transition-colors hover:bg-accent",
                                (!value || value === allValue) && "bg-primary text-white"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{allOptionLabel}</span>
                                {(!value || value === allValue) && (
                                    <Check className="h-4 w-4 text-white shrink-0" />
                                )}
                            </div>
                        </li>
                    )}

                    {options.length === 0 && !loading ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">
                            {emptyMessage}
                        </li>
                    ) : (
                        options.map((option, index) => {
                            const optValue = typeof option === 'string' ? option : option.value
                            const optLabel = typeof option === 'string' ? option : option.label
                            return (
                            <li
                                key={optValue}
                                onClick={() => handleSelect(optValue)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={cn(
                                    "px-3 py-2 cursor-pointer transition-colors",
                                    "hover:bg-accent",
                                    highlightedIndex === index && "bg-accent",
                                    value === optValue && "bg-primary text-white"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">{optLabel}</span>
                                    {value === optValue && (
                                        <Check className="h-4 w-4 text-white shrink-0" />
                                    )}
                                </div>
                            </li>
                            )
                        })
                    )}

                    {/* Loading more indicator */}
                    {(hasMore || loadingMore) && (
                        <li className="px-3 py-2 text-sm text-muted-foreground flex items-center justify-center gap-2">
                            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loadingMore ? "Loading more..." : "Scroll for more"}
                        </li>
                    )}
                </ul>
            )}
        </div>
    )
}
