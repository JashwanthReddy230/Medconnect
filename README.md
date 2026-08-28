# MedConnect

MedConnect is a full-stack healthcare/medical appointment management application designed to connect patients, doctors, and healthcare services through a modern web platform.

## 📁 Project Structure

```text
MedConnect/
│
├── medconnect frontend/    # Frontend application
│
├── medconnect backend/     # Backend application
│
├── .gitignore
└── README.md
```

## 🚀 Features

### 👤 Patient

* User registration and login
* Patient profile management
* Search and view doctors
* View doctor details
* Book appointments
* Manage appointments
* Continue/resume appointments
* View appointment information

### 👨‍⚕️ Doctor

* Doctor authentication
* Doctor profile management
* Manage appointments
* View patient information
* Manage availability
* Handle appointment requests

### 🏥 Healthcare Management

* Doctor and patient management
* Appointment scheduling
* Role-based access
* Secure authentication
* API-based frontend/backend communication

## 🛠️ Technologies

### Frontend

* React
* JavaScript
* Vite
* React Router
* Tailwind CSS
* Axios
* React Hot Toast
* Heroicons

### Backend

* Java
* Spring Boot
* Spring Security
* REST APIs
* Maven

### Database

* MySQL / PostgreSQL

> Use the database configured in the backend project's application configuration.

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/JashwanthReddy230/Medconnect.git
```

Go into the project:

```bash
cd Medconnect
```

## 🎨 Frontend Setup

Open a terminal:

```bash
cd "medconnect frontend"
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

## ⚙️ Backend Setup

Open another terminal:

```bash
cd "medconnect backend"
```

Make sure Java and Maven are installed.

Run the Spring Boot application using Maven:

```bash
mvn spring-boot:run
```

Alternatively, if the Maven wrapper is included:

### Windows

```bash
mvnw.cmd spring-boot:run
```

### Linux/macOS

```bash
./mvnw spring-boot:run
```

The backend will normally run on:

```text
http://localhost:8080
```

## 🗄️ Database Configuration

Configure your database connection in the backend configuration file.

For example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/medconnect
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

**Do not commit real passwords, API keys, JWT secrets, or other sensitive credentials to GitHub.**

Use environment variables or a local configuration file for secrets.

## 🔐 Environment Variables

If your application uses environment variables, create local `.env` or configuration files as required.

Example:

```text
DATABASE_URL=
DATABASE_USERNAME=
DATABASE_PASSWORD=
JWT_SECRET=
API_URL=
```

Never upload real credentials to the repository.

## 🔄 Development Workflow

Pull the latest changes:

```bash
git pull origin main
```

Check changes:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Describe your changes"
```

Push:

```bash
git push
```

## 📌 Future Improvements

* Online doctor consultation
* Video consultation
* Online payment integration
* Prescription management
* Medical reports
* Notifications
* Email/SMS appointment reminders
* Advanced doctor search and filtering
* Admin dashboard
* Analytics and reporting

## 👨‍💻 Developer

**Jashwanth Reddy Mardhi**

GitHub:
https://github.com/JashwanthReddy230/Medconnect
https://github.com/JashwanthReddy230

## 📄 License

This project is currently intended for educational and development purposes.
