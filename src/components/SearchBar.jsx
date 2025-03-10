// components/SearchBar.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import apiService from "@/services/api";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get suggestions using the API service
  useEffect(() => {
    const getSuggestions = async () => {
      if (query.trim() === "") {
        setSuggestions([]);
        return;
      }
      try {
        const results = await apiService.searchAll(query);
        setSuggestions(results);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    };

    // Use debounce to avoid excessive API calls
    const timeout = setTimeout(getSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (item) => {
    setIsOpen(false);
    router.push(`/details/${item.type}/${item.id}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // If there are suggestions, navigate to the first one
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    }
  };

  // Group suggestions by type
  const pokemonSuggestions = suggestions.filter(
    (item) => item.type === "pokemon"
  );
  const routeSuggestions = suggestions.filter((item) => item.type === "route");
  const itemSuggestions = suggestions.filter((item) => item.type === "item");
  const abilitySuggestions = suggestions.filter(
    (item) => item.type === "ability"
  );
  const natureSuggestions = suggestions.filter(
    (item) => item.type === "nature"
  );
  const tmSuggestions = suggestions.filter((item) => item.type === "tm");

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    // Keep focus on input when arrow keys are pressed
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
    }
  };

  // Helper function to refocus input after interaction with suggestions
  const refocusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative flex w-full items-center">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search Pokémon, routes, items, TMs, abilities, natures..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim() !== "" && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full pr-10"
          autoComplete="off"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-0"
          onClick={handleSubmit}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Show suggestions as a non-modal dropdown that doesn't steal focus */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-md max-h-80 overflow-y-auto"
        >
          <div className="p-2">
            {pokemonSuggestions.length > 0 && (
              <div className="mb-2">
                <h3 className="text-sm font-medium mb-1 text-muted-foreground">
                  Pokémon
                </h3>
                <ul>
                  {pokemonSuggestions.map((item) => (
                    <li
                      key={`pokemon-${item.id}`}
                      className="px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={refocusInput}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tmSuggestions.length > 0 && (
              <div className="mb-2">
                <h3 className="text-sm font-medium mb-1 text-muted-foreground">
                  TMs
                </h3>
                <ul>
                  {tmSuggestions.map((item) => (
                    <li
                      key={`tm-${item.id}`}
                      className="px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={refocusInput}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {abilitySuggestions.length > 0 && (
              <div className="mb-2">
                <h3 className="text-sm font-medium mb-1 text-muted-foreground">
                  Abilities
                </h3>
                <ul>
                  {abilitySuggestions.map((item) => (
                    <li
                      key={`ability-${item.id}`}
                      className="px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={refocusInput}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {natureSuggestions.length > 0 && (
              <div className="mb-2">
                <h3 className="text-sm font-medium mb-1 text-muted-foreground">
                  Natures
                </h3>
                <ul>
                  {natureSuggestions.map((item) => (
                    <li
                      key={`nature-${item.id}`}
                      className="px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={refocusInput}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {routeSuggestions.length > 0 && (
              <div className="mb-2">
                <h3 className="text-sm font-medium mb-1 text-muted-foreground">
                  Routes
                </h3>
                <ul>
                  {routeSuggestions.map((item) => (
                    <li
                      key={`route-${item.id}`}
                      className="px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={refocusInput}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {itemSuggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1 text-muted-foreground">
                  Items
                </h3>
                <ul>
                  {itemSuggestions.map((item) => (
                    <li
                      key={`item-${item.id}`}
                      className="px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={refocusInput}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
