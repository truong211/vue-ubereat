#!/bin/bash
echo "Starting Spring Boot backend and Vue.js frontend..."

echo
echo "=== Building Spring Boot backend ==="
cd backend
mvn clean install -DskipTests
if [ $? -ne 0 ]; then
    echo "Failed to build Spring Boot backend"
    exit 1
fi

echo
echo "=== Starting Spring Boot backend (in new terminal) ==="
gnome-terminal --working-directory=$(pwd) -- bash -c "mvn spring-boot:run; exec bash" || \
xterm -e "cd $(pwd) && mvn spring-boot:run; exec bash" || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && mvn spring-boot:run"' || \
echo "Could not open a new terminal. Please start the backend manually with: cd backend && mvn spring-boot:run"

echo
echo "=== Starting Vue.js frontend (in new terminal) ==="
sleep 5
cd ../frontend
gnome-terminal --working-directory=$(pwd) -- bash -c "npm run dev; exec bash" || \
xterm -e "cd $(pwd) && npm run dev; exec bash" || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev"' || \
echo "Could not open a new terminal. Please start the frontend manually with: cd frontend && npm run dev"

echo
echo "=== Development environment started ==="
echo
echo "Spring Boot backend: http://localhost:8080"
echo "Vue.js frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to exit this console (this will not stop the servers)"
read -p "Press Enter to exit..."
