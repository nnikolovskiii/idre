module.exports = {
    darkMode: ["class"], // Enable dark mode variant
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // Adjust path if your source files are in a different directory
    ],
    theme: {
        extend: {
            colors: {
                // Map Tailwind class names to your CSS variables
                background: "var(--background)",
                foreground: "var(--foreground)",
                sidebar: {
                    background: "var(--sidebar-background)",
                    foreground: "var(--sidebar-foreground)",
                    primary: "var(--sidebar-primary)",
                    "primary-foreground": "var(--sidebar-primary-foreground)",
                    accent: "var(--sidebar-accent)",
                    "accent-foreground": "var(--sidebar-accent-foreground)",
                    border: "var(--sidebar-border)",
                    ring: "var(--sidebar-ring)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground))",
                },
                popover: {
                    DEFAULT:    "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                // chart: { // If you use charts, map these too
                //   "1": "var(--chart-1)",
                //   "2": "var(--chart-2)",
                //   "3": "var(--chart-3)",
                //   "4": "var(--chart-4)",
                //   "5": "var(--chart-5)",
                // },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            backgroundImage: {
                'noise': "var(--noise-bg)",
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        require('@tailwindcss/typography'),
        // Add other plugins if needed
    ],
}