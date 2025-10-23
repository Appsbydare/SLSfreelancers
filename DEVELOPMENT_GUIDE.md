# Sri Lanka Tasks - Development Guide

## 🚀 Quick Start Commands

### Essential Commands for Any Agent

```bash
# Navigate to project directory
cd "C:\Users\Dar_Admin\sri-lanka-tasks"

# Check current status
git status

# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Test build locally
npm start
```

## 📋 Standard Git Workflow

### 1. Before Starting Work
```bash
# Navigate to project
cd "C:\Users\Dar_Admin\sri-lanka-tasks"

# Check current status
git status

# Pull latest changes (if working with others)
git pull origin master
```

### 2. During Development
```bash
# Check status frequently
git status

# Add specific files
git add filename.txt

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add feature: brief description of changes"
```

### 3. After Completing Work
```bash
# Check what will be pushed
git status

# Push to GitHub
git push origin master

# Verify deployment (check Vercel dashboard)
```

## 🔧 Common Development Tasks

### Adding New Features
```bash
# 1. Navigate to project
cd "C:\Users\Dar_Admin\sri-lanka-tasks"

# 2. Create/Modify files
# (Use your editor or agent tools)

# 3. Test locally
npm run dev

# 4. Build test
npm run build

# 5. Commit and push
git add .
git commit -m "Add: [feature name]"
git push origin master
```

### Fixing Issues
```bash
# 1. Navigate to project
cd "C:\Users\Dar_Admin\sri-lanka-tasks"

# 2. Make fixes
# (Use your editor or agent tools)

# 3. Test the fix
npm run build

# 4. Commit and push
git add .
git commit -m "Fix: [issue description]"
git push origin master
```

### Updating Dependencies
```bash
# 1. Navigate to project
cd "C:\Users\Dar_Admin\sri-lanka-tasks"

# 2. Update package.json
# (Use your editor or agent tools)

# 3. Install new dependencies
npm install

# 4. Test build
npm run build

# 5. Commit and push
git add .
git commit -m "Update: [dependency name] to version [x.x.x]"
git push origin master
```

## 📁 Project Structure

```
sri-lanka-tasks/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   ├── browse-tasks/   # Browse tasks page
│   │   ├── post-task/      # Post task page
│   │   ├── how-it-works/   # How it works page
│   │   ├── become-tasker/  # Become tasker page
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable components
│   ├── contexts/          # React contexts
│   ├── data/              # Static data files
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript type definitions
├── data/                  # JSON database files
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🌐 Deployment Information

- **Repository**: https://github.com/Appsbydare/SLSfreelancers
- **Live Site**: https://sl-sfreelancers.vercel.app
- **Platform**: Vercel (auto-deploys from GitHub master branch)

### Deployment Process
1. Push changes to GitHub: `git push origin master`
2. Vercel automatically detects changes
3. Builds and deploys within 2-3 minutes
4. Check deployment status at: https://vercel.com/dashboard

## 🔐 Authentication System

### User Types
- **Customer**: Can post tasks and hire taskers
- **Tasker**: Can browse tasks and earn money

### Database
- **Type**: JSON file-based (`data/users.json`)
- **Location**: `C:\Users\Dar_Admin\sri-lanka-tasks\data\users.json`
- **API Endpoints**: 
  - `POST /api/users` - Register user
  - `POST /api/auth/login` - User login
  - `GET /api/users` - Get user data

## 📝 Commit Message Guidelines

### Format
```
[Type]: [Brief description]

Examples:
- "Add: User authentication system"
- "Fix: Mobile responsive header navigation"
- "Update: Tailwind CSS to latest version"
- "Remove: Unused internationalization files"
- "Refactor: Component structure for better maintainability"
```

### Types
- `Add:` - New features or functionality
- `Fix:` - Bug fixes
- `Update:` - Updates to existing features
- `Remove:` - Removing code or features
- `Refactor:` - Code restructuring without changing functionality
- `Style:` - UI/UX improvements
- `Docs:` - Documentation updates

## 🚨 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Git Issues
```bash
# Reset to last working commit
git reset --hard HEAD~1

# Force push (use carefully)
git push origin master --force
```

#### Dependency Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

## 📞 Support Information

### For Agents
- **Project Path**: `C:\Users\Dar_Admin\sri-lanka-tasks`
- **GitHub Repo**: https://github.com/Appsbydare/SLSfreelancers
- **Live URL**: https://sl-sfreelancers.vercel.app
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Database**: JSON files (prototype)

### Key Files to Remember
- `src/app/layout.tsx` - Root layout with AuthProvider
- `src/components/Header.tsx` - Navigation with authentication
- `src/contexts/AuthContext.tsx` - Authentication state management
- `data/users.json` - User database
- `package.json` - Dependencies and scripts

## 🎯 Current Features

### ✅ Completed
- Homepage with hero section and categories
- Browse tasks page with filtering
- Post task form
- How it works page
- Become a tasker page
- User authentication (signup/login)
- JSON database system
- Responsive design
- User session management

### 🔄 In Progress
- User profile pages
- Task management system
- Payment integration
- Review and rating system

### 📋 Future Features
- Real-time messaging
- File upload system
- Advanced search and filters
- Mobile app
- Multi-language support (Sinhala/Tamil)

---

## 💡 Tips for Agents

1. **Always navigate to the correct directory first**: `cd "C:\Users\Dar_Admin\sri-lanka-tasks"`
2. **Test builds before pushing**: `npm run build`
3. **Use descriptive commit messages**
4. **Check the live site after deployment**: https://sl-sfreelancers.vercel.app
5. **The project uses Next.js 14 with App Router - be aware of the file structure**
6. **Authentication is already implemented - users can signup/login**
7. **JSON database is in `data/users.json` for prototype purposes**

---

*Last Updated: January 2025*
*Version: 1.0.0*
