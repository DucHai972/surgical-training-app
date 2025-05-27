# Surgical Training Application

A web application for managing clinical training sessions and doctor accounts, built with Frappe (backend) and React (frontend).

## Setup Instructions

### Backend Setup

1. Install Frappe bench and set up a new site
```
# Create a workspace Frappe
bench init [name_of_project] --frappe-branch version-15
 
cd [name_of_project]

# App is like a module to store doctype, code, logic
bench new-app [name_of_app]

# Web where the app will run
bench new-site your_site
```
   
3. Install the Surgical Training app
```
bench get-app surgical_training https://github.com/yourusername/surgical_training
bench --site your_site install-app surgical_training
```
3. Create the Physician role in Frappe User Role settings
4. Migrate the database to create all DocTypes
```
bench migrate
```

### Frontend Setup

1. Navigate to the frontend directory
```
cd apps/surgical_training/frontend
```
2. Install dependencies
```
yarn install
```
3. Build the frontend
```
yarn build
```

## Development Workflow

### Backend Development
- Create and modify DocTypes in the `surgical_training/doctype` directory
- Add server-side logic in the `surgical_training/api` directory

### Frontend Development
- Run the frontend development server:
```
cd apps/surgical_training/frontend
yarn dev
```
- The React application is available at `/surgical_training/`
- API endpoints are available under `/api/method/surgical_training.api.*`
