### 7. `FE_CONTEXT.md`

```markdown
# Master Frontend Context - Toti Cakery

## Project Overview
Frontend web aplikasi untuk Toti Cakery (Sistem Pemesanan Kue & Manajemen Toko) yang dibangun dengan React 18, Vite, TypeScript, dan Tailwind CSS.

## Critical Rules for AI Coding Assistant
1. **TypeScript Native**: Selalu sertakan Type/Interface yang jelas. Hindari tipe `any`.
2. **Separation of Concerns**: Jangan membuat API call langsung di dalam file UI/Pages. Gunakan modular service di `src/services/`.
3. **i18n Mandatory**: Seluruh teks string yang tampil di UI **wajib** menggunakan translation key `t('key')` dari `react-i18next`.
4. **Tailwind First**: Gunakan class Tailwind CSS untuk styling. Hindari membuat inline CSS (`style={{ ... }}`) kecuali untuk dynamic style yang kompleks.
5. **Component Reusability**: Buat komponen baru di `src/components/` jika UI tersebut digunakan lebih dari satu kali.