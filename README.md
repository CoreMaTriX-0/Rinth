# Rinth - Gadget Project Builder

A modern web application that helps users build gadget projects (robotics, electronics, DIY) with AI-generated instructions, components lists, code, and shopping links.

## Features

- 🤖 **AI-Powered Project Generation** - Get instant project plans using Gemini API
- 📋 **Step-by-Step Instructions** - Clear, detailed build instructions
- 🔧 **Component Lists** - Full parts list with quantities and descriptions
- 💻 **Ready-to-Use Code** - Copy-paste code for your projects
- 🛒 **Direct Shopping Links** - Quick access to purchase components
- 👥 **Community Sharing** - Share and explore projects from other makers
- 🔐 **Authentication** - Secure login with email, Google, and GitHub

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Routing**: React Router
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **AI Integration**: Google Gemini API (backend)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account
- Google/GitHub OAuth credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   cd engineer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Go to Project Settings > API and copy:
      - Project URL
      - Anon/Public key
   
   c. Create a `.env` file in the root directory:
      ```env
      VITE_SUPABASE_URL=your_supabase_project_url
      VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
      ```

4. **Configure Authentication Providers**

   In your Supabase dashboard, go to Authentication > Providers:
   
   - **Email**: Enable email provider and configure email templates
   - **Google OAuth**: 
     - Enable Google provider
     - Add your Google OAuth Client ID and Secret
     - Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`
   - **GitHub OAuth**:
     - Enable GitHub provider
     - Add your GitHub OAuth App credentials
     - Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`

5. **Set up Database (Optional)**

   Create a `profiles` table in Supabase SQL Editor:
   ```sql
   create table profiles (
     id uuid references auth.users on delete cascade primary key,
     username text unique,
     avatar_url text,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Enable Row Level Security
   alter table profiles enable row level security;

   -- Create policies
   create policy "Public profiles are viewable by everyone"
     on profiles for select
     using ( true );

   create policy "Users can insert their own profile"
     on profiles for insert
     with check ( auth.uid() = id );

   create policy "Users can update own profile"
     on profiles for update
     using ( auth.uid() = id );
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5173`

## Project Structure

```
engineer/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── PromptInput.tsx
│   │   ├── ProjectImage.tsx
│   │   ├── ProjectDescription.tsx
│   │   ├── TabsContainer.tsx
│   │   ├── CommunityPost.tsx
│   │   └── ShareModal.tsx
│   ├── pages/              # Page components
│   │   ├── PromptPage.tsx
│   │   ├── ResponsePage.tsx
│   │   ├── CommunityPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── VerifyOTPPage.tsx
│   ├── lib/                # Utility libraries
│   │   └── supabase.ts     # Supabase client & auth helpers
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## Authentication Flow

1. **Sign Up**:
   - User chooses Google, GitHub, or Email
   - For email: Enter email, username, password
   - OTP sent to email for verification
   - After verification, user is logged in

2. **Sign In**:
   - User enters email/username and password
   - Or uses Google/GitHub OAuth
   - Redirects to homepage on success

3. **OTP Verification**:
   - 6-digit code sent to email
   - 60-second resend cooldown
   - Auto-focus and paste support

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to Netlify

1. Push your code to GitHub
2. Import project in Netlify
3. Add environment variables in Netlify dashboard
4. Set build command: `npm run build`
5. Set publish directory: `dist`

## Environment Variables

Required variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Design System

- **Primary Color**: Yellow (#F5C518)
- **Background**: Dark (#1A1A1A)
- **Text**: White/Gray
- **Font**: Roboto Mono (monospace)
- **UI Style**: Modern, minimalist, clean

## Features Roadmap

- [x] AI Project Generation
- [x] Community Sharing
- [x] User Authentication
- [ ] User Profiles
- [ ] Project Favorites/Bookmarks
- [ ] Real-time Comments
- [ ] Project Ratings
- [ ] Advanced Search & Filters
- [ ] Project Categories
- [ ] Mobile App

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support, email support@rinth.com or open an issue on GitHub.
