# AppImmo - Architecture C4 Model

## Project Overview
AppImmo is a real estate mobile and web application built with Flutter, providing property listings, search functionality, favorites management, and user authentication through a microservices backend architecture.

---

## Level 1: System Context Diagram

![System Context](<WhatsApp Image 2025-12-04 à 10.17.53_26d84fb5.jpg>)

### Description
High-level view showing how users interact with the AppImmo system and its external dependencies:

- **User (Utilisateur)**: Explores countries, views property information, and manages favorites
- **AppImmo Flutter Application**: Cross-platform mobile/web application for property exploration
- **Appwrite Cloud Backend**: Backend-as-a-Service providing database and authentication
- **Material Design 3**: UI component library for consistent visual design

---

## Level 2: Container Diagram

![Container Diagram](<WhatsApp Image 2025-12-04 à 10.17.53_114b8761.jpg>)

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

![Component Diagram](<WhatsApp Image 2025-12-04 à 10.17.53_a4df3a23.jpg>)

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

![Class Diagram](<WhatsApp Image 2025-12-04 à 10.17.53_4bd47626.jpg>)

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