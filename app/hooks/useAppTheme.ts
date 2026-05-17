import { useCurrency } from "../utils/CurrencyContext";
import { useTheme } from "../utils/ThemeContext";

export function useAppTheme() {
  const { Colors, isDark, toggleTheme } = useTheme();
  const { currency, setCurrency, formatAmount } = useCurrency();

  return {
    Colors,
    isDark,
    toggleTheme,
    currency,
    setCurrency,
    formatAmount,
  };
}
