import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  formatAmount: (amount: number) => string;
}

export const ALL_CURRENCIES: { code: string; symbol: string; name: string }[] =
  [
    { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "UGX", symbol: "UGX", name: "Ugandan Shilling" },
    { code: "TZS", symbol: "TZS", name: "Tanzanian Shilling" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
    { code: "ETB", symbol: "Br", name: "Ethiopian Birr" },
    { code: "RWF", symbol: "RF", name: "Rwandan Franc" },
    { code: "XOF", symbol: "CFA", name: "West African CFA" },
    { code: "XAF", symbol: "FCFA", name: "Central African CFA" },
    { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
    { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
    { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
    { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "AED", symbol: "AED", name: "UAE Dirham" },
    { code: "SAR", symbol: "SR", name: "Saudi Riyal" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
    { code: "SEK", symbol: "kr", name: "Swedish Krona" },
    { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
    { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  ];

function getSymbol(currency: string): string {
  const entry = ALL_CURRENCIES.find((c) => c.code === currency);
  return entry?.symbol || currency;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "KES",
  setCurrency: () => Promise.resolve(),
  formatAmount: (amount) => `KSh ${Math.round(amount).toLocaleString("en-KE")}`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState("KES");

  useEffect(() => {
    loadCurrency();
  }, []);

  async function loadCurrency() {
    try {
      const stored = await SecureStore.getItemAsync("user_currency");
      if (stored) setCurrencyState(stored);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.id)
        .single();
      if (data?.currency) setCurrencyState(data.currency);
    } catch (error) {
      console.error(error);
    }
  }

  async function setCurrency(newCurrency: string) {
    console.log("CurrencyContext setCurrency called with:", newCurrency);
    setCurrencyState(newCurrency);
    await SecureStore.setItemAsync("user_currency", newCurrency);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ currency: newCurrency })
        .eq("id", user.id);
    } catch (error) {
      console.error(error);
    }
  }

  // formatAmount is recreated every time currency changes
  // This forces all consumers to re-render
  const formatAmount = (amount: number): string => {
    const symbol = getSymbol(currency);
    return `${symbol} ${Math.round(amount).toLocaleString("en-KE")}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
