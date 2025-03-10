// services/api.js

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

class ApiService {
  constructor() {
    this.cache = {
      pokemon: {
        list: null,
        details: {},
        listTimestamp: 0,
      },
      locations: {
        list: null,
        details: {},
        listTimestamp: 0,
      },
      items: {
        list: null,
        details: {},
        listTimestamp: 0,
      },
      // Add new categories
      abilities: {
        list: null,
        details: {},
        listTimestamp: 0,
      },
      natures: {
        list: null,
        details: {},
        listTimestamp: 0,
      },
      machines: {
        // For TMs
        list: null,
        details: {},
        listTimestamp: 0,
      },
    };
  }

  // Generic fetch with error handling
  async fetchFromApi(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      throw error;
    }
  }

  // Format the name with proper capitalization
  formatName(name) {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Extract ID from PokeAPI URL
  getIdFromUrl(url) {
    const urlParts = url.split("/");
    return parseInt(urlParts[urlParts.length - 2]);
  }

  // Get all Pokémon (limited to first 151 for performance)
  async getPokemonList() {
    // Check if cache is valid
    const now = Date.now();
    if (
      this.cache.pokemon.list &&
      now - this.cache.pokemon.listTimestamp < CACHE_DURATION
    ) {
      return this.cache.pokemon.list;
    }

    const data = await this.fetchFromApi(
      "https://pokeapi.co/api/v2/pokemon?limit=151"
    );

    const formattedData = data.results.map((pokemon) => ({
      id: this.getIdFromUrl(pokemon.url),
      name: this.formatName(pokemon.name),
      type: "pokemon",
    }));

    // Update cache
    this.cache.pokemon.list = formattedData;
    this.cache.pokemon.listTimestamp = now;

    return formattedData;
  }

  // Get all locations
  async getLocationsList() {
    // Check if cache is valid
    const now = Date.now();
    if (
      this.cache.locations.list &&
      now - this.cache.locations.listTimestamp < CACHE_DURATION
    ) {
      return this.cache.locations.list;
    }

    const data = await this.fetchFromApi(
      "https://pokeapi.co/api/v2/location?limit=50"
    );

    const formattedData = data.results.map((location) => ({
      id: this.getIdFromUrl(location.url),
      name: this.formatName(location.name),
      type: "route",
    }));

    // Update cache
    this.cache.locations.list = formattedData;
    this.cache.locations.listTimestamp = now;

    return formattedData;
  }

  // Get all items
  async getItemsList() {
    // Check if cache is valid
    const now = Date.now();
    if (
      this.cache.items.list &&
      now - this.cache.items.listTimestamp < CACHE_DURATION
    ) {
      return this.cache.items.list;
    }

    const data = await this.fetchFromApi(
      "https://pokeapi.co/api/v2/item?limit=50"
    );

    const formattedData = data.results.map((item) => ({
      id: this.getIdFromUrl(item.url),
      name: this.formatName(item.name),
      type: "item",
    }));

    // Update cache
    this.cache.items.list = formattedData;
    this.cache.items.listTimestamp = now;

    return formattedData;
  }

  // Get all abilities
  async getAbilitiesList() {
    // Check if cache is valid
    const now = Date.now();
    if (
      this.cache.abilities.list &&
      now - this.cache.abilities.listTimestamp < CACHE_DURATION
    ) {
      return this.cache.abilities.list;
    }

    const data = await this.fetchFromApi(
      "https://pokeapi.co/api/v2/ability?limit=100"
    );

    const formattedData = data.results.map((ability) => ({
      id: this.getIdFromUrl(ability.url),
      name: this.formatName(ability.name),
      type: "ability",
    }));

    // Update cache
    this.cache.abilities.list = formattedData;
    this.cache.abilities.listTimestamp = now;

    return formattedData;
  }

  // Get all natures
  async getNaturesList() {
    // Check if cache is valid
    const now = Date.now();
    if (
      this.cache.natures.list &&
      now - this.cache.natures.listTimestamp < CACHE_DURATION
    ) {
      return this.cache.natures.list;
    }

    const data = await this.fetchFromApi(
      "https://pokeapi.co/api/v2/nature?limit=25"
    );

    const formattedData = data.results.map((nature) => ({
      id: this.getIdFromUrl(nature.url),
      name: this.formatName(nature.name),
      type: "nature",
    }));

    // Update cache
    this.cache.natures.list = formattedData;
    this.cache.natures.listTimestamp = now;

    return formattedData;
  }

  // Get all TMs (machines)
  async getMachinesList() {
    // Check if cache is valid
    const now = Date.now();
    if (
      this.cache.machines.list &&
      now - this.cache.machines.listTimestamp < CACHE_DURATION
    ) {
      return this.cache.machines.list;
    }

    const data = await this.fetchFromApi(
      "https://pokeapi.co/api/v2/machine?limit=100"
    );

    // For machines, we need to fetch a bit more data to get usable names
    const machinePromises = data.results.slice(0, 50).map(async (machine) => {
      try {
        const machineData = await this.fetchFromApi(machine.url);
        const moveData = await this.fetchFromApi(machineData.move.url);
        const itemData = await this.fetchFromApi(machineData.item.url);

        // Check if this is a TM (not an HM or TR)
        const isTM = itemData.name.toLowerCase().includes("tm");
        if (!isTM) return null;

        return {
          id: this.getIdFromUrl(machine.url),
          name: `TM${itemData.name.match(/\d+/)?.[0] || ""}: ${this.formatName(
            moveData.name
          )}`,
          type: "tm",
        };
      } catch (error) {
        console.error(`Error fetching machine details:`, error);
        return null;
      }
    });

    const machineResults = await Promise.all(machinePromises);
    const formattedData = machineResults.filter(Boolean); // Remove nulls

    // Update cache
    this.cache.machines.list = formattedData;
    this.cache.machines.listTimestamp = now;

    return formattedData;
  }

  // Get Pokémon details
  async getPokemonDetails(id) {
    // Check if cached
    if (this.cache.pokemon.details[id]) {
      return this.cache.pokemon.details[id];
    }

    // Fetch basic Pokémon data
    const data = await this.fetchFromApi(
      `https://pokeapi.co/api/v2/pokemon/${id}`
    );

    // Fetch species data for description
    const speciesData = await this.fetchFromApi(data.species.url);

    // Find English flavor text
    const englishEntry = speciesData.flavor_text_entries.find(
      (entry) => entry.language.name === "en"
    );

    const formattedData = {
      name: this.formatName(data.name),
      description: englishEntry
        ? englishEntry.flavor_text.replace(/[\f\n\r]/g, " ")
        : "No description available.",
      stats: {
        hp: data.stats.find((stat) => stat.stat.name === "hp")?.base_stat || 0,
        attack:
          data.stats.find((stat) => stat.stat.name === "attack")?.base_stat ||
          0,
        defense:
          data.stats.find((stat) => stat.stat.name === "defense")?.base_stat ||
          0,
        speed:
          data.stats.find((stat) => stat.stat.name === "speed")?.base_stat || 0,
      },
      types: data.types.map((typeInfo) => this.formatName(typeInfo.type.name)),
      // Use official artwork if available
      image:
        data.sprites.other["official-artwork"]?.front_default ||
        data.sprites.front_default ||
        "/api/placeholder/200/200",
    };

    // Cache the result
    this.cache.pokemon.details[id] = formattedData;

    return formattedData;
  }

  // Get location details
  async getLocationDetails(id) {
    // Check if cached
    if (this.cache.locations.details[id]) {
      return this.cache.locations.details[id];
    }

    const data = await this.fetchFromApi(
      `https://pokeapi.co/api/v2/location/${id}`
    );

    // Get Pokémon in this location
    let pokemonList = [];

    try {
      // Get the first area for this location
      const areasData = await this.fetchFromApi(
        `https://pokeapi.co/api/v2/location-area?location=${id}`
      );

      if (areasData.results.length > 0) {
        const areaData = await this.fetchFromApi(areasData.results[0].url);

        // Extract unique Pokémon from the area
        pokemonList = [
          ...new Set(
            areaData.pokemon_encounters.map((encounter) =>
              this.formatName(encounter.pokemon.name)
            )
          ),
        ].slice(0, 10); // Limit to 10 Pokémon
      }
    } catch (err) {
      console.error("Error fetching location areas:", err);
    }

    const formattedData = {
      name: this.formatName(data.name),
      description: `${this.formatName(data.name)} is located in the ${
        data.region?.name || "unknown"
      } region.`,
      pokemon:
        pokemonList.length > 0 ? pokemonList : ["No Pokémon data available"],
      image: "/api/placeholder/400/200", // PokeAPI doesn't have location images
    };

    // Cache the result
    this.cache.locations.details[id] = formattedData;

    return formattedData;
  }

  // Get item details
  async getItemDetails(id) {
    // Check if cached
    if (this.cache.items.details[id]) {
      return this.cache.items.details[id];
    }

    const data = await this.fetchFromApi(
      `https://pokeapi.co/api/v2/item/${id}`
    );

    // Find English flavor text
    const englishFlavorText = data.flavor_text_entries.find(
      (entry) => entry.language.name === "en"
    );

    const formattedData = {
      name: this.formatName(data.name),
      description: englishFlavorText
        ? englishFlavorText.text.replace(/[\f\n\r]/g, " ")
        : "No description available.",
      price: data.cost,
      category: this.formatName(data.category.name),
      image: data.sprites.default || "/api/placeholder/150/150",
    };

    // Cache the result
    this.cache.items.details[id] = formattedData;

    return formattedData;
  }

  // Get ability details
  async getAbilityDetails(id) {
    // Check if cached
    if (this.cache.abilities.details[id]) {
      return this.cache.abilities.details[id];
    }

    const data = await this.fetchFromApi(
      `https://pokeapi.co/api/v2/ability/${id}`
    );

    // Find English effect entry
    const englishEffect = data.effect_entries.find(
      (entry) => entry.language.name === "en"
    );

    // Get Pokémon with this ability
    const pokemonWithAbility = data.pokemon
      .slice(0, 8) // Limit to 8 Pokémon
      .map((entry) => this.formatName(entry.pokemon.name));

    const formattedData = {
      name: this.formatName(data.name),
      description: englishEffect
        ? englishEffect.effect
        : "No description available.",
      pokemon: pokemonWithAbility,
      generation: this.formatName(data.generation.name),
    };

    // Cache the result
    this.cache.abilities.details[id] = formattedData;

    return formattedData;
  }

  // Get nature details
  async getNatureDetails(id) {
    // Check if cached
    if (this.cache.natures.details[id]) {
      return this.cache.natures.details[id];
    }

    const data = await this.fetchFromApi(
      `https://pokeapi.co/api/v2/nature/${id}`
    );

    const increasedStat = data.increased_stat
      ? this.formatName(data.increased_stat.name)
      : "None";

    const decreasedStat = data.decreased_stat
      ? this.formatName(data.decreased_stat.name)
      : "None";

    const formattedData = {
      name: this.formatName(data.name),
      description: `${this.formatName(
        data.name
      )} nature increases ${increasedStat} and decreases ${decreasedStat}.`,
      increasedStat,
      decreasedStat,
      favors: data.likes_flavor
        ? this.formatName(data.likes_flavor.name)
        : "None",
      dislikes: data.hates_flavor
        ? this.formatName(data.hates_flavor.name)
        : "None",
    };

    // Cache the result
    this.cache.natures.details[id] = formattedData;

    return formattedData;
  }

  // Get TM details
  async getTMDetails(id) {
    // Check if cached
    if (this.cache.machines.details[id]) {
      return this.cache.machines.details[id];
    }

    const data = await this.fetchFromApi(
      `https://pokeapi.co/api/v2/machine/${id}`
    );

    // Fetch move details
    const moveData = await this.fetchFromApi(data.move.url);

    // Fetch item (TM) details
    const itemData = await this.fetchFromApi(data.item.url);

    // Find English flavor text for the move
    const englishFlavorText = moveData.flavor_text_entries.find(
      (entry) => entry.language.name === "en"
    );

    // Get TM number
    const tmNumber = itemData.name.match(/\d+/)?.[0] || "";

    const formattedData = {
      name: `TM${tmNumber}: ${this.formatName(moveData.name)}`,
      description: englishFlavorText
        ? englishFlavorText.flavor_text.replace(/[\f\n\r]/g, " ")
        : "No description available.",
      power: moveData.power || "N/A",
      accuracy: moveData.accuracy || "N/A",
      type: this.formatName(moveData.type.name),
      category: moveData.damage_class
        ? this.formatName(moveData.damage_class.name)
        : "N/A",
      image: itemData.sprites.default || "/api/placeholder/150/150",
    };

    // Cache the result
    this.cache.machines.details[id] = formattedData;

    return formattedData;
  }

  // Get details based on type
  async getDetails(type, id) {
    switch (type) {
      case "pokemon":
        return this.getPokemonDetails(id);
      case "route":
        return this.getLocationDetails(id);
      case "item":
        return this.getItemDetails(id);
      case "ability":
        return this.getAbilityDetails(id);
      case "nature":
        return this.getNatureDetails(id);
      case "tm":
        return this.getTMDetails(id);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  // Search across all categories
  async searchAll(query) {
    if (!query || query.length < 2) return [];

    query = query.toLowerCase();

    try {
      // Get all data (will use cache if available)
      const [pokemon, locations, items, abilities, natures, machines] =
        await Promise.all([
          this.getPokemonList(),
          this.getLocationsList(),
          this.getItemsList(),
          this.getAbilitiesList(),
          this.getNaturesList(),
          this.getMachinesList(),
        ]);

      // Filter by query
      const filteredPokemon = pokemon
        .filter((p) => p.name.toLowerCase().includes(query))
        .slice(0, 5);

      const filteredLocations = locations
        .filter((l) => l.name.toLowerCase().includes(query))
        .slice(0, 5);

      const filteredItems = items
        .filter((i) => i.name.toLowerCase().includes(query))
        .slice(0, 5);

      const filteredAbilities = abilities
        .filter((a) => a.name.toLowerCase().includes(query))
        .slice(0, 5);

      const filteredNatures = natures
        .filter((n) => n.name.toLowerCase().includes(query))
        .slice(0, 5);

      const filteredMachines = machines
        .filter((m) => m.name.toLowerCase().includes(query))
        .slice(0, 5);

      // Combine results
      return [
        ...filteredPokemon,
        ...filteredLocations,
        ...filteredItems,
        ...filteredAbilities,
        ...filteredNatures,
        ...filteredMachines,
      ];
    } catch (error) {
      console.error("Error searching:", error);
      return [];
    }
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;
