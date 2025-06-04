# Surgical Training Application

A web application for managing clinical training sessions and doctor accounts, built with Frappe (backend) and React (frontend).

## Features

- **User Authentication**: Doctors can register and login via Frappe's authentication system
- **Session Management**: Admins can create training sessions with multiple videos
- **Video Playback**: Doctors can watch videos in the browser
- **Commenting System**: Doctors can pause videos and leave comments at specific timestamps

## DocTypes

- **Doctor**: Extends User or links to one
- **Session**: Contains details about a training session
- **Video**: Linked to Session, contains video file and metadata
- **VideoComment**: Linked to Doctor, Session, and includes timestamp

## Setup Instructions

### Backend Setup

1. Install Frappe bench and set up a new site
2. Install the Surgical Training app
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

## License

MIT
