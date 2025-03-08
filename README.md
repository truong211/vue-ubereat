# UberEat Clone - Spring Boot + Vue.js

This project is a food delivery application similar to UberEats, built with Vue.js for the frontend and Spring Boot for the backend.

## Project Structure

- **Frontend**: Vue.js application with Vuex for state management
- **Backend**: Spring Boot application with JWT authentication

## Prerequisites

- Java 17 or higher
- Node.js 16 or higher
- MySQL database

## Setup Instructions

1. **Database Setup**
   - Create a MySQL database named `food_delivery`
   - Configure database connection in `backend/src/main/resources/application.properties`

2. **Backend Setup**
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Quick Start Scripts**
   - Windows: `start-dev.bat`
   - macOS/Linux: `chmod +x start-dev.sh && ./start-dev.sh`

## Default User Accounts

- Admin: `admin/admin123`

## API Endpoints

### Authentication
- `POST /api/auth/login`: Authenticate a user
- `POST /api/auth/register`: Register a new user

### Restaurants
- `GET /api/restaurants`: Get all restaurants
- `GET /api/restaurants/{id}`: Get restaurant by ID
- `GET /api/restaurants/{id}/menu`: Get restaurant menu

### Health Check
- `GET /api/health`: System health check

## Spring Boot and Vue.js Integration

This project integrates Spring Boot with Vue.js by:

1. **Authentication**: JWT token-based authentication using Spring Security
2. **CORS Configuration**: Configured to allow requests from Vue.js frontend
3. **API Structure**: RESTful API design that matches the Vue.js service layer

## Development

- Backend runs on `http://localhost:8080`
- Frontend runs on `http://localhost:5173`
- Frontend connects to backend using environment variables in `.env`

## Security Features

- JWT-based authentication
- Password encryption
- Role-based access control
- CORS protection
- Spring Security for endpoint protection

## License

This project is licensed under the MIT License.
