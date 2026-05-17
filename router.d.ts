/* eslint-disable */
import * as Router from "expo-router";

export * from "expo-router";

declare module "expo-router" {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams:
        | {
            pathname: Router.RelativePathString;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: Router.ExternalPathString;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/AuthScreen`; params?: Router.UnknownInputParams }
        | { pathname: `/`; params?: Router.UnknownInputParams }
        | { pathname: `/hooks/useAppTheme`; params?: Router.UnknownInputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | {
            pathname: `${"/(tabs)"}/goals` | `/goals`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `${"/(tabs)"}/home` | `/home`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `${"/(tabs)"}/pulse` | `/pulse`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `${"/(tabs)"}/settings` | `/settings`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/components/AddExpenseModal`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/components/AddTransactionModal`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/constants/colors`; params?: Router.UnknownInputParams }
        | {
            pathname: `/constants/typography`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/hooks/useExpenses`; params?: Router.UnknownInputParams }
        | {
            pathname: `/screens/BankConnectionScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/HomeScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/IncomePulseScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/InsightsScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/OnboardingScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/SettingsScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/utils/CurrencyContext`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/utils/notifications`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/utils/supabase`; params?: Router.UnknownInputParams }
        | {
            pathname: `/utils/ThemeContext`;
            params?: Router.UnknownInputParams;
          };
      hrefOutputParams:
        | {
            pathname: Router.RelativePathString;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: Router.ExternalPathString;
            params?: Router.UnknownOutputParams;
          }
        | { pathname: `/AuthScreen`; params?: Router.UnknownOutputParams }
        | { pathname: `/`; params?: Router.UnknownOutputParams }
        | {
            pathname: `/hooks/useAppTheme`;
            params?: Router.UnknownOutputParams;
          }
        | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams }
        | {
            pathname: `${"/(tabs)"}/goals` | `/goals`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `${"/(tabs)"}/home` | `/home`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `${"/(tabs)"}/pulse` | `/pulse`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `${"/(tabs)"}/settings` | `/settings`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/components/AddExpenseModal`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/components/AddTransactionModal`;
            params?: Router.UnknownOutputParams;
          }
        | { pathname: `/constants/colors`; params?: Router.UnknownOutputParams }
        | {
            pathname: `/constants/typography`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/hooks/useExpenses`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/screens/BankConnectionScreen`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/screens/HomeScreen`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/screens/IncomePulseScreen`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/screens/InsightsScreen`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/screens/OnboardingScreen`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/screens/SettingsScreen`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/utils/CurrencyContext`;
            params?: Router.UnknownOutputParams;
          }
        | {
            pathname: `/utils/notifications`;
            params?: Router.UnknownOutputParams;
          }
        | { pathname: `/utils/supabase`; params?: Router.UnknownOutputParams }
        | {
            pathname: `/utils/ThemeContext`;
            params?: Router.UnknownOutputParams;
          };
      href:
        | Router.RelativePathString
        | Router.ExternalPathString
        | `/AuthScreen${`?${string}` | `#${string}` | ""}`
        | `/${`?${string}` | `#${string}` | ""}`
        | `/hooks/useAppTheme${`?${string}` | `#${string}` | ""}`
        | `/_sitemap${`?${string}` | `#${string}` | ""}`
        | `${"/(tabs)"}/goals${`?${string}` | `#${string}` | ""}`
        | `/goals${`?${string}` | `#${string}` | ""}`
        | `${"/(tabs)"}/home${`?${string}` | `#${string}` | ""}`
        | `/home${`?${string}` | `#${string}` | ""}`
        | `${"/(tabs)"}/pulse${`?${string}` | `#${string}` | ""}`
        | `/pulse${`?${string}` | `#${string}` | ""}`
        | `${"/(tabs)"}/settings${`?${string}` | `#${string}` | ""}`
        | `/settings${`?${string}` | `#${string}` | ""}`
        | `/components/AddExpenseModal${`?${string}` | `#${string}` | ""}`
        | `/components/AddTransactionModal${`?${string}` | `#${string}` | ""}`
        | `/constants/colors${`?${string}` | `#${string}` | ""}`
        | `/constants/typography${`?${string}` | `#${string}` | ""}`
        | `/hooks/useExpenses${`?${string}` | `#${string}` | ""}`
        | `/screens/BankConnectionScreen${`?${string}` | `#${string}` | ""}`
        | `/screens/HomeScreen${`?${string}` | `#${string}` | ""}`
        | `/screens/IncomePulseScreen${`?${string}` | `#${string}` | ""}`
        | `/screens/InsightsScreen${`?${string}` | `#${string}` | ""}`
        | `/screens/OnboardingScreen${`?${string}` | `#${string}` | ""}`
        | `/screens/SettingsScreen${`?${string}` | `#${string}` | ""}`
        | `/utils/CurrencyContext${`?${string}` | `#${string}` | ""}`
        | `/utils/notifications${`?${string}` | `#${string}` | ""}`
        | `/utils/supabase${`?${string}` | `#${string}` | ""}`
        | `/utils/ThemeContext${`?${string}` | `#${string}` | ""}`
        | {
            pathname: Router.RelativePathString;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: Router.ExternalPathString;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/AuthScreen`; params?: Router.UnknownInputParams }
        | { pathname: `/`; params?: Router.UnknownInputParams }
        | { pathname: `/hooks/useAppTheme`; params?: Router.UnknownInputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | {
            pathname: `${"/(tabs)"}/goals` | `/goals`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `${"/(tabs)"}/home` | `/home`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `${"/(tabs)"}/pulse` | `/pulse`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `${"/(tabs)"}/settings` | `/settings`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/components/AddExpenseModal`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/components/AddTransactionModal`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/constants/colors`; params?: Router.UnknownInputParams }
        | {
            pathname: `/constants/typography`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/hooks/useExpenses`; params?: Router.UnknownInputParams }
        | {
            pathname: `/screens/BankConnectionScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/HomeScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/IncomePulseScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/InsightsScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/OnboardingScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/screens/SettingsScreen`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/utils/CurrencyContext`;
            params?: Router.UnknownInputParams;
          }
        | {
            pathname: `/utils/notifications`;
            params?: Router.UnknownInputParams;
          }
        | { pathname: `/utils/supabase`; params?: Router.UnknownInputParams }
        | {
            pathname: `/utils/ThemeContext`;
            params?: Router.UnknownInputParams;
          };
    }
  }
}
