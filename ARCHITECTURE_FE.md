# Architecture & Project Structure - Frontend

## Tech Stack
* **Framework**: React 18 + Vite
* **Language**: TypeScript (Strict Mode)
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **State Management**: React Context API (`CartContext`, `AuthContext`)
* **Routing**: React Router v6
* **HTTP Client**: Axios

## Folder Structure (`/src`)
src/
├── api/          # Base Axios client & interceptor configuration
├── assets/       # Static images, fonts, and global SVGs
├── components/   # Reusable UI components (Buttons, Modals, Cards)
├── context/      # Global state providers (Auth, Cart)
├── hooks/        # Custom React hooks
├── locales/      # Translation files for i18next (id/, en/)
├── pages/        # Route views & page layouts
├── router/       # Route definitions & Guard protection
├── services/     # API request logic categorized by domain
├── types/        # TypeScript interfaces & DTO definitions
└── utils/        # Helper functions & formatting utilities