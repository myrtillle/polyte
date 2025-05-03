# POLY.TE User Guide

## Tech Stack:
- **Frontend**: React Native with TypeScript, Expo, and Expo Router
- **Backend/Database**: Supabase
- **UI Framework**: React Native Paper

## Authentication

### Signup Process
Users can sign up as either:
- **Personal Account**
- **Barangay/Purok Account**

#### Personal Account Requirements
- First Name
- Last Name
- Username
- Email
- Password (with confirmation)
- Barangay (Default: Bankerohan)
- Purok (Options: 1-14)

#### Barangay/Purok Account Requirements
- Email
- Password (with confirmation)
- Barangay (Default: Bankerohan)
- Purok (Options: 1-14)

### Login
- Email and password required
- Forgot password functionality available

## Post Creation
Users can create two types of posts:
- **Seeking For**: Looking for recyclable materials
- **For Collection**: Offering recyclable materials

### Post Requirements
- Collection Type (Seeking For/For Collection)
- Description
- Kilograms
- Type of Plastics (Multiple selection)
  - Plastic Cups
  - Water Bottles
  - Softdrink Bottles
  - Tupperware
  - Cellophane
- Gallery (Optional image upload)
- Mode of Collection:
  - MEET UP
  - PICK UP FROM DROP OFF
  - MEET IN MY LOCATION

## Main Interface

### Header Components
- POLY.TE Logo
- Search Bar
- Notification Icon

### Category Navigation
- **All** (Default, green highlight)
- **Seeking For**
- **For Collection**

### Post Components
- User Information
  - Name
  - Time Posted
- Collection Type
- Item List
- Post Image
- Action Buttons
  - Send Message 📨
  - Comment 💬
  - More Options ⋮

### Bottom Navigation
🏠 Home  
⭐ Leaderboard  
➕ Post  
💬 Messages  
👤 Profile  

## Post Interactions

### "Seeking For" Post Details
- User Profile (Name, Picture, Location)
- Timestamp
- Description
- Images
- Collection Method
- Action Buttons:
  - Decline
  - Chat
  - Offer
  - Comment

### Making an Offer
1. **Item Selection**
   - Green: Selected items
   - Gray: Unselected items

2. **Weight Specification**
   - Format: X of Y kg
   - X = Offered weight
   - Y = Requested weight

3. **Image Upload**
   - Multiple images supported

4. **Price Setting**

5. **Optional Message**

6. **Offer Submission**

### Collection Scheduling
After offer acceptance:
- Date selection
- Time selection
- Collection mode confirmation
- Schedule confirmation

## Transaction Process

### Collection Methods
- Meet-up
- Drop-off
- Pick-up

### Completion Steps
1. Physical item exchange
2. Transaction recording
3. Delivery confirmation
   - Photo proof
   - Both parties must confirm
4. Points allocation
   - 100 Polys per kg

## Leaderboard System

### Points (Polys)
- Earning rate: 100 Polys/kg
- Determines individual and purok rankings

### Categories
1. **Individual Rankings**
2. **Purok Rankings**

### Time Filters
- Monthly
- Weekly
- Yearly
- All-time

### Display Metrics
- Rank
- Name/Purok
- Total Polys
- Weight Contribution

## Profile Features

### User Information
- Profile Picture & Banner
- Name
- Address
- Join Date

### Statistics
- CO₂ Reduction (kg)
- Collection Metrics
  - Collected Sacks
  - Donated Sacks
  - Monthly Average
- Total Polys
- User Rating (⭐⭐⭐⭐⭐)

### Additional Features
- Transaction History
- Messaging System

## Database Schema

### Users Table
- **id**: UUID (Primary Key)
- **first_name**: String
- **last_name**: String
- **username**: String (Unique)
- **email**: String (Unique)
- **password_hash**: String
- **barangay**: String
- **purok**: Integer
- **account_type**: Enum (Personal, Barangay)

### Posts Table
- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key to Users)
- **collection_type**: String
- **item_list**: JSON
- **post_image**: String (URL)
- **timestamp**: Timestamp

### Offers Table
- **id**: UUID (Primary Key)
- **post_id**: UUID (Foreign Key to Posts)
- **offered_weight**: Float
- **requested_weight**: Float
- **price**: Float
- **message**: String
- **timestamp**: Timestamp

### Transactions Table
- **id**: UUID (Primary Key)
- **offer_id**: UUID (Foreign Key to Offers)
- **collection_method**: Enum (Meet-up, Drop-off, Pick-up)
- **date**: Date
- **time**: Time
- **photo_proof**: String (URL)
- **timestamp**: Timestamp

### Leaderboard Table
- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key to Users)
- **total_polys**: Integer
- **weight_contribution**: Float
- **rank**: Integer

## Optimal Folder Structure
polytev2/
├── assets/ # Static assets (images, fonts, etc.)
├── components/ # Reusable components
│ ├── Header/
│ ├── Footer/
│ ├── Post/
│ └── UserProfile/
├── screens/ # Screen components
│ ├── HomeScreen/
│ ├── ProfileScreen/
│ ├── PostDetailScreen/
│ ├── MakeOffer/ # New MakeOffer screen
│ └── LeaderboardScreen/
├── navigation/ # Navigation setup
│ └── AppNavigator.js
├── services/ # API services
│ ├── authService.js
│ ├── postService.js
│ ├── commentsService.js
│ └── transactionService.js
├── store/ # State management (Redux, Context API)
│ └── store.js
├── utils/ # Utility functions
│ └── helpers.js
├── App.tsx # Main application file
└── index.js # Entry point


## Dependencies
- expo: ~50.0.0
- react-native: 0.73.6
- react-native-paper: ^5.0.0
- @supabase/supabase-js: ^2.38.0
- expo-router: ~3.4.0
- And other standard Expo dependencies

## Development Notes
- Using Expo SDK 50
- Mobile-first development approach
- TypeScript for type safety
- Supabase for backend services