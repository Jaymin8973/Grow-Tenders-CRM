"use client"

import * as React from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchableSelectOption {
    value: string
    label: string
    searchTerms?: string // Additional search terms like company name
}

interface SearchableSelectProps {
    options: SearchableSelectOption[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    emptyMessage?: string
    disabled?: boolean
    className?: string
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Select an option",
    emptyMessage = "No results found.",
    disabled = false,
    className,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const selectedOption = options.find((option) => option.value === value)

    const filteredOptions = React.useMemo(() => {
        if (!search) return options
        const searchLower = search.toLowerCase()
        return options.filter((option) => {
            const labelMatch = option.label.toLowerCase().includes(searchLower)
            const searchTermsMatch = option.searchTerms?.toLowerCase().includes(searchLower)
            return labelMatch || searchTermsMatch
        })
    }, [options, search])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !selectedOption && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput
                            placeholder="Search..."
                            value={search}
                            onValueChange={setSearch}
                            className="flex-1 border-0 outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                        onValueChange(option.value)
                                        setOpen(false)
                                        setSearch("")
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="truncate">{option.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
