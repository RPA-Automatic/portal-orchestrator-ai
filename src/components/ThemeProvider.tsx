import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  parseTheme,
  readTheme,
  resolveTheme,
  THEME_KEY,
  type ThemePreference,
} from "../lib/theme";

const ThemeContext = createContext<{
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
}>({ preference: "system", setPreference: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readTheme);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const theme = resolveTheme(preference, media.matches);
      document.documentElement.dataset.theme = theme;
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", theme === "dark" ? "#0b1120" : "#f5f7fc");
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null)
        setPreference(parseTheme(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const change = (value: ThemePreference) => {
    setPreference(value);
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      /* Theme still works for this session. */
    }
  };
  return (
    <ThemeContext.Provider value={{ preference, setPreference: change }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeSwitcher() {
  const { preference, setPreference } = useContext(ThemeContext);
  return (
    <div className="theme-switcher" role="group" aria-label="Tema do portal">
      {(
        [
          { value: "light", label: "Tema claro", Icon: Sun },
          { value: "dark", label: "Tema escuro", Icon: Moon },
          { value: "system", label: "Tema automático", Icon: Monitor },
        ] as const
      ).map(({ value, label, Icon }) => (
        <button
          type="button"
          key={value}
          aria-label={label}
          title={label}
          aria-pressed={preference === value}
          onClick={() => setPreference(value)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
