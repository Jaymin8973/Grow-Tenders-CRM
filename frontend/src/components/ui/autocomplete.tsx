"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { X, Check, Loader2 } from "lucide-react"

interface AutocompleteOption {
    value: string
    label: string
    subtitle?: string // e.g., company name
    searchTerms?: string
}

interface AutocompleteProps {
    options: AutocompleteOption[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    emptyMessage?: string
    disabled?: boolean
    className?: string
    loading?: boolean
}

export function Autocomplete({
    options,
    value,
    onValueChange,
    placeholder = "Search...",
    emptyMessage = "No results found",
    disabled = false,
    className,
    loading = false,
}: AutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLUListElement>(null)
    const ignoreNextFocusRef = React.useRef(false)

    const selectedOption = React.useMemo(() => {
        return options.find(opt => opt.value === value)
    }, [options, value])

    // Sync input with selected value
    React.useEffect(() => {
        if (selectedOption) {
            setInputValue(selectedOption.label)
        }
    }, [selectedOption])

    // Filter options based on input
    const filteredOptions = React.useMemo(() => {
        if (!inputValue || selectedOption?.label === inputValue) return options
        const searchLower = inputValue.toLowerCase()
        return options.filter(option => {
            const labelMatch = option.label.toLowerCase().includes(searchLower)
            const subtitleMatch = option.subtitle?.toLowerCase().includes(searchLower)
            const searchTermsMatch = option.searchTerms?.toLowerCase().includes(searchLower)
            return labelMatch || subtitleMatch || searchTermsMatch
        })
    }, [options, inputValue, selectedOption])

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
                if (selectedOption) {
                    setInputValue(selectedOption.label)
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [selectedOption])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
        setOpen(true)
        setHighlightedIndex(0)
    }

    const handleSelect = (option: AutocompleteOption) => {
        onValueChange(option.value)
        setInputValue(option.label)
        setOpen(false)
        ignoreNextFocusRef.current = true
        inputRef.current?.focus()
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onValueChange("")
        setInputValue("")
        inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                setOpen(true)
            }
            return
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setHighlightedIndex(prev => 
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                )
                break
            case "ArrowUp":
                e.preventDefault()
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
                break
            case "Enter":
                e.preventDefault()
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex])
                }
                break
            case "Escape":
                setOpen(false)
                if (selectedOption) {
                    setInputValue(selectedOption.label)
                }
                break
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
                    value={inputValue}
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
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {selectedOption && !loading && (
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

            {open && filteredOptions.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95"
                    style={{ maxHeight: "280px", overflowY: "auto" }}
                >
                    {filteredOptions.map((option, index) => (
                        <li
                            key={option.value}
                            onClick={() => handleSelect(option)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={cn(
                                "px-3 py-2 cursor-pointer transition-colors",
                                "hover:bg-accent",
                                highlightedIndex === index && "bg-accent",
                                selectedOption?.value === option.value && "bg-primary text-white"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                        {option.label}
                                    </span>
                                    {option.subtitle && (
                                        <span className="text-xs text-muted-foreground">
                                            {option.subtitle}
                                        </span>
                                    )}
                                </div>
                                {selectedOption?.value === option.value && (
                                    <Check className="h-4 w-4 text-white shrink-0" />
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {open && inputValue && filteredOptions.length === 0 && !loading && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg p-3 text-sm text-muted-foreground animate-in fade-in-0 zoom-in-95">
                    {emptyMessage}
                </div>
            )}
        </div>
    )
}
