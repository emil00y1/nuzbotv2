// app/details/[type]/[id]/page.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Cache for details to avoid redundant API calls
const detailsCache = {
  pokemon: {},
  route: {},
  item: {},
};

const fetchItemDetails = async (type, id) => {
  // Check if data is already in cache
  if (detailsCache[type]?.[id]) {
    return detailsCache[type][id];
  }

  let endpoint;

  switch (type) {
    case "pokemon":
      endpoint = `https://pokeapi.co/api/v2/pokemon/${id}`;
      break;
    case "route":
      endpoint = `https://pokeapi.co/api/v2/location/${id}`;
      break;
    case "item":
      endpoint = `https://pokeapi.co/api/v2/item/${id}`;
      break;
    default:
      return null;
  }

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} with ID ${id}`);
    }

    const data = await response.json();
    let formattedData;

    // Format data based on type
    switch (type) {
      case "pokemon":
        // Get species data for description
        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();

        // Find English flavor text
        const englishEntry = speciesData.flavor_text_entries.find(
          (entry) => entry.language.name === "en"
        );

        formattedData = {
          name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
          description: englishEntry
            ? englishEntry.flavor_text.replace(/[\f\n\r]/g, " ")
            : "No description available.",
          stats: {
            hp:
              data.stats.find((stat) => stat.stat.name === "hp")?.base_stat ||
              0,
            attack:
              data.stats.find((stat) => stat.stat.name === "attack")
                ?.base_stat || 0,
            defense:
              data.stats.find((stat) => stat.stat.name === "defense")
                ?.base_stat || 0,
            speed:
              data.stats.find((stat) => stat.stat.name === "speed")
                ?.base_stat || 0,
          },
          types: data.types.map(
            (typeInfo) =>
              typeInfo.type.name.charAt(0).toUpperCase() +
              typeInfo.type.name.slice(1)
          ),
          // Use official artwork if available
          image:
            data.sprites.other["official-artwork"]?.front_default ||
            data.sprites.front_default ||
            "/api/placeholder/200/200",
        };
        break;

      case "route":
        // For locations, we need to get the area to find Pokemon
        let pokemonList = [];

        try {
          // Get the first area for this location
          const areasResponse = await fetch(
            `https://pokeapi.co/api/v2/location-area?location=${id}`
          );
          const areasData = await areasResponse.json();

          if (areasData.results.length > 0) {
            const areaResponse = await fetch(areasData.results[0].url);
            const areaData = await areaResponse.json();

            // Extract unique Pokemon from the area
            pokemonList = [
              ...new Set(
                areaData.pokemon_encounters.map(
                  (encounter) =>
                    encounter.pokemon.name.charAt(0).toUpperCase() +
                    encounter.pokemon.name.slice(1)
                )
              ),
            ].slice(0, 10); // Limit to 10 Pokemon
          }
        } catch (err) {
          console.error("Error fetching location areas:", err);
        }

        formattedData = {
          name: data.name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          description: `${data.name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")} is located in the ${
            data.region?.name || "unknown"
          } region.`,
          pokemon:
            pokemonList.length > 0
              ? pokemonList
              : ["No Pokémon data available"],
          image: "/api/placeholder/400/200", // PokeAPI doesn't have location images
        };
        break;

      case "item":
        // Find English flavor text
        const englishFlavorText = data.flavor_text_entries.find(
          (entry) => entry.language.name === "en"
        );

        formattedData = {
          name: data.name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          description: englishFlavorText
            ? englishFlavorText.text.replace(/[\f\n\r]/g, " ")
            : "No description available.",
          price: data.cost,
          category: data.category.name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          image: data.sprites.default || "/api/placeholder/150/150",
        };
        break;

      default:
        return null;
    }

    // Cache the formatted data
    if (!detailsCache[type]) {
      detailsCache[type] = {};
    }
    detailsCache[type][id] = formattedData;

    return formattedData;
  } catch (error) {
    console.error(`Error fetching ${type} details:`, error);
    return null;
  }
};

export default function DetailsPage({ params }) {
  const { type, id } = params;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getDetails = async () => {
      try {
        setLoading(true);
        // Import the API service
        const apiService = (await import("@/services/api")).default;
        const data = await apiService.getDetails(type, parseInt(id));

        if (!data) {
          setError(`No ${type} found with ID ${id}`);
        } else {
          setDetails(data);
        }
      } catch (err) {
        // Fall back to local fetching if API service fails
        try {
          console.log("API service failed, falling back to local fetch");
          const data = await fetchItemDetails(type, parseInt(id));
          if (!data) {
            setError(`No ${type} found with ID ${id}`);
          } else {
            setDetails(data);
          }
        } catch (fallbackErr) {
          setError("Failed to fetch details");
          console.error(fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    getDetails();
  }, [type, id]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-8">
            <Skeleton className="h-48 w-48" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{details.name}</CardTitle>
              <CardDescription>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </CardDescription>
            </div>
            {type === "pokemon" && (
              <div className="flex gap-2">
                {details.types.map((pokeType) => (
                  <Badge key={pokeType} variant="outline">
                    {pokeType}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <img
                src={details.image}
                alt={details.name}
                className="rounded-md object-cover"
              />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-medium mb-3">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {details.description}
              </p>

              {/* Render different details based on type */}
              {type === "pokemon" && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">HP</p>
                      <p className="font-medium">{details.stats.hp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Attack</p>
                      <p className="font-medium">{details.stats.attack}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Defense</p>
                      <p className="font-medium">{details.stats.defense}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Speed</p>
                      <p className="font-medium">{details.stats.speed}</p>
                    </div>
                  </div>
                </div>
              )}

              {type === "route" && (
                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Pokémon Found Here
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {details.pokemon.map((poke) => (
                      <Badge key={poke} variant="secondary">
                        {poke}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {type === "item" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{details.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">₽{details.price}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
