# Surgical Training Application

A comprehensive web application for managing clinical training sessions and doctor accounts, built with **Frappe Framework** (backend) and **React** (frontend).

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Python 3.8+** (`python3 --version`)
- **Node.js 16+** and **npm** (`node --version && npm --version`)
- **Git** (`git --version`)
- **MariaDB** or **MySQL** database server
- **Redis** server

### Install Prerequisites (Ubuntu/Debian)

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-dev python3-setuptools python3-venv -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install Git
sudo apt install git -y

# Install MariaDB
sudo apt install mariadb-server mariadb-client -y

# Install Redis
sudo apt install redis-server -y

# Install other dependencies
sudo apt install libffi-dev python3-dev libssl-dev wkhtmltopdf -y
```

### Install Prerequisites (macOS)

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install python@3.9 node git mariadb redis
```

## Quick Setup (Recommended)

### Step 1: Install Frappe Bench

```bash
# Install frappe-bench via pip
pip3 install frappe-bench

# OR install via easy_install script (alternative method)
# sudo python3 -m pip install frappe-bench
```

### Step 2: Create Frappe Workspace

```bash
# Create a new Frappe workspace (this will take a few minutes)
bench init surgical_training_workspace --frappe-branch version-15

# Navigate to the workspace
cd surgical_training_workspace
```

### Step 3: Create a New Site

```bash
# Create a new site (replace 'surgical-training.local' with your preferred site name)
bench new-site surgical-training.local

# You'll be prompted to enter MySQL root password and Administrator password
```

### Step 4: Get Required Apps

```bash
# Install ERPNext (optional but recommended for full functionality)
bench get-app erpnext --branch version-15

# Install the Surgical Training app
bench get-app surgical_training https://github.com/DucHai972/surgical-training-app.git

# If you want to install from a specific branch:
# bench get-app surgical_training https://github.com/DucHai972/surgical-training-app.git --branch main
```

### Step 5: Install Apps on Site

```bash
# Install ERPNext on the site (optional)
bench --site surgical-training.local install-app erpnext

# Install Surgical Training app on the site
bench --site surgical-training.local install-app surgical_training
```

### Step 6: Setup Database and Migrate

```bash
# Run database migrations
bench --site surgical-training.local migrate

# Create initial data and setup
bench --site surgical-training.local install-app surgical_training
```

### Step 7: Create User Roles

1. Start the development server:
```bash
bench start
```

2. Open your browser and go to: `http://surgical-training.local:8000`
3. Login with Administrator credentials
4. Go to **User and Permissions > Role** 
5. Create a new role called **"Physician"**
6. Assign appropriate permissions to the Physician role for Doctor, Session, Video, and VideoComment doctypes

### Step 8: Build Frontend Assets

```bash
# Navigate to frontend directory
cd apps/surgical_training/frontend

# Install frontend dependencies
yarn install
# OR if you prefer npm: npm install

# Build the frontend for production
yarn build
# OR: npm run build

# Go back to bench directory
cd ../../../
```

## Development Setup

### For Backend Development

```bash
# Start the development server
bench start

# In another terminal, watch for changes
bench watch
```

### For Frontend Development

```bash
# Navigate to frontend directory
cd apps/surgical_training/frontend

# Start the frontend development server
yarn dev
# OR: npm run dev

# The frontend will be available at the URL shown in terminal
```

### Making Changes

- **Backend**: Edit DocTypes in `surgical_training/doctype/` directory
- **API**: Add server-side logic in `surgical_training/api/` directory  
- **Frontend**: Edit React components in `frontend/src/` directory
- **Routes**: Frontend routes available at `/surgical_training/`
- **API Endpoints**: Available under `/api/method/surgical_training.api.*`

## Production Deployment

### Using Bench

```bash
# Set production mode
bench --site surgical-training.local set-config developer_mode 0

# Setup production
bench setup production your-username

# Enable site
bench --site surgical-training.local enable-scheduler

# Start services
sudo supervisorctl start all
```

### Using Docker (Alternative)

A `Dockerfile` and `docker-compose.yml` will be added in future releases for easier deployment.

## Troubleshooting

### Common Issues

**1. Permission Errors**
```bash
# Fix bench permissions
sudo chown -R $USER:$USER /path/to/surgical_training_workspace
```

**2. Database Connection Issues**
```bash
# Check MariaDB service
sudo systemctl status mariadb
sudo systemctl start mariadb

# Reset MariaDB root password if needed
sudo mysql_secure_installation
```

**3. Node.js Version Issues**
```bash
# Check Node version (should be 16+)
node --version

# Install/update Node if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

**4. Frontend Build Errors**
```bash
# Clear node modules and reinstall
cd apps/surgical_training/frontend
rm -rf node_modules package-lock.json
npm install
# OR: yarn install
```

**5. Site Access Issues**
```bash
# Add site to /etc/hosts (for local development)
echo "127.0.0.1 surgical-training.local" | sudo tee -a /etc/hosts

# OR use localhost
bench --site surgical-training.local set-config host_name "http://localhost:8000"
```

### Getting Help

- **Frappe Documentation**: https://frappeframework.com/docs
- **Frappe Community**: https://discuss.erpnext.com
- **Issues**: https://github.com/DucHai972/surgical-training-app/issues

## Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## System Requirements

### Minimum Requirements
- **RAM**: 4GB 
- **Storage**: 10GB free space
- **CPU**: 2 cores
- **OS**: Ubuntu 18.04+, macOS 10.14+, or Windows 10 (via WSL2)

### Recommended Requirements
- **RAM**: 8GB+
- **Storage**: 20GB+ free space  
- **CPU**: 4+ cores
- **OS**: Ubuntu 20.04+ or macOS 11+

## License

This project is licensed under the MIT License - see the [LICENSE](license.txt) file for details.

## Acknowledgments

- Built on the powerful [Frappe Framework](https://frappeframework.com/)
- Frontend powered by [React](https://reactjs.org/)
- Video player functionality enhanced with modern web APIs

---

**Need help?** Open an issue on [GitHub](https://github.com/DucHai972/surgical-training-app/issues) or check our documentation.
