import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        glass: {
          surface: "rgba(255, 255, 255, 0.14)",
          border: "rgba(255, 255, 255, 0.36)",
          neon: "#5ef2ff",
          violet: "#8b7bff",
          mint: "#72ffc9"
        }
      },
      boxShadow: {
        float: "0 30px 70px rgba(5, 12, 26, 0.45)"
      },
      backgroundImage: {
        cosmic: "radial-gradient(circle at 20% 20%, rgba(114, 255, 201, 0.28), transparent 28%), radial-gradient(circle at 80% 25%, rgba(94, 242, 255, 0.24), transparent 32%), radial-gradient(circle at 60% 80%, rgba(139, 123, 255, 0.25), transparent 35%)"
      }
    }
  },
  plugins: []
};

export default config;
