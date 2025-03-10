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
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeSectionIndex, setActiveSectionIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const activeItemRef = useRef(null);

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

  // Reset active indices when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
    setActiveSectionIndex(-1);
  }, [suggestions]);

  // Scroll active item into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex, activeSectionIndex]);

  const handleSelect = (item) => {
    setIsOpen(false);
    setActiveIndex(-1);
    setActiveSectionIndex(-1);
    router.push(`/details/${item.type}/${item.id}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // If we have an active item, select it
    if (activeSectionIndex !== -1 && activeIndex !== -1) {
      const currentSection = sections[activeSectionIndex];
      if (currentSection && currentSection.items[activeIndex]) {
        handleSelect(currentSection.items[activeIndex]);
        return;
      }
    }

    // If there are suggestions but no active selection, navigate to the first one
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

  // Create sections array for keyboard navigation
  const sections = [
    { title: "Pokémon", items: pokemonSuggestions },
    { title: "TMs", items: tmSuggestions },
    { title: "Abilities", items: abilitySuggestions },
    { title: "Natures", items: natureSuggestions },
    { title: "Routes", items: routeSuggestions },
    { title: "Items", items: itemSuggestions },
  ].filter((section) => section.items.length > 0);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (sections.length === 0) return;

        // If no section is active yet, start with the first section
        if (activeSectionIndex === -1) {
          setActiveSectionIndex(0);
          setActiveIndex(0);
          return;
        }

        // Move to the next item in the current section
        if (activeIndex < sections[activeSectionIndex].items.length - 1) {
          setActiveIndex(activeIndex + 1);
        }
        // Move to the next section if we're at the end of the current one
        else if (activeSectionIndex < sections.length - 1) {
          setActiveSectionIndex(activeSectionIndex + 1);
          setActiveIndex(0);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (sections.length === 0) return;

        // If no section is active yet, start with the last item of the last section
        if (activeSectionIndex === -1) {
          setActiveSectionIndex(sections.length - 1);
          setActiveIndex(sections[sections.length - 1].items.length - 1);
          return;
        }

        // Move to the previous item in the current section
        if (activeIndex > 0) {
          setActiveIndex(activeIndex - 1);
        }
        // Move to the last item of the previous section
        else if (activeSectionIndex > 0) {
          setActiveSectionIndex(activeSectionIndex - 1);
          setActiveIndex(sections[activeSectionIndex - 1].items.length - 1);
        }
        break;

      case "Enter":
        e.preventDefault();
        if (activeSectionIndex !== -1 && activeIndex !== -1) {
          const item = sections[activeSectionIndex].items[activeIndex];
          if (item) {
            handleSelect(item);
          }
        } else if (suggestions.length > 0) {
          handleSelect(suggestions[0]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Helper function to refocus input after interaction with suggestions
  const refocusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Helper function to determine if an item is the active one
  const isActive = (sectionIdx, itemIdx) => {
    return activeSectionIndex === sectionIdx && activeIndex === itemIdx;
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative flex w-full items-center">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search..."
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
          className="w-full pr-10 bg-slate-100"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
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
          id="search-suggestions"
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-md max-h-80 overflow-y-auto"
          role="listbox"
        >
          <div className="p-2">
            {sections.map((section, sectionIdx) => (
              <div key={section.title} className="mb-2">
                <h3 className="text-sm font-medium mb-1 text-muted-foreground">
                  {section.title}
                </h3>
                <ul role="group">
                  {section.items.map((item, itemIdx) => {
                    const isItemActive = isActive(sectionIdx, itemIdx);
                    return (
                      <li
                        key={`${item.type}-${item.id}`}
                        ref={isItemActive ? activeItemRef : null}
                        className={`px-2 py-1.5 text-sm rounded cursor-pointer ${
                          isItemActive ? "bg-accent" : "hover:bg-accent"
                        }`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => {
                          refocusInput();
                          setActiveSectionIndex(sectionIdx);
                          setActiveIndex(itemIdx);
                        }}
                        role="option"
                        aria-selected={isItemActive}
                      >
                        {item.name}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
