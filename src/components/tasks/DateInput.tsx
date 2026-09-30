"use client";

import { useEffect, useRef, useState } from "react";
import { toDateInputValue } from "@/lib/utils";

interface DateInputProps {
  value: string;
  // Called once per finished choice: blur, Enter, calendar pick or a preset — not on every keystroke
  onChange: (value: string) => void;
  // Width of the field, e.g. "w-44" or "w-full"
  className?: string;
  inputClassName?: string;
}

function daysFromToday(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

// While typing the year the browser reports 0002, 0020, 0202 as valid dates
function isPlausible(value: string) {
  const year = Number(value.slice(0, 4));
  return year >= 2000 && year <= 2100;
}

export default function DateInput({ value, onChange, className = "", inputClassName = "" }: DateInputProps) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const inputRef = useRef<HTMLInputElement>(null);
  // Last value handed to onChange, so blur + unmount or Enter + blur don't save twice
  const committed = useRef(value);
  const typing = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    committed.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  function commit(next: string) {
    typing.current = false;
    setDraft(next);
    if (next === committed.current) return;
    committed.current = next;
    onChangeRef.current(next);
  }

  // Keyboard edits are held until the user is done; half-typed or implausible dates are dropped
  function finish(input: HTMLInputElement) {
    if (!typing.current) return;
    if (!input.validity.badInput && (input.value === "" || isPlausible(input.value))) {
      commit(input.value);
    } else {
      typing.current = false;
      input.value = committed.current;
      setDraft(committed.current);
    }
  }

  // Closing the card while the field still has focus doesn't fire blur, so save on unmount
  useEffect(() => {
    const input = inputRef.current;
    return () => {
      if (input) finish(input);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A click on the field itself stays native so the date can be typed; the picker has its own button
  function openCalendar() {
    const input = inputRef.current;
    if (!input) return;
    typing.current = false;
    try {
      input.showPicker();
    } catch {
      // No showPicker here (older Safari, cross-origin iframe): fall back to typing
      input.focus();
    }
  }

  const presets = [
    { label: "Сегодня", value: daysFromToday(0) },
    { label: "Завтра", value: daysFromToday(1) },
    { label: "Через неделю", value: daysFromToday(7) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className={`relative ${className}`}>
        <input
          ref={inputRef}
          type="date"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            // No keystrokes before the change means it came from the calendar
            if (!typing.current && isPlausible(e.target.value)) commit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") finish(e.currentTarget);
            else if (e.key !== "Tab" && e.key !== "Escape") typing.current = true;
          }}
          onBlur={(e) => finish(e.currentTarget)}
          className={`w-full pl-2.5 pr-9 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [&::-webkit-calendar-picker-indicator]:hidden ${inputClassName}`}
          suppressHydrationWarning
        />
        <button
          type="button"
          onClick={openCalendar}
          title="Открыть календарь"
          aria-label="Открыть календарь"
          className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => commit(p.value)}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors ${
              draft === p.value
                ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                : "border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => commit("")}
          disabled={!draft}
          className="px-2 py-0.5 text-[11px] font-medium rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Сбросить
        </button>
      </div>
    </div>
  );
}
