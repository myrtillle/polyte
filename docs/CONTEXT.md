# Poly.te Application Context
A comprehensive breakdown of Poly.te's core features and process flows.

## Tech Stack
- Frontend: React Native with TypeScript, Expo, and Expo Router
- Backend/Database: Supabase
- UI Framework: React Native Paper

## 1. Account Types & Authentication

### User Categories
- **Personal Users**: Individual contributors/requesters of plastic waste
- **Business/Firms**: Organizations participating in waste economy
- **Barangay Leaders**: Local officials monitoring waste collection

### Authentication Flow
1. Login with credentials
2. Password reset option available
3. New user registration
4. Redirect to type-specific dashboard

## 2. Core Features

### 2.1 Leaderboard System
- Tracks top-performing Puroks (community units)
- Displays individual user rankings
- Based on accumulated Polys (reward points)

### 2.2 Waste Request System
1. **Request Creation**
   - Specify waste type and quantity
   - Choose pickup method:
     - Public meeting location
     - Supplier location pickup
     - Delivery to specified location
   
2. **Transaction Flow**
   - Post request
   - Review supplier offers
   - Accept/decline offers
   - Chat with supplier
   - Schedule pickup
   - Process payment via E-wallet
   - Complete transaction
   - Submit rating/review

### 2.3 Waste Supply System
1. **Offer Process**
   - Browse request feed
   - Select items to offer
   - Upload waste photos
   - Set pricing
   - Confirm transaction details

2. **Fulfillment Flow**
   - Receive payment
   - Coordinate delivery/pickup
   - Complete handover
   - Receive rating/review

### 2.4 User Profile Management
- **Statistics Dashboard**
  - Collection summary
  - Contribution metrics
  
- **Rewards System**
  - Poly points redemption
  - Available rewards:
    - Mobile load credits
    - Coffee shop discounts
    
- **Account Management**
  - Profile editing
  - Transaction history
  - Account deletion options

### 2.5 Waste Logging System
1. **Logging Process**
   - Record waste type
   - Input quantity (kg/pieces)
   - Specify drop-off location
   
2. **Rewards**
   - Automatic Poly points calculation
   - Credit to user account

## Technical Notes
- E-wallet integration required for transactions
- Media upload capability needed for waste verification
- Real-time chat system for buyer-seller communication
- Location services for pickup/delivery coordination

## 3. Database Schema

### Users Table
```sql
users (
  id: uuid PRIMARY KEY,
  created_at: timestamp with time zone,
  email: text UNIQUE,
  phone: text,
  full_name: text,
  user_type: enum('personal', 'business', 'barangay'),
  avatar_url: text,
  purok_id: uuid REFERENCES puroks(id),
  poly_points: integer DEFAULT 0,
  wallet_balance: decimal DEFAULT 0.00,
  status: enum('active', 'inactive', 'suspended')
)
```

### Puroks Table
```sql
puroks (
  id: uuid PRIMARY KEY,
  name: text,
  barangay: text,
  city: text,
  leader_id: uuid REFERENCES users(id),
  total_points: integer DEFAULT 0
)
```

### Waste Requests Table
```sql
waste_requests (
  id: uuid PRIMARY KEY,
  created_at: timestamp with time zone,
  requester_id: uuid REFERENCES users(id),
  waste_type: enum('PET', 'HDPE', 'LDPE', 'PP', 'PS', 'Other'),
  quantity: decimal,
  unit: enum('kg', 'pieces'),
  pickup_method: enum('public_location', 'supplier_location', 'delivery'),
  location: jsonb,
  status: enum('open', 'in_progress', 'completed', 'cancelled'),
  price_range: numrange,
  description: text
)
```

### Waste Offers Table
```sql
waste_offers (
  id: uuid PRIMARY KEY,
  created_at: timestamp with time zone,
  request_id: uuid REFERENCES waste_requests(id),
  supplier_id: uuid REFERENCES users(id),
  price: decimal,
  status: enum('pending', 'accepted', 'rejected', 'completed'),
  media_urls: text[],
  notes: text
)
```

### Transactions Table
```sql
transactions (
  id: uuid PRIMARY KEY,
  created_at: timestamp with time zone,
  offer_id: uuid REFERENCES waste_offers(id),
  amount: decimal,
  status: enum('pending', 'completed', 'failed', 'refunded'),
  payment_method: enum('e_wallet', 'cash'),
  buyer_rating: integer,
  seller_rating: integer,
  buyer_review: text,
  seller_review: text
)
```

### Waste Logs Table
```sql
waste_logs (
  id: uuid PRIMARY KEY,
  created_at: timestamp with time zone,
  user_id: uuid REFERENCES users(id),
  waste_type: enum('PET', 'HDPE', 'LDPE', 'PP', 'PS', 'Other'),
  quantity: decimal,
  unit: enum('kg', 'pieces'),
  drop_off_location: jsonb,
  points_earned: integer,
  verified_by: uuid REFERENCES users(id),
  media_urls: text[]
)
```

### Chat Messages Table
```sql
chat_messages (
  id: uuid PRIMARY KEY,
  created_at: timestamp with time zone,
  offer_id: uuid REFERENCES waste_offers(id),
  sender_id: uuid REFERENCES users(id),
  content: text,
  read_at: timestamp with time zone
)
```

## 4. Project Structure
```
poly-te/
├── app/                      # Expo Router app directory
│   ├── (auth)/              # Authentication routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── home/            # Home tab
│   │   ├── requests/        # Waste requests tab
│   │   ├── leaderboard/     # Rankings tab
│   │   └── profile/         # User profile tab
│   └── _layout.tsx          # Root layout
├── assets/                   # Static assets
│   ├── images/
│   └── fonts/
├── components/              # Reusable components
│   ├── common/             # Shared components
│   ├── forms/              # Form components
│   └── screens/            # Screen-specific components
├── constants/              # App constants
│   ├── Colors.ts
│   ├── Layout.ts
│   └── Config.ts
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── useDatabase.ts
│   └── useLocation.ts
├── services/              # API and external services
│   ├── supabase.ts       # Supabase client
│   ├── storage.ts        # File storage
│   └── notifications.ts  # Push notifications
├── types/                # TypeScript definitions
│   ├── navigation.ts
│   ├── api.ts
│   └── models.ts
├── utils/               # Helper functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
├── store/              # State management
│   ├── auth/
│   ├── waste/
│   └── profile/
├── theme/             # UI theme configuration
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── app.json          # Expo config
├── babel.config.js   # Babel config
├── package.json      # Dependencies
└── tsconfig.json    # TypeScript config
```

## 5. Technical Requirements

### Development Environment
- Node.js 18+
- Expo CLI
- Supabase CLI
- TypeScript 5+

### Key Dependencies
- expo-router
- react-native-paper
- @supabase/supabase-js
- expo-image-picker
- expo-location
- @react-native-async-storage/async-storage

### Development Tools
- ESLint for code quality
- Prettier for code formatting
- Jest for testing
- React Native Debugger

### CI/CD Requirements
- GitHub Actions for CI
- EAS Build for app builds
- Automated testing on PR
- Staging and production environments

# Development Roadmap

## Phase 1: Project Setup & Authentication (2-3 weeks)
1. Initialize project with Expo and TypeScript
   - Set up development environment
   - Configure ESLint and Prettier
   - Implement basic folder structure

2. Supabase Integration
   - Set up Supabase project
   - Create initial database tables (users, puroks)
   - Configure authentication

3. Authentication Screens
   - Login screen
   - Registration flow with user type selection
   - Password reset functionality
   - Basic profile setup

## Phase 2: Core Navigation & Basic UI (2 weeks)
1. Tab Navigation
   - Implement Expo Router structure
   - Create placeholder screens for main tabs
   - Set up protected routes

2. Theme & UI Components
   - Implement React Native Paper
   - Create common components
   - Design system setup (colors, typography, spacing)

## Phase 3: Waste Request System (3-4 weeks)
1. Request Creation
   - Form for waste details
   - Location selection
   - Media upload functionality

2. Request Listing
   - Browse requests feed
   - Filter and search
   - Request details view

3. Offer System
   - Create offer functionality
   - Offer management
   - Offer acceptance flow

## Phase 4: Chat & Transaction System (2-3 weeks)
1. Chat Implementation
   - Real-time messaging
   - Chat UI
   - Message notifications

2. Transaction Flow
   - Payment integration
   - Transaction status management
   - Rating and review system

## Phase 5: Leaderboard & Rewards (2 weeks)
1. Points System
   - Points calculation
   - Points history
   - Rewards catalog

2. Leaderboard
   - Individual rankings
   - Purok rankings
   - Statistics display

## Phase 6: Waste Logging System (2 weeks)
1. Logging Interface
   - Waste type selection
   - Quantity input
   - Location logging

2. Verification System
   - Admin verification interface
   - Points attribution
   - History tracking

## Phase 7: Profile & Settings (1-2 weeks)
1. Profile Management
   - Edit profile
   - View statistics
   - Transaction history

2. Settings
   - Notifications
   - Privacy settings
   - Account management

## Phase 8: Testing & Polish (2-3 weeks)
1. Testing
   - Unit tests
   - Integration tests
   - User acceptance testing

2. Performance
   - Optimization
   - Load testing
   - Error handling

3. Final Polish
   - UI/UX refinements
   - Documentation
   - Bug fixes

## Phase 9: Deployment (1-2 weeks)
1. Production Setup
   - Configure production environment
   - Set up CI/CD
   - App store preparation

2. Launch
   - Beta testing
   - Store submission
   - Production monitoring setup

Total Estimated Timeline: 17-23 weeks

## Development Guidelines
1. Each phase should include:
   - Component development
   - Integration with Supabase
   - Testing
   - Documentation

2. Regular milestones:
   - Weekly code reviews
   - Bi-weekly testing cycles
   - Monthly deployment to staging

3. Priority considerations:
   - Security first
   - User experience
   - Performance
   - Scalability

4. Testing strategy:
   - Unit tests for utilities
   - Integration tests for flows
   - E2E tests for critical paths
   - Regular security audits
