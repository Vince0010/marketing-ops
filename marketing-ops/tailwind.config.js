/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
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
  			/* Expedition semantic + mountain palette */
  			expedition: {
  				summitSky: 'hsl(var(--summit-night))',
  				mountainShadow: 'hsl(var(--mountain-shadow))',
  				snowCap: 'hsl(var(--snow-cap))',
  				glacialBlue: 'hsl(var(--glacial-blue))',
  				navy: 'hsl(var(--expedition-navy))',
  				trail: 'hsl(var(--trail-blue))',
  				evergreen: 'hsl(var(--evergreen))',
  				summit: 'hsl(var(--summit-teal))',
  				signal: 'hsl(var(--signal-orange))',
  				checkpoint: 'hsl(var(--checkpoint-red))',
  				mist: 'hsl(var(--mist-gray))',
  				slate: 'hsl(var(--slate))',
  			},
  			chart: {
  				'1': 'hsl(var(--trail-blue))',
  				'2': 'hsl(var(--evergreen))',
  				'3': 'hsl(var(--summit-teal))',
  				'4': 'hsl(var(--signal-orange))',
  				'5': 'hsl(var(--checkpoint-red))'
  			}
  		},
  		backgroundImage: {
  			'expedition-bg': 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f1a2e 50%, #0c1628 75%, #0a1324 100%)',
  			'expedition-header': 'linear-gradient(90deg, #0f172a, #1e293b, #0f172a)',
  			'card-success': 'linear-gradient(145deg, #1e3a8a, #3b82f6)',
  			'card-warning': 'linear-gradient(145deg, #92400e, #f59e0b)',
  			'card-alert': 'linear-gradient(145deg, #991b1b, #ef4444)',
  		},
  		boxShadow: {
  			'expedition-base': '0 1px 3px rgba(0, 0, 0, 0.1)',
  			'expedition-camp-1': '0 4px 6px rgba(0, 0, 0, 0.1)',
  			'expedition-camp-2': '0 10px 15px rgba(0, 0, 0, 0.1)',
  			'expedition-camp-3': '0 20px 25px rgba(0, 0, 0, 0.15)',
  			'expedition-summit': '0 25px 50px rgba(0, 0, 0, 0.25)',
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
  				'0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.4)' },
  				'50%': { opacity: '0.95', boxShadow: '0 0 0 8px rgba(245, 158, 11, 0)' },
  			},
  			'summit-beacon': {
  				'0%, 100%': { boxShadow: '0 0 12px 2px rgba(239, 68, 68, 0.5)' },
  				'50%': { boxShadow: '0 0 20px 6px rgba(239, 68, 68, 0.3)' },
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