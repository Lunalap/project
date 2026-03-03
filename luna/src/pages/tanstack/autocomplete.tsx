import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const purposes = [
  { value: "운영비", label: "운영비" },
  { value: "소모품비", label: "소모품비" },
  { value: "교육훈련비", label: "교육훈련비" },
  { value: "사무용품비", label: "사무용품비" },
  { value: "기타", label: "기타" },
];

interface AutocompleteCellProps {
  initialValue: string;
  onUpdate: (value: string) => void;
}

export function AutocompleteCell({ initialValue, onUpdate }: AutocompleteCellProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-xs h-8"
        >
          {value ? value : "용도 선택..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="용도 검색..." className="h-8" />
          <CommandList>
            <CommandEmpty>결과 없음.</CommandEmpty>
            <CommandGroup>
              {purposes.map((purpose) => (
                <CommandItem
                  key={purpose.value}
                  value={purpose.value}
                  onSelect={(currentValue) => {
                    const newValue = currentValue === value ? "" : currentValue;
                    setValue(newValue);
                    onUpdate(newValue); // 즉각 반영 및 업로드
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === purpose.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {purpose.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}