# Student ERP Portal

A full-stack student management portal built with React, Node.js, and MongoDB.

## Features
- **Student Login**: Secure authentication for students.
- **Academic Dashboard**: Overview of subjects, attendance, and assignments.
- **Subject Hub**: Detailed view of subjects with assigned teachers and test averages.
- **Results Tracking**: View exam results and academic performance.
- **Fee Management**: Track and pay course fees.

## Getting Started (Local Development)

### Prerequisites
- Node.js installed.
- MongoDB (Local or Cloud URL).

### 1. Installation
Run the following command in the root directory to install all dependencies for both frontend and backend:
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the `backend/` directory with the following variables:
```env
PORT=5005
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create a `.env` file in the `frontend/` directory with:
```env
VITE_API_BASE_URL=http://localhost:5005
VITE_ENABLE_PUSH=false
VITE_SUPPORT_ADMIN_EMAIL=ighost474@gmail.com
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_ADMIN_TEMPLATE_ID=your_admin_template_id
VITE_EMAILJS_STUDENT_TEMPLATE_ID=your_student_template_id
```

### 3. Run the App
Run the following command in the root directory:
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5005

---

## Deployment (Vercel)

This project is pre-configured for **Vercel**.

1. Connect your GitHub repository to Vercel.
2. Set the **environment variables** in the Vercel project dashboard (same as in `.env`).
3. Vercel will automatically detect the `vercel.json` and deploy both the frontend and backend.

- The backend entry point is `api/index.js`.
- The frontend is built into `frontend/dist/`.
- If an installable APK exists during build, it is published as `https://student.defactoinstitute.in/defacto-student-erp.apk` and also aliased at `https://student.defactoinstitute.in/app-debug.apk`.

---

## EmailJS Requirements (Support Tickets)

The Contact & Support form now sends emails using EmailJS directly from the frontend.

Required setup:
1. Create an EmailJS account and connect your email provider (Gmail/Outlook/SMTP).
2. Create one service and copy `Service ID`.
3. Create templates:
	- Admin template (`VITE_EMAILJS_ADMIN_TEMPLATE_ID`) for support team notification.
	- Student template (`VITE_EMAILJS_STUDENT_TEMPLATE_ID`) for acknowledgement mail.
4. Add frontend env variables listed above.
5. In both templates, include these variables in template content:
	- `to_email`
	- `ticket_category`
	- `ticket_subject`
	- `ticket_message`
	- `raised_at`
	- `student_name`
	- `student_roll_no`
	- `student_email`
	- `student_class`
	- `student_batch`
	- `recipient_type`

Important:
- Vite exposes `VITE_*` values to the browser, so only use EmailJS public credentials there.
- Do not put backend secrets in frontend env files.
