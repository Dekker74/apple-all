"use client";

import { emiliaRomagnaCities } from "@/lib/emilia-romagna-cities";
import { useState } from "react";

interface CitySelectorProps {
  value?: string;
  onChange: (city: string) => void;
  label?: string;
  required?: boolean;
}

export function CitySelector({ value, onChange, label = "Città", required = false }: CitySelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? emiliaRomagnaCities.filter((city) => city.toLowerCase().includes(search.toLowerCase()))
    : emiliaRomagnaCities;

  return (
    <div>
      {label && (
        <label className="field-label mb-2 block">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      
      <input
        type="text"
        placeholder="Cerca città..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-offcut mb-3"
      />

      <div className="city-pills">
        {filtered.length > 0 ? (
          filtered.map((city) => (
            <button
              key={city}
              type="button"
              className={value === city ? "on" : ""}
              onClick={() => {
                onChange(city);
                setSearch("");
              }}
            >
              {city}
            </button>
          ))
        ) : (
          <p className="text-muted text-sm px-2">Nessuna città trovata</p>
        )}
      </div>
    </div>
  );
}
