/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./*.html"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Merriweather', 'serif'],
                headline: ['Anton', 'sans-serif'],
            },
            colors: {
                gw: {
                    red: '#D32F2F',
                    dark: '#111111',
                    light: '#F5F5F3',
                    gray: '#E0E0E0'
                }
            }
        }
    },
    plugins: [],
}
