/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./views/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#06DC7F",
                "primary-dark": "#05c470",
                "secondary": "#015754",
                "dark-base": "#2A2E2D",
                "mint": "#C8E3CB",
                "off-white": "#F1F8F5",
                "background-light": "#F1F8F5",
                "background-dark": "#2A2E2D",
                "surface-light": "#ffffff",
                "surface-dark": "#1E2221",
                "text-main": "#111815",
                "text-muted": "#608a79",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: {
                "button": "24px",
                "card-xl": "28px",
            },
            boxShadow: {
                "soft": "0 4px 20px -2px rgba(1, 87, 84, 0.1)",
                "card": "0 2px 12px -1px rgba(0, 0, 0, 0.12)",
                "primary-glow": "0 0 20px rgba(6, 220, 127, 0.3)",
                "glass": "inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.05)",
            },
            animation: {
                'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'float-heart': 'float-heart 2s ease-out forwards',
                'laser-scan': 'laser-scan 2.5s ease-in-out infinite',
                'shake-subtle': 'shake-subtle 10s ease-in-out infinite',
                'marquee': 'marquee 40s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'float-heart': {
                    '0%': { transform: 'translateY(0) scale(0.5) rotate(0deg)', opacity: '0' },
                    '10%': { opacity: '1' },
                    '100%': { transform: 'translateY(-200px) scale(1.5) rotate(15deg)', opacity: '0' },
                },
                'laser-scan': {
                    '0%': { top: '10%', opacity: '0' },
                    '15%': { opacity: '1' },
                    '85%': { opacity: '1' },
                    '100%': { top: '90%', opacity: '0' },
                },
                'shake-subtle': {
                    '0%, 100%': { transform: 'rotate(0deg) translateY(0)' },
                    '25%': { transform: 'rotate(1deg) translateY(-5px)' },
                    '50%': { transform: 'rotate(-1deg) translateY(0)' },
                    '75%': { transform: 'rotate(1deg) translateY(5px)' },
                },
                'marquee': {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
}
