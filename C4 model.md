# AppImmo - Architecture C4 Model

## Project Overview
AppImmo is a real estate mobile and web application built with Flutter, providing property listings, search functionality, favorites management, and user authentication through a microservices backend architecture.

---

## Level 1: System Context Diagram

![System Context](<WhatsApp Image 2025-12-03 at 15.43.37-1.jpeg>)

### Description
High-level view showing how users interact with the AppImmo system and its external dependencies:

- **User (Utilisateur)**: Explores countries, views property information, and manages favorites
- **AppImmo Flutter Application**: Cross-platform mobile/web application for property exploration
- **Appwrite Cloud Backend**: Backend-as-a-Service providing database and authentication
- **Material Design 3**: UI component library for consistent visual design

---

## Level 2: Container Diagram

![Container Diagram](<WhatsApp Image 2025-12-03 at 15.44.56-1.jpeg>)

### Description
Shows the major containers (applications and data stores) that make up the system:

**Frontend:**
- **Flutter Mobile/Web Application** (Flutter 3.10+, Dart): Handles UI and business logic for property exploration

**Backend (Appwrite Cloud):**
- **Database**: MongoDB collections storing country data and user favorites
- **Storage**: File storage for property images
- **Authentication**: User management and session handling

**Communication:**
- HTTPS/Web for user access
- REST API for data exchange
- Static assets for images and resources

---

## Level 3: Component Diagram

![Component Diagram](<WhatsApp Image 2025-12-03 at 15.46.22-1.jpeg>)

### Description
Detailed breakdown of the Flutter application's internal structure:

**Presentation Layer:**
- **Splash Screen**: Application launch and initialization
- **Home Screen**: Main navigation hub with search and filter capabilities
- **About Screen**: Property information display
- **Details Screen**: Detailed property information
- **Favorites Screen**: User's saved properties management

**Business Logic Layer:**
- **Country Provider**: State management for country data with ChangeNotifier
- **Favorite Provider**: Favorites management with ChangeNotifier

**Data Layer:**
- **Appwrite Service**: API communication singleton handling HTTP/REST requests
- **Country Model**: Data serialization (JSON)

**Core:**
- **Theme Config**: Material Design 3 configuration
- **Constants**: Application-wide constants and configuration

---

## Level 4: Code/Class Diagram

![Class Diagram](<WhatsApp Image 2025-12-03 at 15.48.01-1.jpeg>)

### Description
Detailed class structure showing relationships and dependencies:

**Key Classes:**
- **CountryProvider**: Manages country list state, loading state, error handling, and search/filter operations
- **FavoriteProvider**: Handles favorite operations (add, remove, toggle) with persistence
- **AppwriteService**: Singleton service for backend communication with database and favorites collection management
- **Country Model**: Data model with properties (id, name, capital, region, population, area, languages, currency, flag, description, geography, economy, fun facts)

**Relationships:**
- AppwriteService creates and manages Country instances
- Providers use AppwriteService for data operations
- Country model supports JSON serialization for API communication

---

## Sequence Diagram: User Journey

![Sequence Diagram](<WhatsApp Image 2025-12-03 at 15.50.05-1.jpeg>)

### Description
Complete user interaction flow from application launch to property management:

1. **Application Initialization**: Provider setup and Appwrite client configuration
2. **Country Loading**: Fetching country list and displaying results
3. **Favorites Management**: Adding/removing favorites with persistence
4. **Search Functionality**: Real-time search with local filtering

**Key Interactions:**
- User → UI Screen → Provider → AppwriteService → Database
- Asynchronous operations with loading states
- Error handling at each layer
- State updates triggering UI refreshes

---

## Deployment Diagram

![Deployment Diagram](<WhatsApp Image 2025-12-03 at 15.51.21-1.jpeg>)

### Description
Infrastructure and deployment architecture:

**Client Devices:**
- **Windows Desktop**: Flutter Windows Build
- **Mobile Future**: Android/iOS potential support
- **Web Browser**: Chrome, Firefox, Safari with Flutter Web

**Hosting:**
- **CDN/Web Server**: Static hosting for HTML/JS/WASM files

**Backend (Appwrite Cloud API Gateway):**
- **API Gateway**: Load balancer with HTTPS/SSL
- **Services**:
  - Database Service (MongoDB): Country and favorites collections
  - Storage Service: Property images and assets
  - Auth Service: User authentication and session management

**Data Storage:**
- **MongoDB**: NoSQL database for country and favorites data
- **File Storage**: Cloud storage for images and assets

**Communication:**
- Direct connection for Windows desktop
- HTTPS for mobile and web clients
- API calls through the gateway to microservices

---

## Technology Stack

### Frontend
- **Framework**: Flutter 3.10+
- **Language**: Dart
- **State Management**: Provider (ChangeNotifier)
- **UI Library**: Material Design 3
- **HTTP Client**: http package

### Backend
- **Platform**: Appwrite Cloud
- **Database**: MongoDB
- **Storage**: Cloud File Storage
- **Authentication**: Appwrite Auth

### Architecture Patterns
- **Provider Pattern**: State management
- **Repository Pattern**: Data layer abstraction
- **Singleton Pattern**: Service instances
- **MVC**: Model-View-Controller separation

---

## Key Features

1. **Property Exploration**: Browse and search real estate listings
2. **Favorites Management**: Save and manage favorite properties
3. **Cross-Platform**: Windows, Web, Mobile (future)
4. **Responsive Design**: Adapts to different screen sizes
5. **Material Design 3**: Modern, consistent UI/UX
6. **Real-time Updates**: State management with Provider
7. **Secure Authentication**: User sessions and data protection

---

*Last Updated: December 3, 2025*