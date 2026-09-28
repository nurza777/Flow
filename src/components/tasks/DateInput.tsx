"use client";

import { useEffect, useRef, useState } from "react";
import { toDateInputValue } from "@/lib/utils";

interface DateInputProps {
  value: string;
  // Called once per finished choice: blur, Enter, calendar pick or a preset — not on every keystroke
  onChange: (value: string) => void;
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

export default function DateInput({ value, onChange, inputClassName = "" }: DateInputProps) {
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

  const presets = [
    { label: "Сегодня", value: daysFromToday(0) },
    { label: "Завтра", value: daysFromToday(1) },
    { label: "Через неделю", value: daysFromToday(7) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
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
        onClick={(e) => {
          typing.current = false;
          try {
            e.currentTarget.showPicker?.();
          } catch {
            // Not allowed in this context (e.g. cross-origin iframe); the calendar icon still works
          }
        }}
        className={`px-2.5 py-1.5 border rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClassName}`}
        suppressHydrationWarning
      />
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
