/** @type {import('tailwindcss').Config} */
export default {
  // darkMode removed — light mode only
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			/* Analytics dashboard palette */
  			expedition: {
  				inkBlack: '#051524',
  				rosewood: '#26532B',
  				cerulean: '#347698',
  				yaleBlue: '#1C486F',
  				turquoiseSurf: '#50A6C9',
  				greyOlive: '#9F9F9D',
  				rosewoodDark: '#1B3D20',
  			},
  			chart: {
  				'1': '#347698',
  				'2': '#50A6C9',
  				'3': '#1C486F',
  				'4': '#26532B',
  				'5': '#9F9F9D'
  			}
  		},
  		boxShadow: {
  			'expedition-base': '0 1px 3px rgba(5, 21, 36, 0.3)',
  			'expedition-camp-1': '0 4px 6px rgba(5, 21, 36, 0.3)',
  			'expedition-camp-2': '0 10px 15px rgba(5, 21, 36, 0.3)',
  			'expedition-camp-3': '0 20px 25px rgba(5, 21, 36, 0.4)',
  			'expedition-summit': '0 25px 50px rgba(5, 21, 36, 0.5)',
  		},
  		keyframes: {
  			'mountain-ascent': {
  				from: { transform: 'translateY(50px)', opacity: '0' },
  				to: { transform: 'translateY(0)', opacity: '1' },
  			},
  			'flag-plant': {
  				'0%, 100%': { transform: 'scale(1)' },
  				'50%': { transform: 'scale(1.05)' },
  			},
  			'message-scroll': {
  				from: { transform: 'translateX(100%)', opacity: '0' },
  				to: { transform: 'translateX(0)', opacity: '1' },
  			},
  			'summit-ring': {
  				from: { transform: 'scale(0.8)', opacity: '0' },
  				to: { transform: 'scale(1)', opacity: '1' },
  			},
  			'risk-pulse': {
  				'0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(38, 83, 43, 0.4)' },
  				'50%': { opacity: '0.95', boxShadow: '0 0 0 8px rgba(38, 83, 43, 0)' },
  			},
  			'summit-beacon': {
  				'0%, 100%': { boxShadow: '0 0 12px 2px rgba(38, 83, 43, 0.5)' },
  				'50%': { boxShadow: '0 0 20px 6px rgba(38, 83, 43, 0.3)' },
  			},
  		},
  		animation: {
  			'mountain-ascent': 'mountain-ascent 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
  			'flag-plant': 'flag-plant 300ms ease-out',
  			'message-scroll': 'message-scroll 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
  			'summit-ring': 'summit-ring 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
  			'risk-pulse': 'risk-pulse 3s ease-in-out infinite',
  			'summit-beacon': 'summit-beacon 1.5s ease-in-out infinite',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
