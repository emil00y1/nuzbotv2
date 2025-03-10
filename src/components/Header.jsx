import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "./ui/modeToggle";
import { SearchBar } from "./SearchBar";
import Link from "next/link";
import Image from "next/image";

function Header() {
  return (
    <header className="flex justify-between p-4 shadow-md bg-slate-700">
      <div>
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-slate-100"
        >
          <Image src="/poke-egg.png" alt="Logo" width={32} height={32} />
          Nuzbot
        </Link>
      </div>
      <div className="flex justify-end gap-4">
        <SearchBar />
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink>Link</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <ModeToggle />
      </div>
    </header>
  );
}

export default Header;
