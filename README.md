# Sri Lanka Tasks - Task Marketplace Platform

A modern task marketplace platform built for Sri Lanka, inspired by Airtasker. Connect skilled professionals with people who need tasks completed.

## 🌟 Features

- **Multi-language Support**: English, Sinhala (සිංහල), and Tamil (தமிழ்)
- **Task Posting**: Easy task creation with detailed descriptions and budget setting
- **Task Browsing**: Filter and search through available tasks
- **Category-based Organization**: 15+ service categories tailored for Sri Lanka
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Built with Tailwind CSS and Next.js

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl
- **Icons**: Lucide React
- **Deployment**: Vercel (ready)

## 📁 Project Structure

```
src/
├── app/
│   ├── [locale]/           # Internationalized routes
│   │   ├── browse-tasks/   # Task browsing page
│   │   ├── post-task/      # Task posting page
│   │   ├── how-it-works/   # How it works page
│   │   ├── become-tasker/  # Tasker registration
│   │   └── page.tsx        # Homepage
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Root redirect
├── components/             # Reusable components
│   ├── Header.tsx          # Navigation header
│   ├── Footer.tsx          # Site footer
│   ├── LanguageSwitcher.tsx # Language selection
│   └── CategoryGrid.tsx    # Service categories
├── data/                   # Static data
│   └── categories.ts       # Service categories
├── lib/                    # Utilities
│   └── utils.ts            # Helper functions
├── types/                  # TypeScript types
│   └── index.ts            # Type definitions
├── i18n.ts                 # Internationalization config
└── middleware.ts           # Next.js middleware
```

## 🎯 Service Categories

The platform includes 15+ categories tailored for Sri Lanka:

- **Home & Garden**: Cleaning, Gardening, Handyman
- **Moving & Delivery**: Removals, Furniture Assembly, Delivery
- **Home Improvements**: Painting, Carpentry, Plumbing, Electrical
- **Business & Admin**: Data Entry, Virtual Assistant, Bookkeeping
- **Creative & Digital**: Graphic Design, Web Development, Content Writing
- **Events & Entertainment**: Event Planning, Catering, Photography
- **Beauty & Wellness**: Hair Styling, Makeup, Personal Training
- **Automotive**: Car Repairs, Car Washing, Towing
- **Pet Care**: Dog Walking, Pet Sitting, Pet Grooming
- **Lessons & Training**: Tutoring, Music Lessons, Language Lessons
- **Sri Lanka Specific**: Three-wheeler Services, Tuition Classes, Wedding Services

## 🌐 Language Support

- **English**: Primary language
- **Sinhala (සිංහල)**: Full translation support
- **Tamil (தமிழ்)**: Full translation support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sri-lanka-tasks
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📱 Pages

### Homepage (`/`)
- Hero section with call-to-action
- Popular service categories
- How it works section
- Trust and safety features
- Statistics and testimonials

### Browse Tasks (`/browse-tasks`)
- Task listing with search and filters
- Category-based filtering
- Budget and location sorting
- Task cards with detailed information

### Post Task (`/post-task`)
- Task creation form
- Category selection
- Budget and deadline setting
- Image upload support
- Location specification

### How It Works (`/how-it-works`)
- Step-by-step guide for task posters
- Step-by-step guide for taskers
- Platform features and benefits
- Trust and safety information

### Become a Tasker (`/become-tasker`)
- Tasker registration form
- Benefits and success stories
- Requirements and qualifications
- Application process

## 🎨 Design Features

- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, professional interface
- **Accessibility**: WCAG compliant components
- **Performance**: Optimized for fast loading
- **SEO Ready**: Meta tags and structured data

## 🔧 Customization

### Adding New Categories

Edit `src/data/categories.ts` to add new service categories:

```typescript
{
  id: 'new-category',
  name: 'New Category',
  nameSi: 'නව කාණ්ඩය',
  nameTa: 'புதிய வகை',
  icon: '🆕',
  description: 'Description of the new category',
  popular: false,
}
```

### Adding New Languages

1. Add locale to `src/middleware.ts` and `src/i18n.ts`
2. Create translation file in `locales/` directory
3. Update language switcher in `src/components/LanguageSwitcher.tsx`

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Manual Deployment

```bash
npm run build
npm run start
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please contact [your-email@example.com]

---

**Built with ❤️ for Sri Lanka**