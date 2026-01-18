# Igate-host Platform - Product Requirements Document

## Original Problem Statement
Build a professional hosting company platform named Igate-host for igate company providing:
- Web Hosting Services
- Website Design Services  
- Digital Marketing Services

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Payment**: Kashier Gateway (MOCKED for development)
- **Auth**: JWT + Google OAuth (Emergent Auth)
- **PDF Generation**: ReportLab

## User Personas
1. **End Customer**: Businesses/individuals seeking hosting services in Egypt
2. **Admin**: Platform administrator managing products, orders, invoices

## Core Requirements (Static)
- Arabic RTL as primary language
- Responsive design (desktop/tablet/mobile)
- Professional hosting company aesthetic (Blue/Dark Gray/White)
- Kashier payment integration
- PDF invoice generation
- Admin dashboard

## What's Been Implemented ✅ (January 2025)

### Public Pages
- ✅ Home Page with Hero Slider (3 slides)
- ✅ Hosting Plans Section (3 tiers: البداية, الأعمال, الشركات)
- ✅ Features Section (Why Choose Us)
- ✅ Services Overview (Hosting, Design, Marketing)
- ✅ Statistics Section
- ✅ About Us Page
- ✅ Contact Us Page with Form

### Authentication
- ✅ JWT-based login/register
- ✅ Google OAuth integration (Emergent Auth)
- ✅ Protected routes
- ✅ Admin role-based access

### Customer Dashboard
- ✅ Orders list
- ✅ Invoices list
- ✅ PDF invoice download

### Admin Dashboard
- ✅ Stats overview (revenue, orders, users, messages)
- ✅ Products management (CRUD)
- ✅ Orders management (status updates)
- ✅ Invoices management (view/download)
- ✅ Contact messages management

### Payment Integration
- ✅ Kashier payment flow (MOCKED - real integration ready)
- ✅ Mock payment completion endpoint
- ✅ Order creation
- ✅ Invoice generation on payment

### Technical
- ✅ Arabic RTL layout
- ✅ Cairo font integration
- ✅ Responsive design
- ✅ API with /api prefix
- ✅ MongoDB integration

## Prioritized Backlog

### P0 (Critical for Production)
- Configure real Kashier API credentials
- Set up email notifications for orders/invoices
- Add VAT/tax configuration

### P1 (Important)
- Client area with service management
- Support ticket system
- Domain search functionality
- Invoice email delivery

### P2 (Nice to Have)
- Multi-language support (Arabic/English toggle)
- Advanced analytics dashboard
- Referral system
- Promotional codes

## Next Tasks
1. Get Kashier production credentials from user
2. Configure email service for invoice delivery
3. Add support ticket system
4. Implement domain search

## Admin Credentials (Development)
- Email: admin@igate-host.com
- Password: admin123
